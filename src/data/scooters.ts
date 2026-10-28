import type { Localized, ModelId } from '../store/types';

export interface ScooterSpec {
  id: string;
  label: Localized;
  value: Localized;
}

export interface ScooterModel {
  id: ModelId;
  name: string;
  short: string;
  tagline: Localized;
  /** Kurzbeschreibung des Displays */
  display: Localized;
  /** Obergrenze für den Geschwindigkeits-Regler der Vorschau (EU-Variante E) */
  previewMaxKmh: number;
  wheelInch: number;
  batteryWh: number;
  rangeKm: number;
  originalThemeId: string;
  specs: ScooterSpec[];
}

/**
 * Technische Daten aus Hersteller- und Händlerangaben (recherchiert 10/2026).
 * Werte unterscheiden sich je nach Region und Variante (z. B. D = 20 km/h, E = 25 km/h).
 */
export const SCOOTERS: Record<ModelId, ScooterModel> = {
  'max-g3': {
    id: 'max-g3',
    name: 'Segway-Ninebot MAX G3',
    short: 'MAX G3',
    tagline: {
      de: 'Langstrecken-Pendler mit 11″-Reifen und großem 597-Wh-Akku',
      en: 'Long-range commuter with 11″ tires and a large 597 Wh battery',
    },
    display: { de: '2,4″ TFT-Farbdisplay', en: '2.4″ color TFT display' },
    previewMaxKmh: 25,
    wheelInch: 11,
    batteryWh: 597,
    rangeKm: 80,
    originalThemeId: 'original-max-g3',
    specs: [
      { id: 'display', label: { de: 'Display', en: 'Display' }, value: { de: '2,4″ TFT-Farbdisplay', en: '2.4″ color TFT' } },
      { id: 'battery', label: { de: 'Akku', en: 'Battery' }, value: { de: '597 Wh (48 V, 12,8 Ah)', en: '597 Wh (48 V, 12.8 Ah)' } },
      { id: 'range', label: { de: 'Reichweite', en: 'Range' }, value: { de: 'bis zu 80 km (Herstellerangabe, Eco)', en: 'up to 80 km (manufacturer claim, Eco)' } },
      {
        id: 'motor',
        label: { de: 'Motor', en: 'Motor' },
        value: { de: 'bis 2000 W Spitze · Nennleistung je nach Region (z. B. 500 W, Variante D)', en: 'up to 2000 W peak · rated power varies by region (e.g. 500 W, variant D)' },
      },
      { id: 'speed', label: { de: 'Höchstgeschwindigkeit', en: 'Top speed' }, value: { de: '20 km/h (D) · 25 km/h (E) · regional abweichend', en: '20 km/h (D) · 25 km/h (E) · varies by region' } },
      { id: 'tires', label: { de: 'Reifen', en: 'Tires' }, value: { de: '11″ schlauchlos, selbstdichtend', en: '11″ tubeless, self-sealing' } },
      { id: 'climb', label: { de: 'Steigfähigkeit', en: 'Hill grade' }, value: { de: 'bis 30 %', en: 'up to 30 %' } },
      { id: 'water', label: { de: 'Wasserschutz', en: 'Water resistance' }, value: { de: 'IPX6 (Fahrzeug) · IPX7 (Akku)', en: 'IPX6 (vehicle) · IPX7 (battery)' } },
      { id: 'weight', label: { de: 'Gewicht', en: 'Weight' }, value: { de: 'ca. 24,2–24,6 kg', en: 'approx. 24.2–24.6 kg' } },
      { id: 'charge', label: { de: 'Ladezeit', en: 'Charging time' }, value: { de: 'ca. 3,5 h (integriertes Ladegerät)', en: 'approx. 3.5 h (built-in charger)' } },
    ],
  },
  'f3-pro': {
    id: 'f3-pro',
    name: 'Segway-Ninebot F3 Pro',
    short: 'F3 PRO',
    tagline: {
      de: 'Kompakter Allrounder mit 10″-Reifen und 477-Wh-Akku',
      en: 'Compact all-rounder with 10″ tires and a 477 Wh battery',
    },
    display: { de: '2,4″ TFT-Farbdisplay', en: '2.4″ color TFT display' },
    previewMaxKmh: 25,
    wheelInch: 10,
    batteryWh: 477,
    rangeKm: 70,
    originalThemeId: 'original-f3-pro',
    specs: [
      { id: 'display', label: { de: 'Display', en: 'Display' }, value: { de: '2,4″ TFT-Farbdisplay', en: '2.4″ color TFT' } },
      { id: 'battery', label: { de: 'Akku', en: 'Battery' }, value: { de: '477 Wh (46,8 V, 10,2 Ah)', en: '477 Wh (46.8 V, 10.2 Ah)' } },
      {
        id: 'range',
        label: { de: 'Reichweite', en: 'Range' },
        value: { de: 'bis zu 70 km (Eco) · ca. 50 km (D) · ca. 40 km (S)', en: 'up to 70 km (Eco) · approx. 50 km (D) · approx. 40 km (S)' },
      },
      {
        id: 'motor',
        label: { de: 'Motor', en: 'Motor' },
        value: { de: '550 W Nenn- / 1200 W Spitzenleistung · regional abweichend', en: '550 W rated / 1200 W peak · varies by region' },
      },
      { id: 'speed', label: { de: 'Höchstgeschwindigkeit', en: 'Top speed' }, value: { de: '20 km/h (D) · 25 km/h (E) · regional abweichend', en: '20 km/h (D) · 25 km/h (E) · varies by region' } },
      { id: 'tires', label: { de: 'Reifen', en: 'Tires' }, value: { de: '10″ schlauchlos, selbstdichtend', en: '10″ tubeless, self-sealing' } },
      { id: 'climb', label: { de: 'Steigfähigkeit', en: 'Hill grade' }, value: { de: 'bis 24 %', en: 'up to 24 %' } },
      { id: 'load', label: { de: 'Max. Zuladung', en: 'Max. load' }, value: { de: '120 kg', en: '120 kg' } },
      { id: 'water', label: { de: 'Wasserschutz', en: 'Water resistance' }, value: { de: 'IPX6 (Fahrzeug) · IPX7 (Akku)', en: 'IPX6 (vehicle) · IPX7 (battery)' } },
      { id: 'weight', label: { de: 'Gewicht', en: 'Weight' }, value: { de: 'ca. 19,3–19,9 kg', en: 'approx. 19.3–19.9 kg' } },
      {
        id: 'findmy',
        label: { de: 'Ortung', en: 'Tracking' },
        value: { de: 'Apple „Wo ist?“ über die offizielle Segway-App', en: 'Apple Find My via the official Segway app' },
      },
    ],
  },
};

export const MODEL_IDS: ModelId[] = ['max-g3', 'f3-pro'];

export const isModelId = (value: unknown): value is ModelId => value === 'max-g3' || value === 'f3-pro';
