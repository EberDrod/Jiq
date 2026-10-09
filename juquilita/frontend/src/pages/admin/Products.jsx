import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { money, placeholderImage } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { Badge, EmptyState, Field, Modal, Skeleton, Spinner, StockBadge } from '../../components/ui';

const EMPTY = {
  name: '', brand: '', category_id: '', description: '', price: '', cost: '',
  stock: '', minimum_stock: '5', unit: 'pieza', image_url: '', active: true,
};
const UNITS = ['pieza', 'paquete', 'kg', 'litro', 'metro', 'bulto', 'bote', 'caja', 'rollo'];

function ProductForm({ product, categories, onCategoryCreated, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(product ? {
    name: product.name, brand: product.brand || '', category_id: product.category_id || '',
    description: product.description || '', price: product.price, cost: product.cost || '',
    stock: product.stock, minimum_stock: product.minimum_stock, unit: product.unit || 'pieza',
    image_url: product.image_url || '', active: product.active,
  } : EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState(null);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  const price = parseFloat(form.price);
  const cost = parseFloat(form.cost);
  const margin = price > 0 && cost > 0 ? ((price - cost) / price) * 100 : null;

  async function createCategory() {
    const name = newCategory?.trim();
    if (!name) return;
    try {
      const cat = await api.createCategory(name);
      onCategoryCreated(cat);
      set('category_id', cat.id);
      setNewCategory(null);
      toast.success(`Categoría “${cat.name}” creada`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio.';
    if (!(price >= 0) || form.price === '') errs.price = 'Escribe un precio válido.';
    if (form.cost !== '' && !(cost >= 0)) errs.cost = 'Costo inválido.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        unit: form.unit.trim() || 'pieza',
        image_url: form.image_url.trim(),
        price,
        cost: form.cost ? cost : 0,
        minimum_stock: parseInt(form.minimum_stock) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        active: form.active,
      };
      if (product) {
        await api.updateProduct(product.id, data);
      } else {
        data.stock = parseInt(form.stock) || 0;
        await api.createProduct(data);
      }
      toast.success(product ? 'Producto actualizado' : 'Producto creado');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={product ? 'Editar producto' : 'Nuevo producto'}
      subtitle={product ? product.name : 'Agrega un producto al catálogo.'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner size={16} />} {product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="product-form">
        <div className="product-form-media">
          <div className="image-preview">
            {form.image_url ? <img src={form.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} onLoad={e => { e.currentTarget.style.display = ''; }} /> : null}
            <Icon name="image" size={28} />
          </div>
          <Field label="URL de imagen" htmlFor="p-img" optional>
            <input id="p-img" className="input" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" />
          </Field>
          {product && (
            <label className="switch switch-block">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
              <span className="switch-track" />
              <span>
                <strong>Visible en la tienda</strong>
                <small>Si lo desactivas, los clientes no podrán verlo.</small>
              </span>
            </label>
          )}
        </div>

        <div className="stack-sm">
          <Field label="Nombre" htmlFor="p-name" error={errors.name}>
            <input id="p-name" className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Martillo uña 16 oz" />
          </Field>
          <div className="form-grid">
            <Field label="Marca" htmlFor="p-brand" optional>
              <input id="p-brand" className="input" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </Field>
            <Field label="Categoría" htmlFor="p-cat">
              {newCategory === null ? (
                <select id="p-cat" className="input" value={form.category_id}
                  onChange={e => e.target.value === '__new' ? setNewCategory('') : set('category_id', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="__new">+ Nueva categoría…</option>
                </select>
              ) : (
                <div className="input-affix">
                  <input className="input" autoFocus value={newCategory} placeholder="Nombre de la categoría"
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCategory(); } if (e.key === 'Escape') { e.stopPropagation(); setNewCategory(null); } }} />
                  <button type="button" className="icon-btn" onClick={createCategory} aria-label="Crear categoría"><Icon name="check" size={18} /></button>
                  <button type="button" className="icon-btn" onClick={() => setNewCategory(null)} aria-label="Cancelar"><Icon name="x" size={18} /></button>
                </div>
              )}
            </Field>
          </div>
          <Field label="Descripción" htmlFor="p-desc" optional>
            <textarea id="p-desc" className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="form-grid form-grid-3">
            <Field label="Precio de venta" htmlFor="p-price" error={errors.price}>
              <div className="input-prefix"><span>$</span>
                <input id="p-price" className="input" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
            </Field>
            <Field label="Costo" htmlFor="p-cost" error={errors.cost} optional>
              <div className="input-prefix"><span>$</span>
                <input id="p-cost" className="input" type="number" min="0" step="0.01" inputMode="decimal" value={form.cost} onChange={e => set('cost', e.target.value)} />
              </div>
            </Field>
            <Field label="Margen">
              <div className={`readout ${margin !== null && margin < 15 ? 'readout-warn' : ''}`}>
                {margin === null ? '—' : `${margin.toFixed(0)}%`}
              </div>
            </Field>
          </div>
          <div className="form-grid form-grid-3">
            {!product ? (
              <Field label="Existencia inicial" htmlFor="p-stock">
                <input id="p-stock" className="input" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
              </Field>
            ) : (
              <Field label="Existencia" hint="Se ajusta desde Inventario">
                <div className="readout">{product.stock}</div>
              </Field>
            )}
            <Field label="Stock mínimo" htmlFor="p-min" hint="Para alertas">
              <input id="p-min" className="input" type="number" min="0" value={form.minimum_stock} onChange={e => set('minimum_stock', e.target.value)} />
            </Field>
            <Field label="Unidad" htmlFor="p-unit">
              <input id="p-unit" className="input" list="units" value={form.unit} onChange={e => set('unit', e.target.value)} />
              <datalist id="units">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [editing, setEditing] = useState(undefined);

  function load() {
    api.getAllProducts().then(setProducts).catch(err => { toast.error(err.message); setProducts([]); });
  }

  useEffect(() => {
    load();
    api.getCategories().then(setCategories).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    return products.filter(p =>
      (!q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)) &&
      (!category || String(p.category_id) === category) &&
      (visibility === 'all' || (visibility === 'active' ? p.active : !p.active)));
  }, [products, query, category, visibility]);

  async function toggleActive(p) {
    try {
      await api.updateProduct(p.id, { active: !p.active });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !p.active } : x));
      toast.success(p.active ? `${p.name} oculto de la tienda` : `${p.name} visible en la tienda`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <AdminLayout
      title="Productos"
      subtitle={products ? `${products.length} productos en el catálogo` : 'Catálogo'}
      actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing(null)}><Icon name="plus" size={16} /> Nuevo producto</button>}
    >
      <div className="card card-flush">
        <div className="toolbar">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o marca" aria-label="Buscar productos" />
          </div>
          <select className="input input-sm" value={category} onChange={e => setCategory(e.target.value)} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="segmented">
            {[['all', 'Todos'], ['active', 'Visibles'], ['inactive', 'Ocultos']].map(([k, l]) => (
              <button key={k} className={visibility === k ? 'active' : ''} onClick={() => setVisibility(k)}>{l}</button>
            ))}
          </div>
        </div>

        {visible === null ? (
          <div className="pad stack-sm">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={52} />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon="package" title="Sin productos" action={<button className="btn btn-primary" onClick={() => setEditing(null)}>Agregar producto</button>}>
            No hay productos que coincidan con los filtros.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Categoría</th><th className="num">Precio</th><th className="num">Margen</th><th className="num">Existencia</th><th>Estado</th><th aria-label="Acciones" /></tr>
              </thead>
              <tbody>
                {visible.map(p => {
                  const m = p.cost > 0 && p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : null;
                  return (
                    <tr key={p.id} className={p.active ? '' : 'is-muted'}>
                      <td>
                        <div className="cell-product">
                          <img src={p.image_url || placeholderImage(p.name)} alt="" loading="lazy" />
                          <div>
                            <div className="cell-main">{p.name}</div>
                            <div className="cell-sub">{p.brand || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category_name || <span className="text-muted">—</span>}</td>
                      <td className="num"><strong>{money(p.price)}</strong><div className="cell-sub">/ {p.unit}</div></td>
                      <td className="num">{m === null ? '—' : `${m.toFixed(0)}%`}</td>
                      <td className="num">{p.stock}</td>
                      <td>
                        {p.active ? <StockBadge stock={p.stock} minimum={p.minimum_stock} /> : <Badge tone="neutral">Oculto</Badge>}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn" onClick={() => toggleActive(p)} title={p.active ? 'Ocultar de la tienda' : 'Mostrar en la tienda'} aria-label={p.active ? 'Ocultar' : 'Mostrar'}>
                            <Icon name={p.active ? 'eye' : 'eyeOff'} size={18} />
                          </button>
                          <button className="icon-btn" onClick={() => setEditing(p)} title="Editar" aria-label={`Editar ${p.name}`}>
                            <Icon name="edit" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          categories={categories}
          onCategoryCreated={c => setCategories(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}
    </AdminLayout>
  );
}
