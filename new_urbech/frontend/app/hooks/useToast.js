// hooks/useToast.js
'use client';
import { useCallback } from 'react';

export function useToast() {
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const event = new CustomEvent('toast', { detail: { message, type, duration } });
    window.dispatchEvent(event);
  }, []);

  return showToast;
}
