import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message) => {
    addToast(message, 'info');
    return addToast;
  }, [addToast]);

  const toastSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
  const toastError = useCallback((message) => addToast(message, 'error', 6000), [addToast]);
  const toastWarning = useCallback((message) => addToast(message, 'warning'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast, toastSuccess, toastError, toastWarning }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm max-w-sm
              toast-enter ${
              t.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
              t.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              t.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
              'bg-gray-800 border-gray-700 text-gray-300'
            }`}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
