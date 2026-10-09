export const STORE = {
  name: 'Juquilita',
  tagline: 'Tlapalería y ferretería',
  phone: '55 1234 5678',
  hours: 'Lun a Sáb · 8:00 a 19:00',
};

export const ORDER_FLOW = ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED'];

export const STATUS = {
  RECEIVED: { label: 'Recibido', tone: 'info', hint: 'Tu pedido llegó a la tienda.' },
  PREPARING: { label: 'Preparando', tone: 'warning', hint: 'Estamos juntando tus productos.' },
  READY: { label: 'Listo', tone: 'success', hint: 'Tu pedido está listo.' },
  COMPLETED: { label: 'Entregado', tone: 'neutral', hint: 'Pedido entregado. ¡Gracias!' },
  CANCELLED: { label: 'Cancelado', tone: 'danger', hint: 'Este pedido fue cancelado.' },
};

export const NEXT_ACTION = {
  RECEIVED: { status: 'PREPARING', label: 'Empezar a preparar' },
  PREPARING: { status: 'READY', label: 'Marcar como listo' },
  READY: { status: 'COMPLETED', label: 'Marcar como entregado' },
};

export const DELIVERY = {
  pickup: { label: 'Recoger en tienda', short: 'Recoger', icon: 'store' },
  delivery: { label: 'Entrega a domicilio', short: 'Domicilio', icon: 'truck' },
};

export const PAYMENT = {
  pay_on_pickup: 'Pago al recoger',
  pay_on_delivery: 'Pago al recibir',
};

export const MOVEMENT = {
  ENTRY: { label: 'Entrada', tone: 'success', sign: '+' },
  EXIT: { label: 'Salida', tone: 'warning', sign: '−' },
  ORDER: { label: 'Pedido', tone: 'info', sign: '−' },
  CANCELLATION: { label: 'Cancelación', tone: 'neutral', sign: '+' },
  ADJUSTMENT: { label: 'Ajuste', tone: 'neutral', sign: '±' },
};

const CATEGORY_ICONS = {
  herramientas: 'hammer',
  plomería: 'droplet',
  electricidad: 'zap',
  pintura: 'paintbrush',
  construcción: 'brick',
  tornillería: 'bolt',
  cerrajería: 'lock',
  jardinería: 'sprout',
};

export function categoryIcon(name = '') {
  return CATEGORY_ICONS[name.toLowerCase()] || 'tag';
}

export function stockStatus(stock, minimum) {
  if (stock <= 0) return { label: 'Agotado', tone: 'danger', key: 'out' };
  if (stock <= minimum) return { label: 'Pocas piezas', tone: 'warning', key: 'low' };
  return { label: 'Disponible', tone: 'success', key: 'ok' };
}
