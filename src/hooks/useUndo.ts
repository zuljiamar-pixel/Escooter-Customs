import { useCallback, useRef, useState } from 'react';

const GROUP_MS = 600;
const LIMIT = 50;

/**
 * Einfache Undo/Redo-Historie für einen Wert. Schnelle Folgeänderungen (z. B. beim Ziehen eines Reglers)
 * werden zu einem Schritt zusammengefasst.
 */
export function useUndo<T>(current: T, apply: (value: T) => void) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastPush = useRef(0);
  const [, force] = useState(0);

  const record = useCallback(() => {
    const now = Date.now();
    if (now - lastPush.current > GROUP_MS) {
      past.current = [...past.current, current].slice(-LIMIT);
      future.current = [];
      force((n) => n + 1);
    }
    lastPush.current = now;
  }, [current]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(current);
    lastPush.current = 0;
    apply(prev);
    force((n) => n + 1);
  }, [current, apply]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(current);
    lastPush.current = 0;
    apply(next);
    force((n) => n + 1);
  }, [current, apply]);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    force((n) => n + 1);
  }, []);

  return { record, undo, redo, reset, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
