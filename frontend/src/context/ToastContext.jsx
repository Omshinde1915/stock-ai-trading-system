import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const toast = {
        success: (msg, dur) => showToast(msg, 'success', dur),
        error: (msg, dur) => showToast(msg, 'error', dur),
        info: (msg, dur) => showToast(msg, 'info', dur),
        warning: (msg, dur) => showToast(msg, 'warning', dur),
    };

    const getIcon = (type) => {
        if (type === 'success') return '✅';
        if (type === 'error') return '❌';
        if (type === 'warning') return '⚠️';
        return 'ℹ️';
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            className={`toast toast-${t.type}`}
                            initial={{ opacity: 0, x: 300, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 300, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <span className="toast-icon">{getIcon(t.type)}</span>
                            <span className="toast-message">{t.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context.toast;
};