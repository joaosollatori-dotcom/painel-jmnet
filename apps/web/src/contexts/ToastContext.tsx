import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => string;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        return id;
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none'
            }}>
                <div>
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            style={{
                                background: 'color-mix(in srgb, #131313, transparent calc(100% - (var(--glass-opacity) * 100%)))',
                                backdropFilter: 'var(--glass-blur)',
                                WebkitBackdropFilter: 'var(--glass-blur)',
                                border: `1px solid ${toast.type === 'success' ? '#10b98144' :
                                    toast.type === 'error' ? '#ef444444' :
                                        toast.type === 'warning' ? '#f59e0b44' : '#3b82f644'
                                    }`,
                                padding: '12px 20px',
                                borderRadius: '14px',
                                color: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                pointerEvents: 'auto',
                                minWidth: '280px',
                                marginBottom: '10px'
                            }}
                        >
                            {toast.type === 'success' && <CheckCircle size={24} weight="fill" color="#10b981" />}
                            {toast.type === 'error' && <XCircle size={24} weight="fill" color="#ef4444" />}
                            {toast.type === 'warning' && <Warning size={24} weight="fill" color="#f59e0b" />}
                            {toast.type === 'info' && <Info size={24} weight="fill" color="#3b82f6" />}

                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};
