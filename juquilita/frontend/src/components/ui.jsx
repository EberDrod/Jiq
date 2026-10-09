import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { STATUS, stockStatus } from '../lib/constants';

export function Badge({ tone = 'neutral', children, dot = true }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function StockBadge({ stock, minimum }) {
  const s = stockStatus(stock, minimum);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Skeleton({ height = 16, width = '100%', radius, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ height, width, borderRadius: radius }} />;
}

export function EmptyState({ icon = 'package', title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector('input, select, textarea');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        ref={ref}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, children, confirmLabel = 'Confirmar', danger, loading, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Volver</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading && <Spinner size={16} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-muted">{children}</p>
    </Modal>
  );
}

export function Field({ label, hint, error, children, htmlFor, optional }) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {optional && <span className="field-optional">Opcional</span>}
        </label>
      )}
      {children}
      {error ? <p className="field-msg">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Alert({ tone = 'danger', children }) {
  return (
    <div className={`alert alert-${tone}`} role="alert">
      <Icon name={tone === 'danger' ? 'alert' : 'info'} size={18} />
      <div>{children}</div>
    </div>
  );
}
