import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { categoryIcon } from '../lib/constants';
import StoreLayout from '../components/StoreLayout';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';
import { EmptyState, Skeleton, Alert } from '../components/ui';

const SORTS = {
  name: { label: 'Nombre (A–Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  price_asc: { label: 'Precio: menor a mayor', fn: (a, b) => a.price - b.price },
  price_desc: { label: 'Precio: mayor a menor', fn: (a, b) => b.price - a.price },
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'name';
  const onlyAvailable = params.get('disponibles') === '1';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError('');
    api.getProducts(search, category)
      .then(list => { if (!cancelled) setProducts(list); })
      .catch(err => { if (!cancelled) { setError(err.message); setProducts([]); } });
    return () => { cancelled = true; };
  }, [search, category]);

  function update(next) {
    const merged = { search, category, sort, disponibles: onlyAvailable ? '1' : '', ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'sort' && v === 'name')));
    setParams(clean);
  }

  const visible = useMemo(() => {
    if (!products) return null;
    let list = products.map(p => ({ ...p, price: Number(p.price) }));
    if (onlyAvailable) list = list.filter(p => p.stock > 0);
    return list.sort(SORTS[sort]?.fn || SORTS.name.fn);
  }, [products, sort, onlyAvailable]);

  const currentCategory = categories.find(c => String(c.id) === category);
  const title = search ? `Resultados para “${search}”` : currentCategory ? currentCategory.name : 'Catálogo';

  return (
    <StoreLayout>
      <div className="container shop">
        <aside className="shop-sidebar">
          <h3 className="sidebar-title">Categorías</h3>
          <nav className="category-list">
            <button className={!category ? 'active' : ''} onClick={() => update({ category: '' })}>
              <Icon name="package" size={18} /> Todas
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={category === String(c.id) ? 'active' : ''}
                onClick={() => update({ category: String(c.id) })}
              >
                <Icon name={categoryIcon(c.name)} size={18} /> {c.name}
              </button>
            ))}
          </nav>
        </aside>

        <section className="shop-content">
          <nav className="breadcrumbs" aria-label="Ruta">
            <Link to="/">Inicio</Link><Icon name="chevronRight" size={14} />
            <span>Catálogo</span>
            {currentCategory && <><Icon name="chevronRight" size={14} /><span>{currentCategory.name}</span></>}
          </nav>

          <div className="shop-head">
            <div>
              <h1>{title}</h1>
              <p className="text-muted">
                {visible ? `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}` : 'Cargando productos…'}
              </p>
            </div>
            <div className="shop-tools">
              <label className="switch">
                <input type="checkbox" checked={onlyAvailable} onChange={e => update({ disponibles: e.target.checked ? '1' : '' })} />
                <span className="switch-track" />
                Solo disponibles
              </label>
              <select className="input input-sm" value={sort} onChange={e => update({ sort: e.target.value })} aria-label="Ordenar">
                {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="chip-row shop-chips">
            <button className={`chip ${!category ? 'active' : ''}`} onClick={() => update({ category: '' })}>Todas</button>
            {categories.map(c => (
              <button key={c.id} className={`chip ${category === String(c.id) ? 'active' : ''}`} onClick={() => update({ category: String(c.id) })}>
                {c.name}
              </button>
            ))}
          </div>

          {(search || category) && (
            <div className="active-filters">
              {search && (
                <button className="chip chip-removable" onClick={() => update({ search: '' })}>
                  “{search}” <Icon name="x" size={14} />
                </button>
              )}
              {currentCategory && (
                <button className="chip chip-removable" onClick={() => update({ category: '' })}>
                  {currentCategory.name} <Icon name="x" size={14} />
                </button>
              )}
              <button className="link-btn" onClick={() => setParams({})}>Limpiar filtros</button>
            </div>
          )}

          {error && <Alert>{error}</Alert>}

          {visible === null ? (
            <div className="products-grid">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={340} radius={14} />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon="search"
              title="No encontramos productos"
              action={<button className="btn btn-outline" onClick={() => setParams({})}>Ver todo el catálogo</button>}
            >
              Prueba con otra palabra o revisa otra categoría. También puedes llamarnos y te ayudamos a encontrarlo.
            </EmptyState>
          ) : (
            <div className="products-grid">
              {visible.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </StoreLayout>
  );
}
