import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * useToast() -> { showToast(message, type) }
 * type: 'success' | 'error' | 'info'
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};
