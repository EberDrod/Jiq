import Icon from './Icon';
import { ORDER_FLOW, STATUS } from '../lib/constants';

export default function OrderTimeline({ status, deliveryType }) {
  if (status === 'CANCELLED') {
    return (
      <div className="timeline-cancelled">
        <Icon name="x" size={18} /> Este pedido fue cancelado.
      </div>
    );
  }

  const current = ORDER_FLOW.indexOf(status);
  const labels = {
    RECEIVED: 'Recibido',
    PREPARING: 'Preparando',
    READY: deliveryType === 'delivery' ? 'En camino' : 'Listo para recoger',
    COMPLETED: 'Entregado',
  };

  return (
    <ol className="timeline">
      {ORDER_FLOW.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s} className={`timeline-step is-${state}`}>
            <span className="timeline-dot">{i <= current ? <Icon name="check" size={14} strokeWidth={2.5} /> : i + 1}</span>
            <span className="timeline-label">{labels[s] || STATUS[s].label}</span>
          </li>
        );
      })}
    </ol>
  );
}
