import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
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
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
                            style={{
                                background: 'color-mix(in srgb, #131313, transparent calc(100% - (var(--glass-opacity) * 100%)))',
                                backdropFilter: 'var(--glass-blur)',
                                WebkitBackdropFilter: 'var(--glass-blur)',
                                border: `1px solid ${toast.type === 'success' ? '#10b98144' :
                                    toast.type === 'error' ? '#ef444444' :
                                        '#3b82f644'
                                    }`,
                                padding: '12px 20px',
                                borderRadius: '14px',
                                color: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                pointerEvents: 'auto',
                                minWidth: '280px'
                            }}
                        >
                            {toast.type === 'success' && <CheckCircle size={24} weight="fill" color="#10b981" />}
                            {toast.type === 'error' && <XCircle size={24} weight="fill" color="#ef4444" />}
                            {toast.type === 'warning' && <Warning size={24} weight="fill" color="#f59e0b" />}
                            {toast.type === 'info' && <Info size={24} weight="fill" color="#3b82f6" />}

                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
