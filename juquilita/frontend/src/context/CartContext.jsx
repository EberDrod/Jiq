import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'juquilita_cart';
const CartContext = createContext(null);

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // Storage no disponible: el carrito vive solo en memoria
    }
  }, [items]);

  // Mantener sincronizado entre pestañas
  useEffect(() => {
    function onStorage(e) {
      if (e.key === CART_KEY) setItems(readCart());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, stock: product.stock, quantity: Math.min(product.stock, i.quantity + quantity) }
          : i);
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        price: parseFloat(product.price),
        unit: product.unit,
        stock: product.stock,
        image_url: product.image_url,
        quantity: Math.min(product.stock, quantity),
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(prev => prev.map(i => i.product_id === productId
      ? { ...i, quantity: Math.max(1, Math.min(i.stock || quantity, quantity)) }
      : i));
  }, []);

  const removeItem = useCallback(productId => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    quantityOf: id => items.find(i => i.product_id === id)?.quantity || 0,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }), [items, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
