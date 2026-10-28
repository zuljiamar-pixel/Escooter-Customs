import { clamp, normalizeHex } from '../lib/color';
import { ELEMENT_IDS } from '../data/layouts';
import { isModelId } from '../data/scooters';
import type {
  BackgroundStyle,
  BootBackground,
  BootDesign,
  BootEffect,
  BootEmblem,
  DisplayTheme,
  DriveMode,
  ElementId,
  FontId,
  LayoutElement,
  LayoutId,
  PreviewValues,
  Settings,
  ThemeCategory,
} from './types';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
const num = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
const str = (value: unknown, maxLen: number, fallback = '') =>
  typeof value === 'string' ? value.slice(0, maxLen) : fallback;
const hex = (value: unknown, fallback: string) => (typeof value === 'string' ? (normalizeHex(value) ?? fallback) : fallback);
const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

export const FONT_IDS: FontId[] = ['segment', 'orbitron', 'rajdhani', 'mono', 'audiowide', 'clean'];
export const LAYOUTS: LayoutId[] = ['classic', 'sport', 'minimal', 'arc', 'custom'];
export const BG_STYLES: BackgroundStyle[] = ['solid', 'gradient', 'grid', 'carbon'];
export const CATEGORIES: ThemeCategory[] = ['neon', 'classic', 'sport', 'minimal', 'retro'];
export const BOOT_EFFECTS: BootEffect[] = ['fade', 'pulse', 'scan', 'glitch', 'ring', 'particles', 'hyperdrive'];
export const BOOT_EMBLEMS: BootEmblem[] = ['bolt', 'ring', 'wing', 'hex', 'none'];
export const BOOT_BACKGROUNDS: BootBackground[] = ['solid', 'radial', 'grid'];
export const DRIVE_MODES: DriveMode[] = ['eco', 'drive', 'sport'];

const DATA_URL_RE = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i;
/** Max. Länge eines eingebetteten Logos (~3 MB Base64) */
const MAX_LOGO_LENGTH = 3_000_000;

export function sanitizeTheme(raw: unknown): DisplayTheme | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  const now = Date.now();
  return {
    id: str(raw.id, 80),
    name: str(raw.name, 40, 'Theme').trim() || 'Theme',
    primary: hex(raw.primary, '#00d4ff'),
    background: hex(raw.background, '#02060f'),
    accent: hex(raw.accent, '#2f6bff'),
    font: oneOf(raw.font, FONT_IDS, 'segment'),
    layout: oneOf(raw.layout, LAYOUTS, 'classic'),
    backgroundStyle: oneOf(raw.backgroundStyle, BG_STYLES, 'solid'),
    glow: num(raw.glow, 0, 100, 50),
    category: oneOf(raw.category, CATEGORIES, 'neon'),
    createdAt: num(raw.createdAt, 0, Number.MAX_SAFE_INTEGER, now),
    updatedAt: num(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, now),
  };
}

export function sanitizeLayout(raw: unknown): LayoutElement[] | null {
  if (!Array.isArray(raw)) return null;
  const byId = new Map<ElementId, LayoutElement>();
  for (const item of raw) {
    if (!isObj(item)) continue;
    const id = oneOf<ElementId | ''>(item.id, ELEMENT_IDS, '');
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      x: num(item.x, 0, 100, 50),
      y: num(item.y, 0, 100, 50),
      scale: num(item.scale, 0.4, 2, 1),
      visible: bool(item.visible, true),
    });
  }
  if (byId.size === 0) return null;
  // Fehlende Elemente werden ausgeblendet ergänzt, damit jedes Layout vollständig ist.
  return ELEMENT_IDS.map((id) => byId.get(id) ?? { id, x: 50, y: 50, scale: 1, visible: false });
}

