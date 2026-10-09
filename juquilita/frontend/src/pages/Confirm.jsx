import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { money, placeholderImage } from '../lib/format';
import { rememberOrder } from '../lib/recentOrders';
import StoreLayout from '../components/StoreLayout';
import Icon from '../components/Icon';
import { Alert, Field, Spinner } from '../components/ui';

const CUSTOMER_KEY = 'juquilita_customer';

function loadCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || {};
  } catch {
    return {};
  }
}

const DELIVERY_OPTIONS = [
  { value: 'pickup', icon: 'store', title: 'Recoger en tienda', text: 'Te avisamos cuando esté listo. Sin costo.', payment: 'pay_on_pickup' },
  { value: 'delivery', icon: 'truck', title: 'Entrega a domicilio', text: 'Lo llevamos a tu dirección.', payment: 'pay_on_delivery' },
];

export default function Confirm() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const saved = loadCustomer();

  const [form, setForm] = useState({
    delivery_type: 'pickup',
    customer_name: saved.customer_name || '',
    customer_phone: saved.customer_phone || '',
    address: saved.address || '',
    references: saved.references || '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (items.length === 0 && !submitted) return <Navigate to="/pedido" replace />;

  const isDelivery = form.delivery_type === 'delivery';
  const option = DELIVERY_OPTIONS.find(o => o.value === form.delivery_type);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (form.customer_name.trim().length < 2) e.customer_name = 'Escribe tu nombre.';
    if (form.customer_phone.replace(/\D/g, '').length < 10) e.customer_phone = 'Escribe un teléfono de 10 dígitos.';
    if (isDelivery && form.address.trim().length < 5) e.address = 'Necesitamos la dirección para la entrega.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        delivery_type: form.delivery_type,
        address: isDelivery ? form.address.trim() : undefined,
        references: isDelivery ? form.references.trim() || undefined : undefined,
        payment_method: option.payment,
      };
      const order = await api.createOrder(payload);
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          address: form.address,
          references: form.references,
        }));
      } catch { /* ignorar */ }
      rememberOrder(order);
      setSubmitted(true);
      clear();
      navigate(`/pedido-confirmado/${order.folio}`, { replace: true });
    } catch (err) {
      setServerError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <StoreLayout>
      <div className="container section-tight">
        <ol className="checkout-steps" aria-label="Progreso">
          <li className="is-done"><Link to="/pedido"><Icon name="check" size={14} /> Pedido</Link></li>
          <li className="is-current"><span>2</span> Datos de entrega</li>
          <li><span>3</span> Confirmación</li>
        </ol>

        <div className="page-head">
          <h1>Datos de entrega</h1>
          <p className="text-muted">Solo necesitamos lo básico para preparar tu pedido.</p>
        </div>

        <form className="checkout-grid" onSubmit={handleSubmit} noValidate>
          <div className="stack-lg">
            {serverError && <Alert>{serverError}</Alert>}

            <section className="card">
              <h3 className="card-title"><span className="card-title-num">1</span> ¿Cómo lo quieres recibir?</h3>
              <div className="option-grid">
                {DELIVERY_OPTIONS.map(o => (
                  <label key={o.value} className={`option-card ${form.delivery_type === o.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery_type"
                      value={o.value}
                      checked={form.delivery_type === o.value}
                      onChange={() => set('delivery_type', o.value)}
                    />
                    <span className="option-card-icon"><Icon name={o.icon} size={22} /></span>
                    <span>
                      <strong>{o.title}</strong>
                      <small>{o.text}</small>
                    </span>
                    <span className="option-card-check"><Icon name="check" size={14} strokeWidth={2.5} /></span>
                  </label>
                ))}
              </div>
            </section>

            <section className="card">
              <h3 className="card-title"><span className="card-title-num">2</span> Tus datos</h3>
              <div className="form-grid">
                <Field label="Nombre completo" htmlFor="name" error={errors.customer_name}>
                  <input id="name" className="input" autoComplete="name" value={form.customer_name}
                    onChange={e => set('customer_name', e.target.value)} placeholder="Ej. María López" />
                </Field>
                <Field label="Teléfono" htmlFor="phone" error={errors.customer_phone} hint="Te llamamos si hay algún detalle.">
                  <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel"
                    value={form.customer_phone} maxLength={15}
                    onChange={e => set('customer_phone', e.target.value.replace(/[^\d\s+]/g, ''))} placeholder="55 1234 5678" />
                </Field>
              </div>
              {isDelivery && (
                <div className="form-grid form-grid-1">
                  <Field label="Dirección" htmlFor="address" error={errors.address}>
                    <input id="address" className="input" autoComplete="street-address" value={form.address}
                      onChange={e => set('address', e.target.value)} placeholder="Calle, número, colonia" />
                  </Field>
                  <Field label="Referencias" htmlFor="refs" optional>
                    <textarea id="refs" className="input" rows={2} value={form.references}
                      onChange={e => set('references', e.target.value)} placeholder="Entre calles, color de la casa…" />
                  </Field>
                </div>
              )}
            </section>

            <section className="card">
              <h3 className="card-title"><span className="card-title-num">3</span> Pago</h3>
              <div className="pay-info">
                <Icon name="wallet" size={22} />
                <div>
                  <strong>{isDelivery ? 'Pagas al recibir' : 'Pagas al recoger'}</strong>
                  <p className="text-sm text-muted">Efectivo o tarjeta {isDelivery ? 'cuando te entreguemos' : 'en mostrador'}. No cobramos nada en línea.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="card summary">
            <h3>Tu pedido</h3>
            <ul className="summary-items">
              {items.map(i => (
                <li key={i.product_id}>
                  <img src={i.image_url || placeholderImage(i.name)} alt="" />
                  <span className="summary-item-name">
                    {i.name}
                    <small>{i.quantity} × {money(i.price)}</small>
                  </span>
                  <span>{money(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row"><span>Entrega</span><span>{option.title}</span></div>
            <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
              {loading ? <><Spinner size={18} /> Enviando pedido…</> : <>Confirmar pedido</>}
            </button>
            <Link to="/pedido" className="btn btn-ghost btn-block">Editar pedido</Link>
          </aside>
        </form>
      </div>
    </StoreLayout>
  );
}
