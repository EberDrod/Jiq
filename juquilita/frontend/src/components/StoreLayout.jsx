import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { STORE } from '../lib/constants';
import Icon from './Icon';

function SearchBox({ onDone }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(() => (
    location.pathname === '/tienda' ? new URLSearchParams(location.search).get('search') || '' : ''
  ));

  function submit(e) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/tienda?search=${encodeURIComponent(q)}` : '/tienda');
    onDone?.();
  }

  return (
    <form className="nav-search" onSubmit={submit} role="search">
      <Icon name="search" size={18} />
      <input
        type="search"
        placeholder="Buscar productos, marcas…"
        value={value}
        onChange={e => setValue(e.target.value)}
        aria-label="Buscar productos"
      />
    </form>
  );
}

function Navbar() {
  const { count } = useCart();
  const location = useLocation();
  const searchKey = location.pathname + location.search;
  const [bump, setBump] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  if (count !== prevCount) {
    setPrevCount(count);
    if (count > prevCount) setBump(true);
  }

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <header className="navbar">
      <div className="topbar">
        <div className="container topbar-inner">
          <span><Icon name="clock" size={14} /> {STORE.hours}</span>
          <span className="hide-sm"><Icon name="truck" size={14} /> Entrega a domicilio o recoge en tienda</span>
          <a href={`tel:${STORE.phone.replace(/\s/g, '')}`}><Icon name="phone" size={14} /> {STORE.phone}</a>
        </div>
      </div>
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Juquilita, inicio">
          <span className="brand-mark"><Icon name="hammer" size={18} strokeWidth={2.2} /></span>
          <span className="brand-text">
            <strong>JUQUILITA</strong>
            <small>{STORE.tagline}</small>
          </span>
        </Link>

        <div className="nav-search-wrap"><SearchBox key={searchKey} /></div>

        <nav className="navbar-links">
          <NavLink to="/tienda" className="nav-link">Catálogo</NavLink>
          <NavLink to="/rastrear" className="nav-link hide-sm">Rastrear pedido</NavLink>
          <NavLink to="/pedido" className={`cart-btn ${bump ? 'bump' : ''}`} aria-label={`Mi pedido, ${count} productos`}>
            <Icon name="bag" size={20} />
            <span className="hide-sm">Mi pedido</span>
            {count > 0 && <span className="cart-count">{count > 99 ? '99+' : count}</span>}
          </NavLink>
        </nav>
      </div>
      <div className="container nav-search-mobile"><SearchBox key={searchKey} /></div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer">
            <span className="brand-mark"><Icon name="hammer" size={18} strokeWidth={2.2} /></span>
            <span className="brand-text"><strong>JUQUILITA</strong><small>{STORE.tagline}</small></span>
          </div>
          <p className="footer-copy">Lo que necesitas para tu casa, obra o proyecto. Sin complicaciones.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <Link to="/tienda">Catálogo</Link>
          <Link to="/pedido">Mi pedido</Link>
          <Link to="/rastrear">Rastrear pedido</Link>
        </div>
        <div>
          <h4>Contacto</h4>
          <span><Icon name="phone" size={14} /> {STORE.phone}</span>
          <span><Icon name="clock" size={14} /> {STORE.hours}</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Juquilita</span>
        <Link to="/admin">Acceso administrador</Link>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="store">
      <Navbar />
      <main className="store-main">{children}</main>
      <Footer />
    </div>
  );
}
