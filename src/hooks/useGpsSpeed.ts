import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_GPS, nextGps, type GpsState } from '../lib/speed';

export type GpsStatus = 'idle' | 'locating' | 'active' | 'denied' | 'unavailable' | 'error';

/** Ohne neue Position so lange (ms) gilt das Signal als verloren; die Geschwindigkeit fällt dann auf 0. */
const STALE_MS = 6000;

/**
 * Echte Geschwindigkeit über die Geolocation API (W3C) des Browsers – nur mit Erlaubnis.
 * Misst das Handy, nicht den Scooter. Hält den Bildschirm wach, solange gemessen wird (falls unterstützt).
 */
export function useGpsSpeed() {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [status, setStatus] = useState<GpsStatus>(supported ? 'idle' : 'unavailable');
  const [gps, setGps] = useState<GpsState>(INITIAL_GPS);
  const watchRef = useRef<number | null>(null);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const releaseLock = () => {
    void lockRef.current?.release().catch(() => undefined);
    lockRef.current = null;
  };

  const stop = useCallback(() => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    releaseLock();
    setStatus((s) => (s === 'active' || s === 'locating' ? 'idle' : s));
    setGps((g) => ({ ...g, kmh: 0 }));
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setStatus('unavailable');
      return;
    }
    if (watchRef.current !== null) return;
    setStatus('locating');
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus('active');
        setGps((g) =>
          nextGps(g, { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, speed: pos.coords.speed, time: pos.timestamp }),
        );
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
          releaseLock();
          setStatus('denied');
        } else if (err.code === err.TIMEOUT) {
          setStatus('locating');
        } else {
          setStatus(err.code === err.POSITION_UNAVAILABLE ? 'unavailable' : 'error');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    navigator.wakeLock
      ?.request('screen')
      .then((lock) => {
        lockRef.current = lock;
      })
      .catch(() => undefined);
  }, [supported]);

  // Signal verloren: alte Geschwindigkeit nicht stehen lassen
  useEffect(() => {
    if (status !== 'active') return;
    const id = window.setInterval(() => {
      setGps((g) => {
        if (!g.last || Date.now() - g.last.time < STALE_MS || g.kmh === 0) return g;
        setStatus('locating');
        return { ...g, kmh: 0 };
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [status]);

  // Beim Verlassen der Seite Messung beenden
  useEffect(
    () => () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      releaseLock();
    },
    [],
  );

  const reset = useCallback(() => setGps((g) => ({ ...INITIAL_GPS, last: g.last, kmh: g.kmh, accuracy: g.accuracy })), []);

  return { status, ...gps, running: status === 'active' || status === 'locating', start, stop, reset };
}
