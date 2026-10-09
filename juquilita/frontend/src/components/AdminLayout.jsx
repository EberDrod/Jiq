import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Icon from './Icon';

const LINKS = [
  { path: '/admin', label: 'Resumen', icon: 'dashboard', end: true },
  { path: '/admin/pedidos', label: 'Pedidos', icon: 'clipboard', badge: 'orders' },
  { path: '/admin/productos', label: 'Productos', icon: 'package' },
  { path: '/admin/inventario', label: 'Inventario', icon: 'warehouse' },
];

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || { name: 'Administrador' };
  } catch {
    return { name: 'Administrador' };
  }
}

export default function AdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const user = currentUser();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    api.getDashboard().then(d => setPending(d.new_orders)).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    if (title) document.title = `${title} · Juquilita Admin`;
    return () => { document.title = 'Juquilita — Tlapalería en línea'; };
  }, [title]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  }

  return (
    <div className="admin">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Link to="/admin" className="brand brand-dark">
          <span className="brand-mark"><Icon name="hammer" size={18} strokeWidth={2.2} /></span>
          <span className="brand-text"><strong>JUQUILITA</strong><small>Panel de control</small></span>
        </Link>

        <nav className="admin-nav">
          {LINKS.map(l => (
            <NavLink key={l.path} to={l.path} end={l.end} className="admin-nav-link">
              <Icon name={l.icon} size={19} />
              <span>{l.label}</span>
              {l.badge === 'orders' && pending > 0 && <span className="admin-nav-badge">{pending}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer" className="admin-nav-link">
            <Icon name="store" size={19} /><span>Ver tienda</span>
          </a>
          <div className="admin-user">
            <span className="avatar">{user.name?.[0] || 'A'}</span>
            <span className="admin-user-info">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <button className="icon-btn icon-btn-dark" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      {open && <div className="admin-scrim" onClick={() => setOpen(false)} />}

      <div className="admin-body">
        <header className="admin-topbar">
          <button className="icon-btn admin-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <div className="admin-topbar-title">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="admin-topbar-actions">{actions}</div>}
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
