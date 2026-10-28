import type { BackgroundStyle, DisplayTheme, FontId, LayoutId, Localized, ModelId, ThemeCategory } from '../store/types';

interface ThemeSeed {
  id: string;
  name: string;
  primary: string;
  background: string;
  accent: string;
  font: FontId;
  layout: LayoutId;
  backgroundStyle: BackgroundStyle;
  glow: number;
  category: ThemeCategory;
  description: Localized;
}

const seed = (s: ThemeSeed): DisplayTheme => ({ ...s, builtin: true, createdAt: 0, updatedAt: 0 });

/** Nachgestellter Standard-Look (keine Originalgrafik des Herstellers). */
export const ORIGINAL_THEMES: Record<ModelId, DisplayTheme> = {
  'max-g3': seed({
    id: 'original-max-g3',
    name: 'Original MAX G3',
    primary: '#f4f8ff',
    background: '#020305',
    accent: '#19b6ff',
    font: 'clean',
    layout: 'classic',
    backgroundStyle: 'solid',
    glow: 15,
    category: 'classic',
    description: {
      de: 'Schlichter Werks-Look, nachempfunden. Weiße Ziffern, blaue Akzente.',
      en: 'Plain factory-style look, recreated. White digits, blue accents.',
    },
  }),
  'f3-pro': seed({
    id: 'original-f3-pro',
    name: 'Original F3 Pro',
    primary: '#ffffff',
    background: '#030304',
    accent: '#25c4ff',
    font: 'clean',
    layout: 'classic',
    backgroundStyle: 'solid',
    glow: 12,
    category: 'classic',
    description: {
      de: 'Schlichter Werks-Look, nachempfunden. Klare Ziffern, dezente Akzente.',
      en: 'Plain factory-style look, recreated. Crisp digits, subtle accents.',
    },
  }),
};

