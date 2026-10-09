const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../services/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    const { items, customer_name, customer_phone, delivery_type, address, references, payment_method } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }
    if (!customer_name || !customer_phone || !delivery_type || !payment_method) {
      return res.status(400).json({ error: 'Faltan datos del cliente' });
    }
    if (!['pickup', 'delivery'].includes(delivery_type)) {
      return res.status(400).json({ error: 'Tipo de entrega inválido' });
    }
    if (!['pay_on_pickup', 'pay_on_delivery'].includes(payment_method)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }
    if (String(customer_phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'El teléfono debe tener al menos 10 dígitos' });
    }
    if (delivery_type === 'delivery' && !address) {
      return res.status(400).json({ error: 'La dirección es requerida para entrega a domicilio' });
    }

    await client.query('BEGIN');

    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await client.query(
        'SELECT * FROM products WHERE id = $1 AND active = true FOR UPDATE',
        [item.product_id]
      );
      if (product.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Producto con id ${item.product_id} no encontrado` });
      }

      const p = product.rows[0];
      item.quantity = Number(item.quantity);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Cantidad inválida para ${p.name}` });
      }
      if (item.quantity > p.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `No hay suficiente stock de ${p.name}. Disponible: ${p.stock}` });
      }

      const subtotal = parseFloat(p.price) * item.quantity;
      total += subtotal;

      validatedItems.push({
        product_id: p.id,
        product_name: p.name,
        quantity: item.quantity,
        unit_price: parseFloat(p.price),
        subtotal,
        current_stock: p.stock,
      });
    }

    const folioResult = await client.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 5) AS INTEGER)), 1000) + 1 as next_folio FROM orders"
    );
    const folio = `JUQ-${folioResult.rows[0].next_folio}`;

    const order = await client.query(
      `INSERT INTO orders (folio, customer_name, customer_phone, delivery_type, address, "references", payment_method, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [folio, customer_name, customer_phone, delivery_type, address || null, references || null, payment_method, total]
    );
    const orderId = order.rows[0].id;

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
      );

      const newStock = item.current_stock - item.quantity;
      await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, item.product_id]);

      await client.query(
        `INSERT INTO inventory_movements (product_id, order_id, type, quantity, previous_stock, new_stock, notes)
         VALUES ($1,$2,'ORDER',$3,$4,$5,$6)`,
        [item.product_id, orderId, item.quantity, item.current_stock, newStock, `Pedido ${folio}`]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear pedido' });
  } finally {
    client.release();
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, COALESCE(SUM(oi.quantity), 0)::int AS items_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/folio/:folio', async (req, res) => {
  try {
    const order = await db.query('SELECT * FROM orders WHERE UPPER(folio) = UPPER($1)', [req.params.folio.trim()]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    const items = await db.query(
      `SELECT oi.*, p.image_url, p.unit
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.rows[0].id]
    );
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    const items = await db.query(
      `SELECT oi.*, p.image_url, p.unit
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.rows[0].id]
    );
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  const client = await db.connect();
  try {
    const { status } = req.body;
    const validStatuses = ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await client.query('BEGIN');

    const order = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const currentOrder = order.rows[0];

    if (currentOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Un pedido cancelado no puede reactivarse' });
    }

    if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
      const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [currentOrder.id]);

      for (const item of items.rows) {
        const product = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        const previousStock = product.rows[0].stock;
        const newStock = previousStock + item.quantity;

        await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, item.product_id]);

        await client.query(
          `INSERT INTO inventory_movements (product_id, order_id, type, quantity, previous_stock, new_stock, notes)
           VALUES ($1,$2,'CANCELLATION',$3,$4,$5,$6)`,
          [item.product_id, currentOrder.id, item.quantity, previousStock, newStock, `Cancelación pedido ${currentOrder.folio}`]
        );
      }
    }

    const result = await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  } finally {
    client.release();
  }
});

module.exports = router;