export function sanitizeBoot(raw: unknown): BootDesign | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  const now = Date.now();
  const logo =
    typeof raw.logo === 'string' && raw.logo.length <= MAX_LOGO_LENGTH && DATA_URL_RE.test(raw.logo) ? raw.logo : null;
  return {
    id: str(raw.id, 80),
    name: str(raw.name, 40, 'Boot-Logo').trim() || 'Boot-Logo',
    model: isModelId(raw.model) ? raw.model : 'max-g3',
    templateId: typeof raw.templateId === 'string' ? raw.templateId.slice(0, 40) : null,
    logo,
    logoScale: num(raw.logoScale, 0.15, 1, 0.55),
    logoTint: bool(raw.logoTint, false),
    emblem: oneOf(raw.emblem, BOOT_EMBLEMS, 'bolt'),
    title: str(raw.title, 24),
    subtitle: str(raw.subtitle, 32),
    font: oneOf(raw.font, ['orbitron', 'rajdhani', 'mono', 'audiowide', 'clean'] as const, 'orbitron'),
    textColor: hex(raw.textColor, '#ffffff'),
    glowColor: hex(raw.glowColor, '#00d4ff'),
    background: hex(raw.background, '#000000'),
    background2: hex(raw.background2, '#062a3d'),
    backgroundStyle: oneOf(raw.backgroundStyle, BOOT_BACKGROUNDS, 'radial'),
    effect: oneOf(raw.effect, BOOT_EFFECTS, 'fade'),
    duration: num(raw.duration, 1.5, 8, 3.2),
    glow: num(raw.glow, 0, 100, 70),
    showProgress: bool(raw.showProgress, true),
    createdAt: num(raw.createdAt, 0, Number.MAX_SAFE_INTEGER, now),
    updatedAt: num(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, now),
  };
}

export function sanitizeList<T>(raw: unknown, item: (r: unknown) => T | null, max = 200): T[] | null {
  if (!Array.isArray(raw)) return null;
  const out: T[] = [];
  for (const r of raw.slice(0, max)) {
    const v = item(r);
    if (v) out.push(v);
  }
  return out;
}

export function sanitizePreview(raw: unknown, fallback: PreviewValues): PreviewValues {
  if (!isObj(raw)) return fallback;
  return {
    speed: num(raw.speed, 0, 99, fallback.speed),
    battery: num(raw.battery, 0, 100, fallback.battery),
    mode: oneOf(raw.mode, DRIVE_MODES, fallback.mode),
    light: bool(raw.light, fallback.light),
    bluetooth: bool(raw.bluetooth, fallback.bluetooth),
    trip: num(raw.trip, 0, 9999, fallback.trip),
  };
}

export function sanitizeSettings(raw: unknown, fallback: Settings): Settings {
  if (!isObj(raw)) return fallback;
  return {
    language: oneOf(raw.language, ['de', 'en'] as const, fallback.language),
    uiTheme: oneOf(raw.uiTheme, ['dark', 'light', 'system'] as const, fallback.uiTheme),
    units: oneOf(raw.units, ['metric', 'imperial'] as const, fallback.units),
    clock24h: bool(raw.clock24h, fallback.clock24h),
    uiAccent: hex(raw.uiAccent, fallback.uiAccent),
    sounds: bool(raw.sounds, fallback.sounds),
    soundPack: oneOf(raw.soundPack, ['neon', 'soft', 'retro'] as const, fallback.soundPack),
    volume: num(raw.volume, 0, 1, fallback.volume),
    splash: oneOf(raw.splash, ['neon-scan', 'pulse', 'hyperdrive', 'glitch', 'none'] as const, fallback.splash),
    reducedMotion: bool(raw.reducedMotion, fallback.reducedMotion),
    displayAnimations: bool(raw.displayAnimations, fallback.displayAnimations),
  };
}

export function sanitizeColorList(raw: unknown, max: number): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const v of raw) {
    const h = typeof v === 'string' ? normalizeHex(v) : null;
    if (h && !out.includes(h)) out.push(h);
    if (out.length >= max) break;
  }
  return out;
}
