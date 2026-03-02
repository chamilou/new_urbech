'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Match CSS transition duration
  }, [onClose]);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}>
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>{getIcon()}</span>
        <span className={styles.toastMessage}>{message}</span>
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
      <div 
        className={styles.progressBar} 
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
