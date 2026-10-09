const KEY = 'juquilita_recent_orders';

export function getRecentOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberOrder(order) {
  try {
    const list = getRecentOrders().filter(o => o.folio !== order.folio);
    list.unshift({ folio: order.folio, total: order.total, created_at: order.created_at });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    // ignorar
  }
}