export const STORE_THEMES: DisplayTheme[] = [
  seed({
    id: 'neon-blue',
    name: 'Neon Blue',
    primary: '#00d4ff',
    background: '#02060f',
    accent: '#2f6bff',
    font: 'segment',
    layout: 'classic',
    backgroundStyle: 'grid',
    glow: 80,
    category: 'neon',
    description: { de: 'Das Signature-Theme: Segmentziffern in Neon-Blau auf Gitter.', en: 'The signature theme: neon blue segment digits on a grid.' },
  }),
  seed({
    id: 'crimson-rush',
    name: 'Crimson Rush',
    primary: '#ff2d55',
    background: '#0a0204',
    accent: '#ff8a1f',
    font: 'orbitron',
    layout: 'sport',
    backgroundStyle: 'gradient',
    glow: 70,
    category: 'sport',
    description: { de: 'Aggressives Rot mit Sport-Layout.', en: 'Aggressive red with a sport layout.' },
  }),
  seed({
    id: 'toxic-green',
    name: 'Toxic Green',
    primary: '#39ff88',
    background: '#020a05',
    accent: '#c6ff00',
    font: 'mono',
    layout: 'classic',
    backgroundStyle: 'grid',
    glow: 75,
    category: 'neon',
    description: { de: 'Giftgrünes Terminal-Feeling.', en: 'Toxic green terminal vibes.' },
  }),
  seed({
    id: 'ultra-violet',
    name: 'Ultra Violet',
    primary: '#b14dff',
    background: '#07020f',
    accent: '#ff4dd8',
    font: 'audiowide',
    layout: 'arc',
    backgroundStyle: 'gradient',
    glow: 85,
    category: 'neon',
    description: { de: 'Lila Rundinstrument mit Pink-Akzenten.', en: 'Purple arc gauge with pink accents.' },
  }),
  seed({
    id: 'sunset-drive',
    name: 'Sunset Drive',
    primary: '#ff8a1f',
    background: '#0d0503',
    accent: '#ffd23f',
    font: 'rajdhani',
    layout: 'sport',
    backgroundStyle: 'gradient',
    glow: 60,
    category: 'retro',
    description: { de: 'Warme Abendfarben für Feierabendfahrten.', en: 'Warm evening colors for the ride home.' },
  }),
  seed({
    id: 'arctic-white',
    name: 'Arctic White',
    primary: '#f2f8ff',
    background: '#05080d',
    accent: '#7fd6ff',
    font: 'clean',
    layout: 'minimal',
    backgroundStyle: 'solid',
    glow: 25,
    category: 'minimal',
    description: { de: 'Maximale Lesbarkeit, minimale Ablenkung.', en: 'Maximum legibility, minimal distraction.' },
  }),
  seed({
    id: 'synthwave-84',
    name: 'Synthwave 84',
    primary: '#ff4dd8',
    background: '#0b0220',
    accent: '#00e5ff',
    font: 'audiowide',
    layout: 'arc',
    backgroundStyle: 'grid',
    glow: 90,
    category: 'retro',
    description: { de: 'Pink und Cyan wie in den 80ern.', en: 'Pink and cyan straight from the 80s.' },
  }),
  seed({
    id: 'matrix-code',
    name: 'Matrix Code',
    primary: '#00ff66',
    background: '#000000',
    accent: '#00aa44',
    font: 'mono',
    layout: 'minimal',
    backgroundStyle: 'carbon',
    glow: 65,
    category: 'retro',
    description: { de: 'Grüner Code auf tiefem Schwarz.', en: 'Green code on deep black.' },
  }),
  seed({
    id: 'stealth-carbon',
    name: 'Stealth Carbon',
    primary: '#c8d0dc',
    background: '#0a0b0d',
    accent: '#ff3b3b',
    font: 'rajdhani',
    layout: 'classic',
    backgroundStyle: 'carbon',
    glow: 20,
    category: 'minimal',
    description: { de: 'Dezentes Grau auf Carbon mit roten Akzenten.', en: 'Subtle grey on carbon with red accents.' },
  }),
  seed({
    id: 'gold-rush',
    name: 'Gold Rush',
    primary: '#ffc94d',
    background: '#0b0803',
    accent: '#ff9f1c',
    font: 'orbitron',
    layout: 'classic',
    backgroundStyle: 'gradient',
    glow: 55,
    category: 'sport',
    description: { de: 'Edles Gold für Premium-Optik.', en: 'Rich gold for a premium look.' },
  }),
  seed({
    id: 'deep-ocean',
    name: 'Deep Ocean',
    primary: '#4dd2ff',
    background: '#020a14',
    accent: '#00ffc8',
    font: 'clean',
    layout: 'arc',
    backgroundStyle: 'gradient',
    glow: 50,
    category: 'neon',
    description: { de: 'Tiefseeblau mit türkisem Rundinstrument.', en: 'Deep-sea blue with a turquoise arc gauge.' },
  }),
  seed({
    id: 'lava-core',
    name: 'Lava Core',
    primary: '#ff5a1f',
    background: '#120400',
    accent: '#ff2d55',
    font: 'segment',
    layout: 'sport',
    backgroundStyle: 'carbon',
    glow: 80,
    category: 'sport',
    description: { de: 'Glühende Segmentziffern auf Carbon.', en: 'Glowing segment digits on carbon.' },
  }),
  seed({
    id: 'ice-racer',
    name: 'Ice Racer',
    primary: '#9ef0ff',
    background: '#030b12',
    accent: '#ffffff',
    font: 'segment',
    layout: 'minimal',
    backgroundStyle: 'grid',
    glow: 60,
    category: 'sport',
    description: { de: 'Eisblaue Segmente, ultraklar.', en: 'Ice blue segments, ultra clear.' },
  }),
  seed({
    id: 'amber-lcd',
    name: 'Amber LCD',
    primary: '#ffb000',
    background: '#120a00',
    accent: '#ff7a00',
    font: 'segment',
    layout: 'classic',
    backgroundStyle: 'solid',
    glow: 45,
    category: 'retro',
    description: { de: 'Klassische Bernstein-Segmentanzeige.', en: 'Classic amber segment display.' },
  }),
];

export const ALL_BUILTIN_THEMES: DisplayTheme[] = [ORIGINAL_THEMES['max-g3'], ORIGINAL_THEMES['f3-pro'], ...STORE_THEMES];

export const THEME_CATEGORIES: ThemeCategory[] = ['neon', 'sport', 'classic', 'minimal', 'retro'];

export const findBuiltinTheme = (id: string) => ALL_BUILTIN_THEMES.find((t) => t.id === id) ?? null;
