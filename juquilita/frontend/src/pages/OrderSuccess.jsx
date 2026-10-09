import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money } from '../lib/format';
import { DELIVERY, PAYMENT, STORE } from '../lib/constants';
import { useToast } from '../context/ToastContext';
import StoreLayout from '../components/StoreLayout';
import OrderTimeline from '../components/OrderTimeline';
import Icon from '../components/Icon';
import { Skeleton } from '../components/ui';

export default function OrderSuccess() {
  const { folio } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.getOrderByFolio(folio).then(setOrder).catch(() => {});
  }, [folio]);

  function copyFolio() {
    navigator.clipboard?.writeText(folio).then(
      () => toast.success('Folio copiado'),
      () => toast.error('No se pudo copiar'),
    );
  }

  return (
    <StoreLayout>
      <div className="container section-tight narrow">
        <ol className="checkout-steps" aria-label="Progreso">
          <li className="is-done"><span><Icon name="check" size={14} /></span> Pedido</li>
          <li className="is-done"><span><Icon name="check" size={14} /></span> Datos de entrega</li>
          <li className="is-done is-current"><span><Icon name="check" size={14} /></span> Confirmación</li>
        </ol>

        <div className="success-hero">
          <div className="success-icon"><Icon name="check" size={36} strokeWidth={2.5} /></div>
          <h1>¡Recibimos tu pedido!</h1>
          <p className="text-muted">Guarda tu folio para consultar el estado en cualquier momento.</p>
          <button className="folio-pill" onClick={copyFolio} title="Copiar folio">
            <span>Folio</span>
            <strong>{folio}</strong>
            <Icon name="copy" size={16} />
          </button>
        </div>

        {!order ? (
          <Skeleton height={260} radius={16} />
        ) : (
          <div className="card stack-md">
            <OrderTimeline status={order.status} deliveryType={order.delivery_type} />
            <dl className="detail-list">
              <div><dt>Entrega</dt><dd><Icon name={DELIVERY[order.delivery_type].icon} size={16} /> {DELIVERY[order.delivery_type].label}</dd></div>
              {order.address && <div><dt>Dirección</dt><dd>{order.address}</dd></div>}
              <div><dt>Pago</dt><dd>{PAYMENT[order.payment_method]}</dd></div>
              <div><dt>Productos</dt><dd>{order.items.reduce((s, i) => s + i.quantity, 0)} artículos</dd></div>
              <div className="detail-total"><dt>Total a pagar</dt><dd>{money(order.total)}</dd></div>
            </dl>
            <div className="note">
              <Icon name="phone" size={18} />
              <span>{order.delivery_type === 'pickup'
                ? `Te avisaremos al ${order.customer_phone} cuando esté listo para recoger.`
                : `Te llamaremos al ${order.customer_phone} antes de salir a entregar.`}
                {' '}¿Dudas? Llámanos al {STORE.phone}.
              </span>
            </div>
          </div>
        )}

        <div className="success-actions">
          <Link to={`/pedido/${folio}`} className="btn btn-primary">Seguir mi pedido</Link>
          <Link to="/tienda" className="btn btn-outline">Seguir comprando</Link>
        </div>
      </div>
    </StoreLayout>
  );
}
