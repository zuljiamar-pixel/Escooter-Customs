/**
 * Schreibgeschützter Zugriff auf standardisierte Bluetooth-SIG-GATT-Dienste über die Web Bluetooth API.
 *
 * Wichtig: Es werden ausschließlich Lesezugriffe auf öffentlich spezifizierte Dienste ausgeführt
 * (Battery Service 0x180F, Device Information 0x180A). Es werden keine proprietären Befehle gesendet und
 * keine Werte auf das Gerät geschrieben. Ob ein Scooter diese Dienste anbietet, ist nicht dokumentiert –
 * die App prüft es und zeigt das Ergebnis ehrlich an.
 */

export const STANDARD_SERVICES = {
  battery: 'battery_service',
  deviceInfo: 'device_information',
} as const;

const DEVICE_INFO_CHARACTERISTICS = {
  manufacturer: 'manufacturer_name_string',
  model: 'model_number_string',
  firmware: 'firmware_revision_string',
  hardware: 'hardware_revision_string',
  software: 'software_revision_string',
} as const;

export type DeviceInfoField = keyof typeof DEVICE_INFO_CHARACTERISTICS;

export interface ReadResult {
  services: { battery: boolean; deviceInfo: boolean };
  battery: number | null;
  info: Partial<Record<DeviceInfoField, string>>;
}

export type BleErrorCode =
  | 'unsupported'
  | 'insecure'
  | 'unavailable'
  | 'cancelled'
  | 'denied'
  | 'connect-failed'
  | 'timeout'
  | 'disconnected'
  | 'unknown';

export class BleError extends Error {
  readonly code: BleErrorCode;
  constructor(code: BleErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function bluetoothSupport(): 'ok' | 'unsupported' | 'insecure' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (!('bluetooth' in navigator) || !navigator.bluetooth) return 'unsupported';
  return 'ok';
}

export async function bluetoothAvailable(): Promise<boolean> {
  try {
    return (await navigator.bluetooth.getAvailability?.()) ?? true;
  } catch {
    return true;
  }
}

/** Übersetzt DOMExceptions der Web Bluetooth API in stabile Fehlercodes. */
export function mapBleError(err: unknown): BleError {
  if (err instanceof BleError) return err;
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : String(err);
  switch (name) {
    case 'NotFoundError':
      // Chrome meldet einen abgebrochenen Auswahldialog als NotFoundError.
      return new BleError('cancelled', message);
    case 'SecurityError':
    case 'NotAllowedError':
      return new BleError('denied', message);
    case 'NetworkError':
      return new BleError('connect-failed', message);
    case 'NotSupportedError':
      return new BleError('unsupported', message);
    case 'InvalidStateError':
      return new BleError('disconnected', message);
    default:
      return new BleError('unknown', message);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new BleError('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Öffnet den Geräteauswahldialog des Browsers. Erfordert eine Nutzeraktion (Klick). */
export async function requestDevice(): Promise<BluetoothDevice> {
  const support = bluetoothSupport();
  if (support !== 'ok') throw new BleError(support);
  if (!(await bluetoothAvailable())) throw new BleError('unavailable');
  try {
    return await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [STANDARD_SERVICES.battery, STANDARD_SERVICES.deviceInfo],
    });
  } catch (err) {
    throw mapBleError(err);
  }
}

export async function connectGatt(device: BluetoothDevice, timeoutMs = 15000): Promise<BluetoothRemoteGATTServer> {
  if (!device.gatt) throw new BleError('connect-failed', 'GATT not available');
  try {
    return await withTimeout(device.gatt.connect(), timeoutMs);
  } catch (err) {
    throw mapBleError(err);
  }
}

const decoder = new TextDecoder('utf-8');

async function tryService(server: BluetoothRemoteGATTServer, uuid: BluetoothServiceUUID) {
  try {
    return await server.getPrimaryService(uuid);
  } catch {
    return null;
  }
}

/** Liest nur, was das Gerät über Standarddienste freiwillig bereitstellt. */
export async function readStandardData(server: BluetoothRemoteGATTServer): Promise<ReadResult> {
  const result: ReadResult = { services: { battery: false, deviceInfo: false }, battery: null, info: {} };

  const battery = await tryService(server, STANDARD_SERVICES.battery);
  if (battery) {
    result.services.battery = true;
    try {
      const ch = await battery.getCharacteristic('battery_level');
      const value = await ch.readValue();
      const level = value.getUint8(0);
      if (level <= 100) result.battery = level;
    } catch {
      // Dienst vorhanden, Wert nicht lesbar
    }
  }

  const info = await tryService(server, STANDARD_SERVICES.deviceInfo);
  if (info) {
    result.services.deviceInfo = true;
    for (const [field, uuid] of Object.entries(DEVICE_INFO_CHARACTERISTICS) as [DeviceInfoField, string][]) {
      try {
        const ch = await info.getCharacteristic(uuid);
        const text = decoder.decode(await ch.readValue()).replace(/\0/g, '').trim();
        if (text) result.info[field] = text.slice(0, 64);
      } catch {
        // Merkmal nicht vorhanden
      }
    }
  }

  return result;
}
