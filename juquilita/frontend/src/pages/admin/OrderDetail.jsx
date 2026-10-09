import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { dateTime, money, placeholderImage } from '../../lib/format';
import { DELIVERY, NEXT_ACTION, PAYMENT } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import OrderTimeline from '../../components/OrderTimeline';
import Icon from '../../components/Icon';
import { Alert, ConfirmDialog, Skeleton, Spinner, StatusBadge } from '../../components/ui';

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch(err => setError(err.message));
  }, [id]);

  async function changeStatus(status) {
    setUpdating(true);
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrder(prev => ({ ...prev, ...updated }));
      toast.success(status === 'CANCELLED' ? 'Pedido cancelado. El inventario fue devuelto.' : 'Estado actualizado');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  }

  const back = <Link to="/admin/pedidos" className="btn btn-ghost btn-sm"><Icon name="arrowLeft" size={16} /> Pedidos</Link>;

  if (error) return <AdminLayout title="Pedido" actions={back}><Alert>{error}</Alert></AdminLayout>;
  if (!order) {
    return (
      <AdminLayout title="Pedido" actions={back}>
        <div className="stack-md"><Skeleton height={120} radius={14} /><Skeleton height={260} radius={14} /></div>
      </AdminLayout>
    );
  }

  const next = NEXT_ACTION[order.status];
  const closed = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const phoneDigits = order.customer_phone.replace(/\D/g, '');
  const whatsapp = `https://wa.me/${phoneDigits.length === 10 ? `52${phoneDigits}` : phoneDigits}?text=${encodeURIComponent(`Hola ${order.customer_name}, te escribimos de Juquilita sobre tu pedido ${order.folio}.`)}`;

  return (
    <AdminLayout
      title={`Pedido ${order.folio}`}
      subtitle={`Recibido ${dateTime(order.created_at)}`}
      actions={<>{back}<button className="btn btn-outline btn-sm hide-sm" onClick={() => window.print()}><Icon name="printer" size={16} /> Imprimir</button></>}
    >
      <div className="card order-status-card">
        <div className="order-status-head">
          <div>
            <span className="text-sm text-muted">Estado actual</span>
            <div><StatusBadge status={order.status} /></div>
          </div>
          {!closed && (
            <div className="order-status-actions">
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirmCancel(true)} disabled={updating}>
                Cancelar pedido
              </button>
              {next && (
                <button className="btn btn-primary" onClick={() => changeStatus(next.status)} disabled={updating}>
                  {updating ? <Spinner size={16} /> : <Icon name="arrowRight" size={16} />} {next.label}
                </button>
              )}
            </div>
          )}
        </div>
        <OrderTimeline status={order.status} deliveryType={order.delivery_type} />
      </div>

      <div className="detail-grid">
        <div className="card card-flush">
          <div className="card-head card-head-pad"><h3>Productos</h3><span className="text-muted text-sm">{order.items.reduce((s, i) => s + i.quantity, 0)} artículos</span></div>
          <ul className="line-items">
            {order.items.map(item => (
              <li key={item.id}>
                <img src={item.image_url || placeholderImage(item.product_name)} alt="" />
                <span className="line-item-name">
                  {item.product_name}
                  <small>{item.quantity} {item.unit || ''} × {money(item.unit_price)}</small>
                </span>
                <strong>{money(item.subtotal)}</strong>
              </li>
            ))}
          </ul>
          <div className="line-items-total"><span>Total a cobrar</span><strong>{money(order.total)}</strong></div>
        </div>

        <div className="stack-md">
          <div className="card">
            <div className="card-head"><h3>Cliente</h3></div>
            <div className="customer">
              <span className="avatar avatar-lg">{order.customer_name[0]}</span>
              <div>
                <strong>{order.customer_name}</strong>
                <div className="text-muted text-sm">{order.customer_phone}</div>
              </div>
            </div>
            <div className="btn-row">
              <a href={`tel:${phoneDigits}`} className="btn btn-outline btn-sm"><Icon name="phone" size={16} /> Llamar</a>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Icon name="message" size={16} /> WhatsApp</a>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Entrega y pago</h3></div>
            <dl className="detail-list">
              <div><dt>Entrega</dt><dd><Icon name={DELIVERY[order.delivery_type].icon} size={16} /> {DELIVERY[order.delivery_type].label}</dd></div>
              {order.address && <div><dt>Dirección</dt><dd>{order.address}</dd></div>}
              {order.references && <div><dt>Referencias</dt><dd>{order.references}</dd></div>}
              <div><dt>Pago</dt><dd>{PAYMENT[order.payment_method]}</dd></div>
              <div><dt>Actualizado</dt><dd>{dateTime(order.updated_at)}</dd></div>
            </dl>
            {order.address && (
              <a className="link-arrow text-sm" target="_blank" rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}>
                <Icon name="mapPin" size={14} /> Abrir en mapa
              </a>
            )}
          </div>
        </div>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title="¿Cancelar este pedido?"
          confirmLabel="Sí, cancelar pedido"
          danger
          loading={updating}
          onConfirm={() => changeStatus('CANCELLED')}
          onClose={() => setConfirmCancel(false)}
        >
          Los productos regresarán al inventario automáticamente. Un pedido cancelado no se puede reactivar.
        </ConfirmDialog>
      )}
    </AdminLayout>
  );
}
