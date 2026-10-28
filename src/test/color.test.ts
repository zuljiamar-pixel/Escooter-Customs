import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  harmony,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  isHex,
  mix,
  normalizeHex,
  readableOn,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
} from '../lib/color';

describe('color utils', () => {
  it('normalizes hex codes', () => {
    expect(normalizeHex('0af')).toBe('#00aaff');
    expect(normalizeHex(' #00AAFF ')).toBe('#00aaff');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('zzz')).toBeNull();
    expect(isHex('#abc')).toBe(true);
    expect(isHex(42)).toBe(false);
  });

  it('round-trips rgb <-> hex', () => {
    expect(hexToRgb('#00d4ff')).toEqual({ r: 0, g: 212, b: 255 });
    expect(rgbToHex({ r: 0, g: 212, b: 255 })).toBe('#00d4ff');
    expect(rgbToHex({ r: 300, g: -5, b: 12.4 })).toBe('#ff000c');
  });

  it('round-trips hsv <-> hex for many colors', () => {
    for (const hex of ['#00d4ff', '#ff2d55', '#39ff88', '#b14dff', '#ff8a1f', '#000000', '#ffffff', '#808080']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it('round-trips hsl', () => {
    const rgb = hexToRgb('#3d8bff');
    const back = hslToRgb(rgbToHsl(rgb));
    expect(rgbToHex(back)).toBe('#3d8bff');
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(readableOn('#ffffff')).toBe('#05070d');
    expect(readableOn('#000000')).toBe('#ffffff');
  });

  it('builds harmonies', () => {
    expect(harmony('#ff0000', 'complementary')).toEqual(['#ff0000', '#00ffff']);
    expect(harmony('#ff0000', 'triadic')).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    expect(harmony('#ff0000', 'tetradic')).toHaveLength(4);
  });

  it('mixes colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#000000', '#ffffff', 2)).toBe('#ffffff');
  });
});
