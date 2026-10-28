export type ModelId = 'max-g3' | 'f3-pro';
export type Lang = 'de' | 'en';
export type Localized = Record<Lang, string>;

export type FontId = 'segment' | 'orbitron' | 'rajdhani' | 'mono' | 'audiowide' | 'clean';
export type LayoutId = 'classic' | 'sport' | 'minimal' | 'arc' | 'custom';
export type BackgroundStyle = 'solid' | 'gradient' | 'grid' | 'carbon';
export type DriveMode = 'eco' | 'drive' | 'sport';
export type ThemeCategory = 'neon' | 'classic' | 'sport' | 'minimal' | 'retro';

/** Ein Display-Design. Wird nur in der App gerendert – es gibt keine bestätigte Übertragung auf den Scooter. */
export interface DisplayTheme {
  id: string;
  name: string;
  primary: string;
  background: string;
  accent: string;
  font: FontId;
  layout: LayoutId;
  backgroundStyle: BackgroundStyle;
  /** Leuchtintensität 0–100 */
  glow: number;
  category?: ThemeCategory;
  builtin?: boolean;
  description?: Localized;
  createdAt: number;
  updatedAt: number;
}

/** Arbeitsstand im Display-Customizer pro Modell. */
export interface ActiveDesign {
  theme: DisplayTheme;
  /** Theme, aus dem das aktive Design stammt (Store oder Galerie). */
  sourceId: string | null;
  /** Gesetzt, wenn ein gespeichertes eigenes Theme bearbeitet wird. */
  editingId: string | null;
}

export type ElementId = 'speed' | 'unit' | 'gauge' | 'battery' | 'mode' | 'trip' | 'light' | 'bluetooth' | 'clock';

export interface LayoutElement {
  id: ElementId;
  /** Mittelpunkt in Prozent der Displaybreite */
  x: number;
  /** Mittelpunkt in Prozent der Displayhöhe */
  y: number;
  scale: number;
  visible: boolean;
}

export type BootEffect = 'fade' | 'pulse' | 'scan' | 'glitch' | 'ring' | 'particles' | 'hyperdrive';
export type BootEmblem = 'bolt' | 'ring' | 'wing' | 'hex' | 'none';
export type BootBackground = 'solid' | 'radial' | 'grid';

export interface BootDesign {
  id: string;
  name: string;
  model: ModelId;
  templateId: string | null;
  /** Hochgeladenes Logo als Data-URL (lokal verkleinert) */
  logo: string | null;
  logoScale: number;
  logoTint: boolean;
  emblem: BootEmblem;
  title: string;
  subtitle: string;
  font: Exclude<FontId, 'segment'>;
  textColor: string;
  glowColor: string;
  background: string;
  background2: string;
  backgroundStyle: BootBackground;
  effect: BootEffect;
  /** Dauer in Sekunden */
  duration: number;
  glow: number;
  showProgress: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BootDraft {
  design: BootDesign;
  editingId: string | null;
}

export interface PreviewValues {
  speed: number;
  battery: number;
  mode: DriveMode;
  light: boolean;
  bluetooth: boolean;
  trip: number;
}

export type UiTheme = 'dark' | 'light' | 'system';
export type Units = 'metric' | 'imperial';
export type SplashAnimation = 'neon-scan' | 'pulse' | 'hyperdrive' | 'glitch' | 'none';
export type SoundPack = 'neon' | 'soft' | 'retro';

export interface Settings {
  language: Lang;
  uiTheme: UiTheme;
  units: Units;
  clock24h: boolean;
  uiAccent: string;
  sounds: boolean;
  soundPack: SoundPack;
  volume: number;
  splash: SplashAnimation;
  reducedMotion: boolean;
  displayAnimations: boolean;
}

export type CompatLevel = 'app' | 'official' | 'unsupported';
