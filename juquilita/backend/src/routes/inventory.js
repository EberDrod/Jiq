const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../services/auth');
const router = express.Router();

router.post('/entry', authMiddleware, async (req, res) => {
  const client = await db.connect();
  try {
    const { product_id, notes } = req.body;
    const quantity = Number(req.body.quantity);
    if (!product_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
    }

    await client.query('BEGIN');

    const product = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [product_id]);
    if (product.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const previousStock = product.rows[0].stock;
    const newStock = previousStock + quantity;

    await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, product_id]);

    const movement = await client.query(
      `INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, notes)
       VALUES ($1, 'ENTRY', $2, $3, $4, $5) RETURNING *`,
      [product_id, quantity, previousStock, newStock, notes || 'Entrada de mercancía']
    );

    await client.query('COMMIT');
    res.status(201).json(movement.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al registrar entrada' });
  } finally {
    client.release();
  }
});

router.post('/exit', authMiddleware, async (req, res) => {
  const client = await db.connect();
  try {
    const { product_id, notes } = req.body;
    const quantity = Number(req.body.quantity);
    if (!product_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
    }

    await client.query('BEGIN');

    const product = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [product_id]);
    if (product.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const previousStock = product.rows[0].stock;
    if (quantity > previousStock) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay suficiente stock' });
    }

    const newStock = previousStock - quantity;

    await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, product_id]);

    const movement = await client.query(
      `INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, notes)
       VALUES ($1, 'EXIT', $2, $3, $4, $5) RETURNING *`,
      [product_id, quantity, previousStock, newStock, notes || 'Salida de mercancía']
    );

    await client.query('COMMIT');
    res.status(201).json(movement.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al registrar salida' });
  } finally {
    client.release();
  }
});

router.get('/movements', authMiddleware, async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (req.query.product_id) {
      params.push(req.query.product_id);
      where = 'WHERE im.product_id = $1';
    }
    const result = await db.query(
      `SELECT im.*, p.name as product_name, p.unit, o.folio
       FROM inventory_movements im
       JOIN products p ON im.product_id = p.id
       LEFT JOIN orders o ON im.order_id = o.id
       ${where}
       ORDER BY im.created_at DESC
       LIMIT 100`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

module.exports = router;
