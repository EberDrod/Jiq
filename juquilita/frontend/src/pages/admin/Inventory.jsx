import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { dateTime } from '../../lib/format';
import { MOVEMENT, stockStatus } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { Badge, EmptyState, Field, Modal, Skeleton, Spinner, StockBadge } from '../../components/ui';

function MovementModal({ product, initialType, onClose, onDone }) {
  const toast = useToast();
  const [type, setType] = useState(initialType);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const qty = parseInt(quantity) || 0;
  const isEntry = type === 'entry';
  const newStock = isEntry ? product.stock + qty : product.stock - qty;
  const invalid = qty <= 0 || (!isEntry && qty > product.stock);

  async function handleSubmit(e) {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      const data = { product_id: product.id, quantity: qty, notes: notes.trim() || undefined };
      await (isEntry ? api.inventoryEntry(data) : api.inventoryExit(data));
      toast.success(`${isEntry ? 'Entrada' : 'Salida'} registrada: ${product.name} ahora tiene ${newStock}`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Registrar movimiento"
      subtitle={product.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="mv-form" className="btn btn-primary" disabled={saving || invalid}>
            {saving && <Spinner size={16} />} Registrar {isEntry ? 'entrada' : 'salida'}
          </button>
        </>
      }
    >
      <form id="mv-form" onSubmit={handleSubmit} className="stack-md">
        <div className="segmented segmented-block">
          <button type="button" className={isEntry ? 'active' : ''} onClick={() => setType('entry')}><Icon name="arrowDown" size={16} /> Entrada</button>
          <button type="button" className={!isEntry ? 'active' : ''} onClick={() => setType('exit')}><Icon name="arrowUp" size={16} /> Salida</button>
        </div>

        <div className="stock-preview">
          <div><small>Actual</small><strong>{product.stock}</strong></div>
          <Icon name="arrowRight" size={18} />
          <div className={newStock < 0 ? 'is-bad' : qty ? 'is-new' : ''}><small>Nuevo</small><strong>{qty ? newStock : '—'}</strong></div>
          <span className="text-muted text-sm">{product.unit}</span>
        </div>

        <Field label="Cantidad" htmlFor="mv-qty" error={!isEntry && qty > product.stock ? `Solo hay ${product.stock} en existencia.` : undefined}>
          <input id="mv-qty" className="input input-lg" type="number" min="1" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
        </Field>
        <div className="chip-row">
          {[1, 5, 10, 25, 50].map(n => (
            <button type="button" key={n} className="chip" onClick={() => setQuantity(String(n))}>{n}</button>
          ))}
        </div>
        <Field label="Nota" htmlFor="mv-notes" optional>
          <input id="mv-notes" className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={isEntry ? 'Ej. Compra a proveedor' : 'Ej. Merma, uso interno, venta en mostrador'} />
        </Field>
      </form>
    </Modal>
  );
}

function StockLevel({ stock, minimum }) {
  const target = Math.max(minimum * 3, 1);
  const pct = Math.min(100, (stock / target) * 100);
  const s = stockStatus(stock, minimum);
  return (
    <div className="stock-level" title={`Mínimo: ${minimum}`}>
      <span className={`stock-level-fill tone-${s.tone}`} style={{ width: `${pct}%` }} />
      <span className="stock-level-min" style={{ left: `${Math.min(100, (minimum / target) * 100)}%` }} />
    </div>
  );
}

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const view = params.get('vista') === 'movimientos' ? 'movements' : 'stock';
  const filter = params.get('filtro') || 'todos';
  const [query, setQuery] = useState(params.get('q') || '');
  const [products, setProducts] = useState(null);
  const [movements, setMovements] = useState(null);
  const [modal, setModal] = useState(null);

  function loadProducts() {
    api.getAllProducts().then(setProducts).catch(() => setProducts([]));
  }

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => {
    if (view === 'movements') api.getMovements().then(setMovements).catch(() => setMovements([]));
  }, [view]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('q');
    setParams(next);
  }

  const counts = useMemo(() => ({
    todos: products?.length || 0,
    bajo: products?.filter(p => p.stock > 0 && p.stock <= p.minimum_stock).length || 0,
    agotado: products?.filter(p => p.stock <= 0).length || 0,
  }), [products]);

  const visible = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    return products
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .filter(p => filter === 'bajo' ? p.stock <= p.minimum_stock : filter === 'agotado' ? p.stock <= 0 : true)
      .sort((a, b) => filter === 'todos' ? a.name.localeCompare(b.name) : a.stock - b.stock);
  }, [products, query, filter]);

  const visibleMovements = useMemo(() => {
    if (!movements) return null;
    const q = query.trim().toLowerCase();
    return movements.filter(m => !q || m.product_name.toLowerCase().includes(q) || m.folio?.toLowerCase().includes(q));
  }, [movements, query]);

  return (
    <AdminLayout title="Inventario" subtitle="Existencias, entradas y salidas de mercancía.">
      <div className="tabs">
        <button className={`tab ${view === 'stock' ? 'active' : ''}`} onClick={() => setParam('vista', '')}>
          <Icon name="warehouse" size={16} /> Existencias
        </button>
        <button className={`tab ${view === 'movements' ? 'active' : ''}`} onClick={() => setParam('vista', 'movimientos')}>
          <Icon name="history" size={16} /> Movimientos
        </button>
      </div>

      <div className="card card-flush">
        <div className="toolbar">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={view === 'stock' ? 'Buscar producto' : 'Buscar producto o folio'} aria-label="Buscar" />
          </div>
          {view === 'stock' && (
            <div className="segmented">
              {[['todos', 'Todos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados']].map(([k, l]) => (
                <button key={k} className={filter === k ? 'active' : ''} onClick={() => setParam('filtro', k === 'todos' ? '' : k)}>
                  {l} <span className="seg-count">{k === 'bajo' ? counts.bajo + counts.agotado : counts[k]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {view === 'stock' ? (
          visible === null ? (
            <div className="pad stack-sm">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={48} />)}</div>
          ) : visible.length === 0 ? (
            <EmptyState icon="checkCircle" title="Nada por aquí">No hay productos que coincidan.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Producto</th><th className="num">Existencia</th><th className="col-level">Nivel</th><th className="num">Mínimo</th><th>Estado</th><th aria-label="Acciones" /></tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.id}>
                      <td><div className="cell-main">{p.name}</div><div className="cell-sub">{p.category_name || 'Sin categoría'}</div></td>
                      <td className="num"><strong>{p.stock}</strong> <span className="cell-sub">{p.unit}</span></td>
                      <td className="col-level"><StockLevel stock={p.stock} minimum={p.minimum_stock} /></td>
                      <td className="num">{p.minimum_stock}</td>
                      <td><StockBadge stock={p.stock} minimum={p.minimum_stock} /></td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-soft btn-sm" onClick={() => setModal({ product: p, type: 'entry' })}><Icon name="arrowDown" size={15} /> Entrada</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setModal({ product: p, type: 'exit' })} disabled={p.stock === 0}><Icon name="arrowUp" size={15} /> Salida</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : visibleMovements === null ? (
          <div className="pad stack-sm">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={44} />)}</div>
        ) : visibleMovements.length === 0 ? (
          <EmptyState icon="history" title="Sin movimientos">Las entradas, salidas y pedidos aparecerán aquí.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className="num">Cantidad</th><th className="num">Existencia</th><th>Nota</th></tr>
              </thead>
              <tbody>
                {visibleMovements.map(m => {
                  const t = MOVEMENT[m.type] || { label: m.type, tone: 'neutral', sign: '' };
                  return (
                    <tr key={m.id}>
                      <td className="text-muted nowrap">{dateTime(m.created_at)}</td>
                      <td className="cell-main">{m.product_name}</td>
                      <td><Badge tone={t.tone}>{t.label}</Badge></td>
                      <td className="num"><strong className={t.sign === '+' ? 'text-success' : ''}>{t.sign}{m.quantity}</strong></td>
                      <td className="num nowrap"><span className="text-muted">{m.previous_stock} → </span>{m.new_stock}</td>
                      <td className="cell-sub">
                        {m.order_id ? <Link to={`/admin/pedidos/${m.order_id}`} className="text-brand">{m.notes}</Link> : m.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <MovementModal
          product={modal.product}
          initialType={modal.type}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadProducts(); setMovements(null); }}
        />
      )}
    </AdminLayout>
  );
}
