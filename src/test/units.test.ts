import { describe, expect, it } from 'vitest';
import { formatDistance, formatSpeed, gaugeFraction, speedUnit } from '../lib/units';
import { validateImageFile, MAX_UPLOAD_BYTES } from '../lib/image';
import { safeFilename } from '../lib/download';
import { mapBleError } from '../lib/bluetooth';

describe('units', () => {
  it('converts speed and distance', () => {
    expect(formatSpeed(25, 'metric')).toBe(25);
    expect(formatSpeed(25, 'imperial')).toBe(16);
    expect(formatDistance(16.09344, 'imperial')).toBe('10.0');
    expect(speedUnit('imperial')).toBe('mph');
  });
});

describe('uploads & filenames', () => {
  it('validates image files', () => {
    expect(validateImageFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'application/pdf', size: 1000 })).toBe('type');
    expect(validateImageFile({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 })).toBe('size');
  });

  it('creates safe filenames', () => {
    expect(safeFilename('Über Neon!!')).toBe('uber-neon');
    expect(safeFilename('Neon Blue 2')).toBe('neon-blue-2');
    expect(safeFilename('***')).toBe('design');
  });
});

describe('bluetooth error mapping', () => {
  it('maps DOMException names to stable codes', () => {
    const err = (name: string) => Object.assign(new Error('x'), { name });
    expect(mapBleError(err('NotFoundError')).code).toBe('cancelled');
    expect(mapBleError(err('SecurityError')).code).toBe('denied');
    expect(mapBleError(err('NetworkError')).code).toBe('connect-failed');
    expect(mapBleError(err('Whatever')).code).toBe('unknown');
  });

  it('fills the gauge relative to the model maximum', () => {
    expect(gaugeFraction(0, 45)).toBe(0);
    expect(gaugeFraction(22.5, 45)).toBe(0.5);
    expect(gaugeFraction(45, 45)).toBe(1);
    expect(gaugeFraction(60, 45)).toBe(1);
    expect(gaugeFraction(-3, 45)).toBe(0);
    expect(gaugeFraction(10, 0)).toBe(0);
  });
});
