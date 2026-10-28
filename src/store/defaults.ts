import { bootFromTemplate, defaultTemplateFor } from '../data/bootTemplates';
import { DEFAULT_CUSTOM_LAYOUT } from '../data/layouts';
import { ORIGINAL_THEMES } from '../data/themes';
import type { ActiveDesign, BootDraft, LayoutElement, ModelId, PreviewValues, Settings } from './types';

export const DEFAULT_ACCENT = '#00d4ff';

export const DEFAULT_SETTINGS: Settings = {
  language: 'de',
  uiTheme: 'dark',
  units: 'metric',
  clock24h: true,
  uiAccent: DEFAULT_ACCENT,
  sounds: false,
  soundPack: 'neon',
  volume: 0.5,
  splash: 'neon-scan',
  reducedMotion: false,
  displayAnimations: true,
};

export const DEFAULT_PREVIEW: PreviewValues = {
  speed: 18,
  battery: 76,
  mode: 'drive',
  light: true,
  bluetooth: true,
  trip: 12.4,
};

export const originalDesign = (model: ModelId): ActiveDesign => ({
  theme: { ...ORIGINAL_THEMES[model] },
  sourceId: ORIGINAL_THEMES[model].id,
  editingId: null,
});

export const defaultDesigns = (): Record<ModelId, ActiveDesign> => ({
  'max-g3': originalDesign('max-g3'),
  'f3-pro': originalDesign('f3-pro'),
});

export const defaultLayouts = (): Record<ModelId, LayoutElement[]> => ({
  'max-g3': DEFAULT_CUSTOM_LAYOUT.map((e) => ({ ...e })),
  'f3-pro': DEFAULT_CUSTOM_LAYOUT.map((e) => ({ ...e })),
});

export const defaultBootDraft = (model: ModelId): BootDraft => ({
  design: bootFromTemplate(defaultTemplateFor(model), `draft-${model}`),
  editingId: null,
});

export const defaultBootDrafts = (): Record<ModelId, BootDraft> => ({
  'max-g3': defaultBootDraft('max-g3'),
  'f3-pro': defaultBootDraft('f3-pro'),
});
