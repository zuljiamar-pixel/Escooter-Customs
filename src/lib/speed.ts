/**
 * Geschwindigkeit aus Radumdrehungen und GPS.
 *
 * Ein Scooter misst seine Geschwindigkeit über die Radumdrehungen: Umdrehungen pro Minute × Radumfang.
 * Der Umfang ist in der Firmware fest hinterlegt. Ist der echte Reifen kleiner (abgefahren, wenig Luft)
 * oder größer, weicht die Anzeige von der echten Geschwindigkeit ab.
 */

const MM_PER_INCH = 25.4;

/** Radumfang in mm aus dem Außendurchmesser in Zoll */
export const circumferenceFromInch = (inch: number) => Math.PI * inch * MM_PER_INCH;

/** Außendurchmesser in mm aus dem Radumfang in mm */
export const diameterFromCircumference = (circumferenceMm: number) => circumferenceMm / Math.PI;

/** km/h aus Umdrehungen pro Minute und Radumfang in mm */
export const speedFromRpm = (rpm: number, circumferenceMm: number) => (rpm * circumferenceMm * 60) / 1_000_000;

/** Umdrehungen pro Minute bei einer Geschwindigkeit in km/h */
export const rpmFromSpeed = (kmh: number, circumferenceMm: number) =>
  circumferenceMm > 0 ? (kmh * 1_000_000) / (circumferenceMm * 60) : 0;

/**
 * Echte Geschwindigkeit, wenn die Anzeige mit einem anderen Umfang rechnet, als der Reifen wirklich hat.
 * Gleiche Umdrehungen, anderer Umfang: die Strecke pro Umdrehung ändert sich im selben Verhältnis.
 */
export const correctedSpeed = (displayedKmh: number, assumedCircumferenceMm: number, actualCircumferenceMm: number) =>
  assumedCircumferenceMm > 0 ? (displayedKmh * actualCircumferenceMm) / assumedCircumferenceMm : 0;

/** Wie viel Prozent die Anzeige über (+) oder unter (−) der echten Geschwindigkeit liegt */
export const displayDeviation = (displayedKmh: number, realKmh: number) => (realKmh > 0 ? ((displayedKmh - realKmh) / realKmh) * 100 : 0);

const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Abstand zweier Koordinaten in Metern (Haversine) */
export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface GpsFix {
  lat: number;
  lon: number;
  /** Genauigkeit der Position in Metern */
  accuracy: number;
  /** Geschwindigkeit des Geräts in m/s, falls der Browser sie liefert */
  speed: number | null;
  /** Zeitpunkt in ms */
  time: number;
}

export interface GpsState {
  last: GpsFix | null;
  kmh: number;
  maxKmh: number;
  distanceKm: number;
  accuracy: number | null;
}

export const INITIAL_GPS: GpsState = { last: null, kmh: 0, maxKmh: 0, distanceKm: 0, accuracy: null };

/** Ab dieser Genauigkeit (m) zählen Höchstwert und Strecke */
export const GOOD_ACCURACY_M = 30;
/** Darunter gilt man als stehend: GPS-Rauschen im Stand soll nicht als Fahrt erscheinen */
const STANDSTILL_KMH = 2;

/** Verarbeitet eine neue GPS-Position zu Geschwindigkeit, Höchstwert und Strecke. */
export function nextGps(state: GpsState, fix: GpsFix): GpsState {
  const prev = state.last;
  const step = prev ? distanceM(prev.lat, prev.lon, fix.lat, fix.lon) : 0;
  const dt = prev ? (fix.time - prev.time) / 1000 : 0;

  let raw: number;
  if (fix.speed !== null && Number.isFinite(fix.speed) && fix.speed >= 0) raw = fix.speed * 3.6;
  else if (prev && dt >= 0.5) raw = (step / dt) * 3.6;
  else raw = state.kmh;

  // Leicht glätten, damit die Zahl nicht springt, aber schnell genug für die Fahrt reagiert.
  let kmh = state.kmh > 0 && raw > 0 ? state.kmh * 0.35 + raw * 0.65 : raw;
  if (kmh < STANDSTILL_KMH) kmh = 0;

  const good = fix.accuracy <= GOOD_ACCURACY_M;
  return {
    last: fix,
    kmh,
    maxKmh: good ? Math.max(state.maxKmh, kmh) : state.maxKmh,
    distanceKm: state.distanceKm + (prev && good && kmh > 0 ? step / 1000 : 0),
    accuracy: fix.accuracy,
  };
}
