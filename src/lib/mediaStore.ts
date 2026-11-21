/**
 * Lokaler Videospeicher für eigene Startbildschirme (IndexedDB).
 * Videos sind zu groß für localStorage; sie bleiben nur in diesem Browser auf diesem Gerät.
 */

const DB_NAME = 'ecp-media';
const STORE = 'videos';
/** Frisch gespeicherte Videos werden so lange (ms) nicht aufgeräumt, auch wenn sie noch nirgends verwendet werden. */
const PRUNE_GRACE_MS = 60_000;

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

interface VideoRecord {
  id: string;
  blob: Blob;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('unavailable'));
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open'));
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = work(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error ?? new Error('tx'));
        tx.onabort = () => reject(tx.error ?? new Error('abort'));
      }),
  );
}

const urlCache = new Map<string, string>();

export async function putVideo(blob: Blob): Promise<string> {
  const id = `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await run('readwrite', (s) => s.put({ id, blob, createdAt: Date.now() } satisfies VideoRecord));
  return id;
}

/** Objekt-URL eines gespeicherten Videos, oder null, wenn es auf diesem Gerät nicht (mehr) vorhanden ist. */
export async function videoUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  try {
    const rec = await run<VideoRecord | undefined>('readonly', (s) => s.get(id) as IDBRequest<VideoRecord | undefined>);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

/** Löscht alle Videos, die von keinem Entwurf und keinem gespeicherten Design mehr verwendet werden. */
export async function pruneVideos(used: Set<string>): Promise<void> {
  try {
    const all = await run<VideoRecord[]>('readonly', (s) => s.getAll() as IDBRequest<VideoRecord[]>);
    const stale = all.filter((r) => !used.has(r.id) && Date.now() - r.createdAt > PRUNE_GRACE_MS);
    for (const r of stale) {
      await run('readwrite', (s) => s.delete(r.id));
      const url = urlCache.get(r.id);
      if (url) URL.revokeObjectURL(url);
      urlCache.delete(r.id);
    }
  } catch {
    // Speicher nicht verfügbar – nichts aufzuräumen
  }
}

export async function clearVideos(): Promise<void> {
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    // ignorieren
  }
  urlCache.forEach((url) => URL.revokeObjectURL(url));
  urlCache.clear();
}

/** Lädt ein Video-Element mit erstem Bild; null, wenn das Video fehlt oder der Browser es nicht abspielen kann. */
export function loadVideoElement(url: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    const done = (ok: boolean) => {
      clearTimeout(timer);
      v.onloadeddata = null;
      v.onerror = null;
      resolve(ok ? v : null);
    };
    const timer = setTimeout(() => done(v.readyState >= 2), 15000);
    v.onloadeddata = () => done(true);
    v.onerror = () => done(false);
    v.src = url;
  });
}

/** Springt im Video an eine Stelle und wartet, bis das Bild dort bereitsteht. */
export function seekVideo(v: HTMLVideoElement, time: number): Promise<void> {
  const target = Math.max(0, Math.min(time, (Number.isFinite(v.duration) ? v.duration : time) - 0.05));
  const there = Math.abs(v.currentTime - target) < 0.02;
  // currentTime springt sofort auf das Ziel, das Bild dazu ist aber erst nach „seeked“ fertig.
  if (there && v.readyState >= 2 && !v.seeking) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      v.removeEventListener('seeked', finish);
      resolve();
    };
    const timer = setTimeout(finish, 3000);
    v.addEventListener('seeked', finish);
    if (!there) v.currentTime = target;
  });
}
