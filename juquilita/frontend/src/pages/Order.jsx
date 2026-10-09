import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money, placeholderImage } from '../lib/format';
import StoreLayout from '../components/StoreLayout';
import QuantitySelector from '../components/QuantitySelector';
import Icon from '../components/Icon';
import { EmptyState } from '../components/ui';

export default function Order() {
  const navigate = useNavigate();
  const { items, total, count, updateQuantity, removeItem } = useCart();

  return (
    <StoreLayout>
      <div className="container section-tight">
        <div className="page-head">
          <h1>Mi pedido</h1>
          {items.length > 0 && <p className="text-muted">{count} {count === 1 ? 'artículo' : 'artículos'}</p>}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="bag"
            title="Tu pedido está vacío"
            action={<Link to="/tienda" className="btn btn-primary">Explorar catálogo</Link>}
          >
            Agrega productos desde el catálogo y aquí verás el resumen.
          </EmptyState>
        ) : (
          <div className="checkout-grid">
            <div className="card card-flush">
              <ul className="cart-list">
                {items.map(item => (
                  <li key={item.product_id} className="cart-item">
                    <Link to={`/producto/${item.product_id}`} className="cart-item-img">
                      <img src={item.image_url || placeholderImage(item.name)} alt="" />
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/producto/${item.product_id}`} className="cart-item-name">{item.name}</Link>
                      <span className="text-sm text-muted">{item.brand ? `${item.brand} · ` : ''}{money(item.price)} / {item.unit}</span>
                      {item.quantity >= item.stock && <span className="text-xs text-warning">Máximo disponible</span>}
                    </div>
                    <div className="cart-item-qty">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={q => updateQuantity(item.product_id, q)}
                        max={item.stock}
                        size="sm"
                      />
                    </div>
                    <strong className="cart-item-total">{money(item.price * item.quantity)}</strong>
                    <button className="icon-btn icon-btn-danger" onClick={() => removeItem(item.product_id)} aria-label={`Quitar ${item.name}`}>
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="cart-continue">
                <Link to="/tienda" className="link-arrow"><Icon name="arrowLeft" size={16} /> Seguir comprando</Link>
              </div>
            </div>

            <aside className="card summary">
              <h3>Resumen</h3>
              <div className="summary-row"><span>Subtotal</span><span>{money(total)}</span></div>
              <div className="summary-row"><span>Entrega</span><span className="text-muted">Se define al confirmar</span></div>
              <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
              <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/confirmar')}>
                Continuar <Icon name="arrowRight" size={18} />
              </button>
              <p className="summary-note"><Icon name="shield" size={16} /> No pagas nada en línea. Pagas al recoger o al recibir.</p>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
