import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  bluetoothSupport,
  connectGatt,
  mapBleError,
  readStandardData,
  requestDevice,
  type BleErrorCode,
  type ReadResult,
} from '../lib/bluetooth';

export type BleStatus = 'idle' | 'requesting' | 'connecting' | 'reading' | 'connected' | 'disconnected' | 'error';
export type BleLogEvent =
  | 'request'
  | 'selected'
  | 'connecting'
  | 'connected'
  | 'reading'
  | 'read-done'
  | 'no-services'
  | 'disconnected'
  | 'user-disconnect'
  | 'error';

export interface BleLogEntry {
  id: number;
  time: number;
  event: BleLogEvent;
  detail?: string;
}

interface BluetoothState {
  support: ReturnType<typeof bluetoothSupport>;
  status: BleStatus;
  deviceName: string | null;
  result: ReadResult | null;
  error: BleErrorCode | null;
  lastRead: number | null;
  log: BleLogEntry[];
  scan: () => Promise<void>;
  reconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  disconnect: () => void;
  clearLog: () => void;
}

const BluetoothContext = createContext<BluetoothState | null>(null);
const POLL_MS = 30_000;

export function BluetoothProvider({ children }: { children: ReactNode }) {
  const [support] = useState(bluetoothSupport);
  const [status, setStatus] = useState<BleStatus>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [result, setResult] = useState<ReadResult | null>(null);
  const [error, setError] = useState<BleErrorCode | null>(null);
  const [lastRead, setLastRead] = useState<number | null>(null);
  const [log, setLog] = useState<BleLogEntry[]>([]);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
  const manualDisconnect = useRef(false);
  const logId = useRef(0);

  const addLog = useCallback((event: BleLogEvent, detail?: string) => {
    logId.current += 1;
    const entry = { id: logId.current, time: Date.now(), event, detail };
    setLog((l) => [entry, ...l].slice(0, 40));
  }, []);

  const fail = useCallback(
    (err: unknown) => {
      const e = mapBleError(err);
      setError(e.code);
      setStatus(e.code === 'cancelled' ? (serverRef.current?.connected ? 'connected' : 'idle') : 'error');
      addLog('error', e.code);
    },
    [addLog],
  );

  const onDisconnected = useCallback(() => {
    serverRef.current = null;
    if (manualDisconnect.current) {
      manualDisconnect.current = false;
      setStatus('idle');
      return;
    }
    setStatus('disconnected');
    addLog('disconnected');
  }, [addLog]);

  const read = useCallback(
    async (server: BluetoothRemoteGATTServer) => {
      setStatus('reading');
      addLog('reading');
      const data = await readStandardData(server);
      setResult(data);
      setLastRead(Date.now());
      addLog(data.services.battery || data.services.deviceInfo ? 'read-done' : 'no-services');
      setStatus('connected');
    },
    [addLog],
  );

  const connectTo = useCallback(
    async (device: BluetoothDevice) => {
      setStatus('connecting');
      addLog('connecting', device.name ?? undefined);
      const server = await connectGatt(device);
      serverRef.current = server;
      addLog('connected');
      await read(server);
    },
    [addLog, read],
  );

  const scan = useCallback(async () => {
    setError(null);
    setStatus('requesting');
    addLog('request');
    try {
      const device = await requestDevice();
      if (deviceRef.current && deviceRef.current !== device) {
        deviceRef.current.removeEventListener('gattserverdisconnected', onDisconnected);
        if (deviceRef.current.gatt?.connected) {
          manualDisconnect.current = true;
          deviceRef.current.gatt.disconnect();
        }
      }
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', onDisconnected);
      setDeviceName(device.name || null);
      setResult(null);
      addLog('selected', device.name ?? undefined);
      await connectTo(device);
    } catch (err) {
      fail(err);
    }
  }, [addLog, connectTo, fail, onDisconnected]);

  const reconnect = useCallback(async () => {
    const device = deviceRef.current;
    if (!device) return scan();
    setError(null);
    try {
      await connectTo(device);
    } catch (err) {
      fail(err);
    }
  }, [connectTo, fail, scan]);

  const refresh = useCallback(async () => {
    const server = serverRef.current;
    if (!server?.connected) return;
    try {
      await read(server);
    } catch (err) {
      fail(err);
    }
  }, [read, fail]);

  const disconnect = useCallback(() => {
    const device = deviceRef.current;
    addLog('user-disconnect');
    if (device?.gatt?.connected) {
      manualDisconnect.current = true;
      device.gatt.disconnect();
    } else {
      setStatus('idle');
    }
    serverRef.current = null;
  }, [addLog]);

  // Lesend aktualisieren, solange verbunden – es werden keine Werte geschrieben.
  useEffect(() => {
    if (status !== 'connected') return;
    const id = window.setInterval(() => {
      const server = serverRef.current;
      if (server?.connected && document.visibilityState === 'visible') {
        void readStandardData(server)
          .then((data) => {
            setResult(data);
            setLastRead(Date.now());
          })
          .catch(() => undefined);
      }
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(
    () => () => {
      const device = deviceRef.current;
      if (device?.gatt?.connected) {
        manualDisconnect.current = true;
        device.gatt.disconnect();
      }
    },
    [],
  );

  const clearLog = useCallback(() => setLog([]), []);

  const value = useMemo(
    () => ({ support, status, deviceName, result, error, lastRead, log, scan, reconnect, refresh, disconnect, clearLog }),
    [support, status, deviceName, result, error, lastRead, log, scan, reconnect, refresh, disconnect, clearLog],
  );

  return <BluetoothContext.Provider value={value}>{children}</BluetoothContext.Provider>;
}

export function useBluetooth(): BluetoothState {
  const ctx = useContext(BluetoothContext);
  if (!ctx) throw new Error('useBluetooth must be used inside BluetoothProvider');
  return ctx;
}
