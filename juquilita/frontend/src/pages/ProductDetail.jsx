import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money, placeholderImage } from '../lib/format';
import { stockStatus } from '../lib/constants';
import StoreLayout from '../components/StoreLayout';
import ProductCard from '../components/ProductCard';
import QuantitySelector from '../components/QuantitySelector';
import Icon from '../components/Icon';
import { Badge, EmptyState, Skeleton } from '../components/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, quantityOf } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setQuantity(1);
    api.getProduct(id)
      .then(p => {
        if (!p.active) throw new Error('inactive');
        setProduct(p);
        if (p.category_id) {
          api.getProducts('', p.category_id)
            .then(list => setRelated(list.filter(r => r.id !== p.id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <StoreLayout>
        <div className="container section">
          <EmptyState icon="package" title="Producto no disponible" action={<Link to="/tienda" className="btn btn-primary">Ir al catálogo</Link>}>
            Es posible que ya no lo manejemos. Busca una alternativa en el catálogo.
          </EmptyState>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container product-detail">
          <Skeleton height={460} radius={18} />
          <div className="stack-md">
            <Skeleton height={20} width="40%" />
            <Skeleton height={40} width="80%" />
            <Skeleton height={36} width="30%" />
            <Skeleton height={80} />
          </div>
        </div>
      </StoreLayout>
    );
  }

  const status = stockStatus(product.stock, product.minimum_stock);
  const inCart = quantityOf(product.id);
  const available = Math.max(0, product.stock - inCart);

  function handleAdd() {
    addItem(product, quantity);
    toast.success(`${quantity} × ${product.name} agregado`, { action: { label: 'Ver pedido', to: '/pedido' } });
    setQuantity(1);
  }

  return (
    <StoreLayout>
      <div className="container">
        <nav className="breadcrumbs" aria-label="Ruta">
          <Link to="/">Inicio</Link><Icon name="chevronRight" size={14} />
          <Link to="/tienda">Catálogo</Link>
          {product.category_name && (
            <><Icon name="chevronRight" size={14} /><Link to={`/tienda?category=${product.category_id}`}>{product.category_name}</Link></>
          )}
        </nav>

        <div className="product-detail">
          <div className="product-detail-media">
            <img src={product.image_url || placeholderImage(product.name)} alt={product.name} />
          </div>

          <div className="product-detail-info">
            {product.brand && <span className="eyebrow eyebrow-plain">{product.brand}</span>}
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              <strong>{money(product.price)}</strong>
              <span>por {product.unit}</span>
            </div>
            <div className="product-detail-stock">
              <Badge tone={status.tone}>{status.label}</Badge>
              {product.stock > 0 && <span className="text-muted text-sm">{product.stock} {product.unit}{product.stock === 1 ? '' : 's'} en existencia</span>}
            </div>

            {product.description && <p className="product-detail-desc">{product.description}</p>}

            {product.stock > 0 ? (
              <div className="buy-box">
                {available > 0 ? (
                  <>
                    <div className="buy-box-row">
                      <span className="text-sm text-muted">Cantidad</span>
                      <QuantitySelector value={quantity} onChange={setQuantity} max={available} size="lg" />
                    </div>
                    <div className="buy-box-row">
                      <span className="text-sm text-muted">Subtotal</span>
                      <strong className="buy-box-subtotal">{money(product.price * quantity)}</strong>
                    </div>
                    <button className="btn btn-primary btn-lg btn-block" onClick={handleAdd}>
                      <Icon name="bag" size={18} /> Agregar a mi pedido
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted">Ya tienes en tu pedido toda la existencia disponible.</p>
                )}
                {inCart > 0 && (
                  <Link to="/pedido" className="buy-box-incart">
                    <Icon name="checkCircle" size={16} /> Tienes {inCart} en tu pedido · Ver pedido
                  </Link>
                )}
              </div>
            ) : (
              <div className="buy-box">
                <p><strong>Sin existencias por ahora.</strong></p>
                <p className="text-sm text-muted">Llámanos y te avisamos cuando vuelva a llegar.</p>
              </div>
            )}

            <ul className="perks">
              <li><Icon name="store" size={18} /> Recoge en tienda sin costo</li>
              <li><Icon name="truck" size={18} /> Entrega a domicilio disponible</li>
              <li><Icon name="wallet" size={18} /> Pagas hasta recibir tu pedido</li>
            </ul>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>También en {product.category_name}</h2></div>
            <div className="products-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
