import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { categoryIcon } from '../lib/constants';
import StoreLayout from '../components/StoreLayout';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';
import { Skeleton } from '../components/ui';

const STEPS = [
  { icon: 'search', title: 'Busca', text: 'Encuentra lo que necesitas por nombre, marca o categoría.' },
  { icon: 'bag', title: 'Arma tu pedido', text: 'Elige cantidades. Ves el precio y la existencia al momento.' },
  { icon: 'clipboard', title: 'Confirma', text: 'Dinos si lo recoges o te lo llevamos. Pagas al recibir.' },
  { icon: 'checkCircle', title: 'Listo', text: 'Te damos un folio para seguir tu pedido en todo momento.' },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(null);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api.getProducts()
      .then(list => setFeatured(list.filter(p => p.stock > 0).slice(0, 8)))
      .catch(() => setFeatured([]));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/tienda?search=${encodeURIComponent(q)}` : '/tienda');
  }

  return (
    <StoreLayout>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="sparkle" size={14} /> Tu tlapalería de confianza, ahora en línea</span>
            <h1>Todo para tu casa, obra o reparación.</h1>
            <p>Herramientas, plomería, electricidad, pintura y más. Haz tu pedido en minutos y recógelo en tienda o recíbelo en tu domicilio.</p>
            <form className="hero-search" onSubmit={handleSearch} role="search">
              <Icon name="search" size={20} />
              <input
                type="search"
                placeholder="¿Qué necesitas? Cemento, tornillos, pintura…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Buscar productos"
              />
              <button className="btn btn-primary" type="submit">Buscar</button>
            </form>
            <div className="hero-trust">
              <span><Icon name="store" size={16} /> Recoge en tienda</span>
              <span><Icon name="truck" size={16} /> Entrega a domicilio</span>
              <span><Icon name="wallet" size={16} /> Paga al recibir</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-grid">
              {['hammer', 'droplet', 'zap', 'paintbrush', 'brick', 'bolt'].map(i => (
                <div key={i} className="hero-art-tile"><Icon name={i} size={34} strokeWidth={1.5} /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Compra por categoría</h2>
              <p className="text-muted">Ve directo a lo que buscas.</p>
            </div>
            <Link to="/tienda" className="link-arrow">Ver todo <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="category-grid">
            {categories === null
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={96} radius={14} />)
              : categories.map(cat => (
                <Link key={cat.id} to={`/tienda?category=${cat.id}`} className="category-tile">
                  <span className="category-tile-icon"><Icon name={categoryIcon(cat.name)} size={22} /></span>
                  <span>{cat.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Lo más pedido</h2>
              <p className="text-muted">Productos con existencia, listos para tu pedido.</p>
            </div>
            <Link to="/tienda" className="link-arrow">Ver catálogo <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="products-grid">
            {featured === null
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={340} radius={14} />)
              : featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head-center">
            <h2>Comprar es fácil</h2>
            <p className="text-muted">Sin registro, sin tarjetas. Solo tu nombre y teléfono.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-icon"><Icon name={s.icon} size={22} /></span>
                <span className="step-num">Paso {i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>¿Ya hiciste un pedido?</h2>
              <p>Consulta en qué va con tu número de folio.</p>
            </div>
            <Link to="/rastrear" className="btn btn-light">Rastrear pedido <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
