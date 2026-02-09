import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.setAttribute('id', 'toast-portal');
    document.body.appendChild(node);
    setPortalNode(node);
    return () => {
      document.body.removeChild(node);
    };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = { id: toastId++, message, type, visible: false };
    
    setToasts(currentToasts => [...currentToasts, newToast]);
    
    setTimeout(() => {
        setToasts(currentToasts => currentToasts.map(t => t.id === newToast.id ? { ...t, visible: true } : t));
    }, 10); 

    setTimeout(() => {
        setToasts(currentToasts => currentToasts.map(t => t.id === newToast.id ? { ...t, visible: false } : t));
        setTimeout(() => {
             setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
        }, 500);
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(currentToasts => currentToasts.map(t => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
    }, 500);
  };

  const toastIcons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  const toastColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {portalNode && ReactDOM.createPortal(
        <div className="fixed top-5 right-0 left-0 px-4 sm:left-auto sm:px-0 sm:right-5 z-[9999] space-y-2 w-full max-w-md mx-auto sm:w-auto sm:max-w-xs" style={{pointerEvents: 'none'}}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-2xl text-white shadow-2xl transition-all duration-300 ${toastColors[toast.type]} ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              onClick={() => removeToast(toast.id)}
              style={{pointerEvents: 'auto', cursor: 'pointer'}}
            >
              <i className={`fa-solid ${toastIcons[toast.type]} text-lg mt-0.5`}></i>
              <p className="font-bold text-sm flex-1 leading-snug">{toast.message}</p>
            </div>
          ))}
        </div>,
        portalNode
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
