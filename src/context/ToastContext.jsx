import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData) => {
    const message = toastData.message || (typeof toastData === 'string' ? toastData : '');
    const type = toastData.type || 'info';
    const dedupeKey = `${type}_${message}`;
    const now = Date.now();

    // Prevent duplicate toast with identical type and message within 2.5 seconds
    if (recentToastsRef.current.has(dedupeKey)) {
      const lastTime = recentToastsRef.current.get(dedupeKey);
      if (now - lastTime < 2500) {
        return null; // Ignore duplicate
      }
    }
    recentToastsRef.current.set(dedupeKey, now);

    const id = now + Math.random().toString(36).substr(2, 4);
    const newToast = {
      id,
      title: toastData.title,
      message,
      type,
      duration: toastData.duration || 3500,
    };

    setToasts((prev) => {
      // Also filter out any existing toast with the same message currently on screen
      const filtered = prev.filter((t) => t.message !== message);
      return [...filtered, newToast];
    });

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message }),
    warning: (message, title = 'Attention') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Information') => addToast({ type: 'info', title, message }),
  }), [addToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500 shrink-0" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 shrink-0" size={20} />;
      default:
        return <Info className="text-blue-500 shrink-0" size={20} />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-50/90 dark:bg-zinc-900/95';
      case 'error':
        return 'border-red-500/20 bg-red-50/90 dark:bg-zinc-900/95';
      case 'warning':
        return 'border-amber-500/20 bg-amber-50/90 dark:bg-zinc-900/95';
      default:
        return 'border-blue-500/20 bg-blue-50/90 dark:bg-zinc-900/95';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}

      {/* Floating Bottom-Right Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto backdrop-blur-xl border rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden group ${getToastBorder(
                t.type
              )}`}
            >
              <div className="pt-0.5">{getToastIcon(t.type)}</div>

              <div className="flex-1 pr-2">
                {t.title && (
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {t.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors p-1 rounded-lg"
              >
                <X size={14} />
              </button>

              {/* Progress animation line */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (t.duration || 3500) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[2px] ${
                  t.type === 'success'
                    ? 'bg-emerald-500'
                    : t.type === 'error'
                    ? 'bg-red-500'
                    : t.type === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
