import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { dateTime, money, timeAgo } from '../../lib/format';
import { DELIVERY, STATUS } from '../../lib/constants';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { Alert, EmptyState, Skeleton, StatusBadge } from '../../components/ui';

const TABS = ['ALL', 'RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function Orders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('estado') || 'ALL';
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrders().then(setOrders).catch(err => { setError(err.message); setOrders([]); });
  }, []);

  const counts = useMemo(() => {
    const c = { ALL: orders?.length || 0 };
    orders?.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    if (!orders) return null;
    const q = query.trim().toLowerCase();
    return orders.filter(o =>
      (tab === 'ALL' || o.status === tab) &&
      (!q || [o.folio, o.customer_name, o.customer_phone].some(v => v?.toLowerCase().includes(q))));
  }, [orders, tab, query]);

  return (
    <AdminLayout title="Pedidos" subtitle="Atiende y da seguimiento a los pedidos de tus clientes.">
      {error && <Alert>{error}</Alert>}

      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setParams(t === 'ALL' ? {} : { estado: t })}
          >
            {t === 'ALL' ? 'Todos' : STATUS[t].label}
            <span className="tab-count">{counts[t] || 0}</span>
          </button>
        ))}
      </div>

      <div className="card card-flush">
        <div className="toolbar">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por folio, cliente o teléfono" aria-label="Buscar pedidos" />
          </div>
        </div>

        {visible === null ? (
          <div className="pad stack-sm">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={44} />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon="clipboard" title={query ? 'Sin resultados' : 'No hay pedidos aquí'}>
            {query ? 'Prueba con otro folio, nombre o teléfono.' : 'Los pedidos en este estado aparecerán aquí.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table-click">
              <thead>
                <tr><th>Folio</th><th>Cliente</th><th>Entrega</th><th className="num">Artículos</th><th className="num">Total</th><th>Estado</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {visible.map(o => (
                  <tr key={o.id} onClick={() => navigate(`/admin/pedidos/${o.id}`)} tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/admin/pedidos/${o.id}`)}>
                    <td><strong className="text-brand">{o.folio}</strong></td>
                    <td>
                      <div className="cell-main">{o.customer_name}</div>
                      <div className="cell-sub">{o.customer_phone}</div>
                    </td>
                    <td><span className="cell-icon"><Icon name={DELIVERY[o.delivery_type].icon} size={16} /> {DELIVERY[o.delivery_type].short}</span></td>
                    <td className="num">{o.items_count}</td>
                    <td className="num"><strong>{money(o.total)}</strong></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><span title={dateTime(o.created_at)} className="text-muted">{timeAgo(o.created_at)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
