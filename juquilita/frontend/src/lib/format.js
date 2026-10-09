const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export function money(value) {
  return currency.format(Number(value) || 0);
}

export function date(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('es-MX', opts);
}

export function dateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(value) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ayer';
  return date(value, { day: 'numeric', month: 'short' });
}

export function placeholderImage(name = 'Producto') {
  return `https://placehold.co/400x400/f4efe9/8c8172?text=${encodeURIComponent(name)}`;
}
