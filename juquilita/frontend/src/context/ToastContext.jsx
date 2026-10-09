import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, { type = 'success', action, duration = 3500 } = {}) => {
    const id = nextId++;
    setToasts(prev => [...prev.slice(-2), { id, message, type, action }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, type: 'error', duration: 5000 }),
    info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'error' ? 'alert' : t.type === 'info' ? 'info' : 'checkCircle'} size={18} />
            <span className="toast-msg">{t.message}</span>
            {t.action && (
              <Link to={t.action.to} className="toast-action" onClick={() => dismiss(t.id)}>
                {t.action.label}
              </Link>
            )}
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
