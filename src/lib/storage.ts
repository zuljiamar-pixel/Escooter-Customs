export const STORAGE_PREFIX = 'ecp:v1:';

export type StorageErrorKind = 'quota' | 'unavailable';

type Listener = (kind: StorageErrorKind) => void;
const listeners = new Set<Listener>();

export function onStorageError(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(kind: StorageErrorKind) {
  listeners.forEach((l) => l(kind));
}

function getStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
  );
}

/** Liest einen Wert; bei fehlendem oder defektem Eintrag wird der Fallback geliefert. */
export function readStored<T>(key: string, fallback: T, sanitize?: (raw: unknown) => T | null): T {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (sanitize) return sanitize(parsed) ?? fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Schreibt einen Wert. Gibt false zurück, wenn der Speicher voll oder nicht verfügbar ist. */
export function writeStored(key: string, value: unknown): boolean {
  const store = getStore();
  if (!store) {
    emit('unavailable');
    return false;
  }
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    emit(isQuotaError(err) ? 'quota' : 'unavailable');
    return false;
  }
}

export function removeStored(key: string) {
  try {
    getStore()?.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignorieren
  }
}

export function clearAllStored() {
  const store = getStore();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => store.removeItem(k));
}

/** Belegter Speicher der App in Bytes (UTF-16, wie von Browsern gezählt) */
export function storageUsage(): number {
  const store = getStore();
  if (!store) return 0;
  let bytes = 0;
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) bytes += (k.length + (store.getItem(k)?.length ?? 0)) * 2;
  }
  return bytes;
}
