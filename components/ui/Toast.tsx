'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-right-full duration-300
              ${toast.type === 'success' ? 'bg-white border-success/20 text-gray-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-200 text-gray-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-primary/20 text-gray-800' : ''}
            `}
                    >
                        <span className={`
              p-1 rounded-full 
              ${toast.type === 'success' ? 'bg-success/10 text-success-foreground' : ''}
              ${toast.type === 'error' ? 'bg-red-50 text-red-600' : ''}
              ${toast.type === 'info' ? 'bg-primary/10 text-primary-foreground' : ''}
            `}>
                            {toast.type === 'success' && <Check size={16} />}
                            {toast.type === 'error' && <AlertCircle size={16} />}
                            {toast.type === 'info' && <Info size={16} />}
                        </span>
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
