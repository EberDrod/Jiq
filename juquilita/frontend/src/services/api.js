const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, { headers: headers(), ...options });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Revisa tu conexión.');
  }

  const data = await res.json().catch(() => ({}));

  // Sesión expirada (los tokens viven en memoria del servidor)
  if (res.status === 401 && localStorage.getItem('token') && !path.startsWith('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname.startsWith('/admin')) {
      window.location.assign('/admin/login?expired=1');
    }
  }

  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

export const api = {
  login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/me'),

  getProducts: (search, category) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    return request(`/products?${params}`);
  },
  getAllProducts: (search) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/products/all${params}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getCategories: () => request('/categories'),
  createCategory: (name) => request('/categories', { method: 'POST', body: JSON.stringify({ name }) }),

  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  getOrderByFolio: (folio) => request(`/orders/folio/${encodeURIComponent(folio)}`),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  inventoryEntry: (data) => request('/inventory/entry', { method: 'POST', body: JSON.stringify(data) }),
  inventoryExit: (data) => request('/inventory/exit', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: (productId) => request(`/inventory/movements${productId ? `?product_id=${productId}` : ''}`),

  getDashboard: () => request('/dashboard'),
};
