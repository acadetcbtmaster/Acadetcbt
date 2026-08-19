import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  type: ToastType;
}

/** Auto-dismissing toast state shared by the admin modules and student views. */
export function useToast(durationMs = 3500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (text: string, type: ToastType = 'success') => {
      clearTimer();
      setToast({ text, type });
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setToast(null);
      }, durationMs);
    },
    [clearTimer, durationMs]
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { toast, showToast, hideToast };
}
