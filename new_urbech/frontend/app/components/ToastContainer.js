'use client'
import { useEffect, useState } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.css';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { message, type, duration } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type, duration }]);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className={styles.toastWrapper}>
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          duration={t.duration}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}
