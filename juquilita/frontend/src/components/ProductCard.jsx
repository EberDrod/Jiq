import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money, placeholderImage } from '../lib/format';
import { stockStatus } from '../lib/constants';
import { Badge } from './ui';
import Icon from './Icon';

export default function ProductCard({ product }) {
  const { addItem, quantityOf } = useCart();
  const toast = useToast();
  const status = stockStatus(product.stock, product.minimum_stock);
  const inCart = quantityOf(product.id);
  const maxed = inCart >= product.stock;

  function handleAdd() {
    addItem(product, 1);
    toast.success(`${product.name} agregado`, { action: { label: 'Ver pedido', to: '/pedido' } });
  }

  return (
    <article className={`product-card ${status.key === 'out' ? 'is-out' : ''}`}>
      <Link to={`/producto/${product.id}`} className="product-card-media">
        <img
          src={product.image_url || placeholderImage(product.name)}
          alt={product.name}
          loading="lazy"
        />
        {status.key !== 'ok' && (
          <span className="product-card-flag"><Badge tone={status.tone}>{status.label}</Badge></span>
        )}
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          {product.category_name && <span>{product.category_name}</span>}
          {product.brand && <span>{product.brand}</span>}
        </div>
        <Link to={`/producto/${product.id}`} className="product-card-name">{product.name}</Link>
        <div className="product-card-footer">
          <div className="price">
            <strong>{money(product.price)}</strong>
            <small>/ {product.unit}</small>
          </div>
          {status.key === 'out' ? (
            <span className="text-muted text-sm">Sin existencias</span>
          ) : (
            <button
              className={`btn btn-sm ${inCart ? 'btn-soft' : 'btn-primary'}`}
              onClick={handleAdd}
              disabled={maxed}
              aria-label={`Agregar ${product.name}`}
            >
              {inCart ? <><Icon name="check" size={16} /> {inCart}</> : <><Icon name="plus" size={16} /> Agregar</>}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
