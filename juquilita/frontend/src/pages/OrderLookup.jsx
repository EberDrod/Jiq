import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { date, dateTime, money, placeholderImage } from '../lib/format';
import { DELIVERY, PAYMENT, STATUS, STORE } from '../lib/constants';
import { getRecentOrders } from '../lib/recentOrders';
import StoreLayout from '../components/StoreLayout';
import OrderTimeline from '../components/OrderTimeline';
import Icon from '../components/Icon';
import { Alert, Skeleton, StatusBadge } from '../components/ui';

function TrackForm({ initial = '', error }) {
  const navigate = useNavigate();
  const [folio, setFolio] = useState(initial);
  const recent = getRecentOrders();

  function submit(e) {
    e.preventDefault();
    const f = folio.trim().toUpperCase();
    if (f) navigate(`/pedido/${encodeURIComponent(f)}`);
  }

  return (
    <div className="track">
      <div className="track-icon"><Icon name="package" size={28} /></div>
      <h1>Rastrea tu pedido</h1>
      <p className="text-muted">Escribe el folio que recibiste al confirmar (ej. JUQ-1001).</p>
      {error && <Alert>{error}</Alert>}
      <form className="track-form" onSubmit={submit}>
        <input
          className="input input-lg"
          value={folio}
          onChange={e => setFolio(e.target.value)}
          placeholder="JUQ-1001"
          aria-label="Folio del pedido"
          autoFocus
        />
        <button className="btn btn-primary btn-lg" type="submit">Buscar</button>
      </form>
      {recent.length > 0 && (
        <div className="recent-orders">
          <h4>Tus pedidos recientes en este dispositivo</h4>
          {recent.map(o => (
            <Link key={o.folio} to={`/pedido/${o.folio}`} className="recent-order">
              <strong>{o.folio}</strong>
              <span className="text-muted text-sm">{date(o.created_at)} · {money(o.total)}</span>
              <Icon name="chevronRight" size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrderLookup() {
  const { folio } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!folio) return;
    setOrder(null);
    setError('');
    api.getOrderByFolio(folio).then(setOrder).catch(() => setError(`No encontramos el pedido “${folio}”. Revisa el folio.`));
  }, [folio]);

  if (!folio || error) {
    return (
      <StoreLayout>
        <div className="container section-tight narrow">
          <TrackForm initial={folio || ''} error={error} />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container section-tight narrow">
        <Link to="/rastrear" className="link-arrow back-link"><Icon name="arrowLeft" size={16} /> Buscar otro pedido</Link>

        {!order ? (
          <div className="stack-md"><Skeleton height={40} width="50%" /><Skeleton height={300} radius={16} /></div>
        ) : (
          <>
            <div className="page-head page-head-row">
              <div>
                <h1>Pedido {order.folio}</h1>
                <p className="text-muted">Realizado el {date(order.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="card stack-md">
              <OrderTimeline status={order.status} deliveryType={order.delivery_type} />
              <p className="status-hint">
                {STATUS[order.status].hint}
                {order.status === 'READY' && order.delivery_type === 'pickup' && ' Ya puedes pasar a recogerlo.'}
              </p>
              <p className="text-xs text-muted">Última actualización: {dateTime(order.updated_at)}</p>
            </div>

            <div className="card card-flush">
              <ul className="line-items">
                {order.items.map(item => (
                  <li key={item.id}>
                    <img src={item.image_url || placeholderImage(item.product_name)} alt="" />
                    <span className="line-item-name">
                      {item.product_name}
                      <small>{item.quantity} × {money(item.unit_price)}</small>
                    </span>
                    <strong>{money(item.subtotal)}</strong>
                  </li>
                ))}
              </ul>
              <div className="line-items-total"><span>Total</span><strong>{money(order.total)}</strong></div>
            </div>

            <div className="card">
              <dl className="detail-list">
                <div><dt>Cliente</dt><dd>{order.customer_name}</dd></div>
                <div><dt>Entrega</dt><dd><Icon name={DELIVERY[order.delivery_type].icon} size={16} /> {DELIVERY[order.delivery_type].label}</dd></div>
                {order.address && <div><dt>Dirección</dt><dd>{order.address}</dd></div>}
                <div><dt>Pago</dt><dd>{PAYMENT[order.payment_method]}</dd></div>
              </dl>
            </div>

            <p className="text-center text-sm text-muted">¿Necesitas cambiar algo? Llámanos al <a href={`tel:${STORE.phone.replace(/\s/g, '')}`} className="link">{STORE.phone}</a>.</p>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
