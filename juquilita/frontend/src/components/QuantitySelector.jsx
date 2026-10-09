import Icon from './Icon';

export default function QuantitySelector({ value, onChange, max, size = 'md' }) {
  const atMin = value <= 1;
  const atMax = max != null && value >= max;
  return (
    <div className={`qty qty-${size}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={atMin} aria-label="Quitar uno">
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={atMax} aria-label="Agregar uno">
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
