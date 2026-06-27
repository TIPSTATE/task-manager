import { useState, useCallback } from 'react';

const TOAST_DURATION_MS = 3500;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  }, [dismissToast]);

  return { toasts, showToast, dismissToast };
}
