import { useCallback, useRef } from 'react';

/** Liefert eine Funktion mit stabiler Identität, die immer die aktuelle Implementierung aufruft. */
export function useCallbackStable<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: A) => ref.current(...args), []);
}
