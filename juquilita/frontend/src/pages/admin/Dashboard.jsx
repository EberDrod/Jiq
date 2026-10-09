import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { money, timeAgo } from '../../lib/format';
import { ORDER_FLOW, STATUS } from '../../lib/constants';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { Alert, EmptyState, Skeleton, StatusBadge } from '../../components/ui';

const DAY = new Intl.DateTimeFormat('es-MX', { weekday: 'short' });

function SalesChart({ data }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map(d => d.total), 1);
  const week = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Ventas de los últimos 7 días</h3>
          <p className="text-muted text-sm">Sin contar pedidos cancelados</p>
        </div>
        <strong className="card-head-value">{money(week)}</strong>
      </div>
      <div className="bar-chart" role="img" aria-label={`Ventas por día, total ${money(week)}`}>
        {data.map((d, i) => {
          const day = new Date(`${d.day}T12:00:00`);
          const isToday = i === data.length - 1;
          return (
            <div
              key={d.day}
              className="bar-col"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              {hover === i && (
                <div className="bar-tooltip">
                  <strong>{money(d.total)}</strong>
                  <span>{d.orders} {d.orders === 1 ? 'pedido' : 'pedidos'}</span>
                </div>
              )}
              <div className="bar-track">
                <div className={`bar ${hover === i ? 'is-hover' : ''}`} style={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 3 : 0)}%` }} />
              </div>
              <span className={`bar-label ${isToday ? 'is-today' : ''}`}>{isToday ? 'Hoy' : DAY.format(day).replace('.', '')}</span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Ventas por día</caption>
        <tbody>{data.map(d => <tr key={d.day}><td>{d.day}</td><td>{money(d.total)}</td><td>{d.orders}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Kpi({ icon, label, value, hint, tone, to }) {
  const body = (
    <>
      <div className={`kpi-icon kpi-${tone}`}><Icon name={icon} size={20} /></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </>
  );
  return to ? <Link to={to} className="kpi kpi-link">{body}</Link> : <div className="kpi">{body}</div>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    api.getDashboard().then(setData).catch(err => setError(err.message));
  }, []);

  const toAttend = data ? data.orders_by_status.RECEIVED + data.orders_by_status.PREPARING : 0;
  const totalActive = data ? ORDER_FLOW.reduce((s, k) => s + data.orders_by_status[k], 0) : 0;

  return (
    <AdminLayout
      title={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
      subtitle={new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
      actions={<Link to="/admin/pedidos" className="btn btn-primary btn-sm"><Icon name="clipboard" size={16} /> Ver pedidos</Link>}
    >
      {error && <Alert>{error}</Alert>}
      {!data ? (
        <div className="kpi-grid">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={128} radius={14} />)}</div>
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi icon="trendUp" tone="brand" label="Ventas de hoy" value={money(data.today_total)} hint={`${data.today_orders} ${data.today_orders === 1 ? 'pedido' : 'pedidos'} hoy`} />
            <Kpi icon="clipboard" tone="info" label="Por atender" value={toAttend} hint={`${data.new_orders} nuevos sin revisar`} to="/admin/pedidos?estado=RECEIVED" />
            <Kpi icon="alert" tone="warning" label="Stock bajo" value={data.low_stock} hint="Productos en o bajo el mínimo" to="/admin/inventario?filtro=bajo" />
            <Kpi icon="package" tone="neutral" label="Productos activos" value={data.total_products} hint="En el catálogo público" to="/admin/productos" />
          </div>

          <div className="dash-grid">
            <SalesChart data={data.sales_last_7_days} />

            <div className="card">
              <div className="card-head"><h3>Flujo de pedidos</h3></div>
              <ul className="pipeline">
                {[...ORDER_FLOW, 'CANCELLED'].map(s => {
                  const count = data.orders_by_status[s];
                  const pct = totalActive ? (count / (totalActive + data.orders_by_status.CANCELLED)) * 100 : 0;
                  return (
                    <li key={s}>
                      <Link to={`/admin/pedidos?estado=${s}`} className="pipeline-row">
                        <StatusBadge status={s} />
                        <span className="pipeline-bar"><span className={`pipeline-fill tone-${STATUS[s].tone}`} style={{ width: `${pct}%` }} /></span>
                        <strong>{count}</strong>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="card card-flush">
              <div className="card-head card-head-pad">
                <h3>Pedidos recientes</h3>
                <Link to="/admin/pedidos" className="link-arrow text-sm">Ver todos <Icon name="arrowRight" size={14} /></Link>
              </div>
              {data.recent_orders.length === 0 ? (
                <EmptyState icon="clipboard" title="Aún no hay pedidos">Cuando un cliente haga un pedido aparecerá aquí.</EmptyState>
              ) : (
                <ul className="list">
                  {data.recent_orders.map(o => (
                    <li key={o.id}>
                      <Link to={`/admin/pedidos/${o.id}`} className="list-row">
                        <span className="list-main">
                          <strong>{o.folio}</strong>
                          <small>{o.customer_name} · {timeAgo(o.created_at)}</small>
                        </span>
                        <StatusBadge status={o.status} />
                        <span className="list-amount">{money(o.total)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card card-flush">
              <div className="card-head card-head-pad">
                <h3>Por agotarse</h3>
                <Link to="/admin/inventario?filtro=bajo" className="link-arrow text-sm">Inventario <Icon name="arrowRight" size={14} /></Link>
              </div>
              {data.low_stock_products.length === 0 ? (
                <EmptyState icon="checkCircle" title="Todo en orden">Ningún producto está por debajo del mínimo.</EmptyState>
              ) : (
                <ul className="list">
                  {data.low_stock_products.map(p => (
                    <li key={p.id}>
                      <Link to={`/admin/inventario?filtro=bajo&q=${encodeURIComponent(p.name)}`} className="list-row">
                        <span className="list-main">
                          <strong>{p.name}</strong>
                          <small>{p.category_name || 'Sin categoría'} · mínimo {p.minimum_stock}</small>
                        </span>
                        <span className={`stock-pill ${p.stock === 0 ? 'is-out' : 'is-low'}`}>
                          {p.stock === 0 ? 'Agotado' : `${p.stock} ${p.unit}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
