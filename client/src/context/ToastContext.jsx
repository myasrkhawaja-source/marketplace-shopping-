/**
 * src/context/ToastContext.jsx
 * ---------------------------------------------------------
 * Tiny notification system: showToast('Saved!', 'success').
 */
import { createContext, useCallback, useMemo, useState } from 'react';

export const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 3500) => {
      toastId += 1;
      const id = toastId;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo(() => ({ showToast, toasts, remove }), [showToast, toasts, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <span className="toast-icon">
              {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✅'}
            </span>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => remove(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
