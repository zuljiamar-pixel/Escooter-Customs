export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  /** 0–360 */
  h: number;
  /** 0–1 */
  s: number;
  /** 0–1 */
  v: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

/** Normalisiert Eingaben wie "0af", "#00AAFF" oder " 00aaff " zu "#00aaff". Gibt null bei ungültigen Werten zurück. */
export function normalizeHex(value: string): string | null {
  const match = HEX_RE.exec(value.trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex}`;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) ?? '#000000';
  const n = parseInt(normalized.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const part = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (hh < 60) rgb = [c, x, 0];
  else if (hh < 120) rgb = [x, c, 0];
  else if (hh < 180) rgb = [0, c, x];
  else if (hh < 240) rgb = [0, x, c];
  else if (hh < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: Math.round((rgb[0] + m) * 255), g: Math.round((rgb[1] + m) * 255), b: Math.round((rgb[2] + m) * 255) };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const { h } = rgbToHsv({ r, g, b });
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const v = l + s * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);
  return hsvToRgb({ h, s: sv, v });
}

export const hexToHsv = (hex: string) => rgbToHsv(hexToRgb(hex));
export const hsvToHex = (hsv: HSV) => rgbToHex(hsvToRgb(hsv));

/** Relative Leuchtdichte nach WCAG 2.x */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text- oder Iconfarbe mit ausreichendem Kontrast auf einer Fläche */
export const readableOn = (hex: string) => (luminance(hex) > 0.4 ? '#05070d' : '#ffffff');

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

export function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = clamp(amount, 0, 1);
  return rgbToHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

export const shiftHue = (hex: string, degrees: number) => {
  const hsv = hexToHsv(hex);
  return hsvToHex({ ...hsv, h: (hsv.h + degrees + 360) % 360 });
};

export type HarmonyId = 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic';

export function harmony(hex: string, type: HarmonyId): string[] {
  switch (type) {
    case 'complementary':
      return [hex, shiftHue(hex, 180)];
    case 'analogous':
      return [shiftHue(hex, -30), hex, shiftHue(hex, 30)];
    case 'triadic':
      return [hex, shiftHue(hex, 120), shiftHue(hex, 240)];
    case 'split':
      return [hex, shiftHue(hex, 150), shiftHue(hex, 210)];
    case 'tetradic':
      return [hex, shiftHue(hex, 90), shiftHue(hex, 180), shiftHue(hex, 270)];
  }
}

export const formatRgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
};

export const formatHsl = (hex: string) => {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

/** Kanonische Neon-Farben der App */
export const NEON_PRESETS = [
  { id: 'blue', hex: '#00d4ff' },
  { id: 'red', hex: '#ff2d55' },
  { id: 'green', hex: '#39ff88' },
  { id: 'purple', hex: '#b14dff' },
  { id: 'orange', hex: '#ff8a1f' },
] as const;
