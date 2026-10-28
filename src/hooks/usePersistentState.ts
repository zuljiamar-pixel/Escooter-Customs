import { useCallback, useEffect, useRef, useState } from 'react';
import { readStored, writeStored } from '../lib/storage';

type SetState<T> = (next: T | ((prev: T) => T)) => void;

/**
 * useState mit Persistenz in localStorage. Schreibvorgänge werden kurz gebündelt (z. B. beim Ziehen
 * von Elementen) und beim Verlassen der Seite sofort ausgeführt.
 */
export function usePersistentState<T>(
  key: string,
  initial: () => T,
  sanitize?: (raw: unknown) => T | null,
  delay = 250,
): [T, SetState<T>] {
  const [state, setState] = useState<T>(() => readStored(key, initial(), sanitize));
  const pending = useRef<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const first = useRef(true);

  const flush = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
    if (pending.current !== null) {
      writeStored(key, pending.current);
      pending.current = null;
    }
  }, [key]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pending.current = state;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, delay);
  }, [state, delay, flush]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  return [state, setState];
}
