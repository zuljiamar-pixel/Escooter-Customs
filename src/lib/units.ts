import type { Units } from '../store/types';

const KM_PER_MILE = 1.609344;

export const kmhToMph = (kmh: number) => kmh / KM_PER_MILE;

export function formatSpeed(kmh: number, units: Units): number {
  return Math.round(units === 'imperial' ? kmhToMph(kmh) : kmh);
}

export function formatDistance(km: number, units: Units, digits = 1): string {
  const value = units === 'imperial' ? km / KM_PER_MILE : km;
  return value.toFixed(digits);
}

export const speedUnit = (units: Units) => (units === 'imperial' ? 'mph' : 'km/h');
export const distanceUnit = (units: Units) => (units === 'imperial' ? 'mi' : 'km');
