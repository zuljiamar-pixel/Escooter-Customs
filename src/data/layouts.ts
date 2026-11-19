import type { ElementId, LayoutElement, LayoutId, ModelId, ScreenOrientation } from '../store/types';
import { screenOf } from './scooters';

export const ELEMENT_IDS: ElementId[] = ['speed', 'unit', 'gauge', 'battery', 'mode', 'trip', 'light', 'bluetooth', 'clock'];

type Preset = Record<ElementId, [x: number, y: number, scale: number, visible: boolean]>;
type PresetId = Exclude<LayoutId, 'custom'>;

/** Vorlagen für Querformat-Displays (4:3). Positionen in Prozent der Displaybreite bzw. -höhe. */
const LANDSCAPE: Record<PresetId, Preset> = {
  classic: {
    clock: [13, 10, 1, true],
    bluetooth: [80, 10, 1, true],
    light: [90, 10, 1, true],
    mode: [14, 46, 1, true],
    speed: [50, 44, 1, true],
    trip: [86, 46, 1, true],
    unit: [50, 70, 1, true],
    battery: [50, 88, 1, true],
    gauge: [50, 50, 1, false],
  },
  sport: {
    clock: [13, 10, 1, true],
    bluetooth: [80, 10, 1, true],
    light: [90, 10, 1, true],
    speed: [33, 47, 1.15, true],
    unit: [33, 74, 1, true],
    mode: [80, 33, 1.35, true],
    trip: [80, 56, 1, true],
    battery: [50, 90, 1, true],
    gauge: [50, 50, 1, false],
  },
  minimal: {
    clock: [13, 10, 1, false],
    bluetooth: [80, 10, 1, false],
    light: [90, 10, 0.9, true],
    mode: [12, 10, 0.85, true],
    speed: [50, 45, 1.2, true],
    unit: [50, 72, 1, true],
    trip: [50, 90, 1, false],
    battery: [50, 89, 0.8, true],
    gauge: [50, 50, 1, false],
  },
  arc: {
    clock: [13, 10, 1, true],
    bluetooth: [80, 10, 1, true],
    light: [90, 10, 1, true],
    gauge: [50, 52, 1, true],
    speed: [50, 48, 0.72, true],
    unit: [50, 64, 0.9, true],
    mode: [50, 84, 0.85, true],
    trip: [16, 90, 0.85, true],
    battery: [83, 90, 0.5, true],
  },
};

/** Vorlagen für Hochformat-Displays (3:4) wie beim MAX G3: Statuszeile oben, Werte untereinander. */
const PORTRAIT: Record<PresetId, Preset> = {
  classic: {
    clock: [17, 6, 1, true],
    bluetooth: [78, 6, 1, true],
    light: [89, 6, 1, true],
    speed: [50, 31, 1.1, true],
    unit: [50, 52, 1, true],
    mode: [50, 64, 1.05, true],
    trip: [50, 78, 1.1, true],
    battery: [50, 92, 1.2, true],
    gauge: [50, 40, 1, false],
  },
  sport: {
    clock: [17, 6, 1, true],
    bluetooth: [78, 6, 1, true],
    light: [89, 6, 1, true],
    speed: [50, 30, 1.3, true],
    unit: [50, 53, 1, true],
    mode: [27, 70, 1.3, true],
    trip: [72, 70, 1.1, true],
    battery: [50, 91, 1.2, true],
    gauge: [50, 40, 1, false],
  },
  minimal: {
    clock: [17, 6, 1, false],
    bluetooth: [78, 6, 1, false],
    light: [88, 6, 0.95, true],
    mode: [13, 6, 0.9, true],
    speed: [50, 37, 1.35, true],
    unit: [50, 62, 1.05, true],
    trip: [50, 80, 1, false],
    battery: [50, 88, 1.1, true],
    gauge: [50, 40, 1, false],
  },
  arc: {
    clock: [17, 6, 1, true],
    bluetooth: [78, 6, 1, true],
    light: [89, 6, 1, true],
    gauge: [50, 38, 1.05, true],
    speed: [50, 35.5, 0.72, true],
    unit: [50, 49.5, 0.9, true],
    mode: [50, 61, 0.9, true],
    trip: [50, 78, 1.05, true],
    battery: [50, 91, 1.1, true],
  },
};

const PRESETS: Record<ScreenOrientation, Record<PresetId, Preset>> = { landscape: LANDSCAPE, portrait: PORTRAIT };

const toElements = (preset: Preset): LayoutElement[] =>
  ELEMENT_IDS.map((id) => {
    const [x, y, scale, visible] = preset[id];
    return { id, x, y, scale, visible };
  });

export const LAYOUT_IDS: LayoutId[] = ['classic', 'sport', 'minimal', 'arc', 'custom'];
const PRESET_IDS: PresetId[] = ['classic', 'sport', 'minimal', 'arc'];

export function presetLayout(id: PresetId, orientation: ScreenOrientation = 'landscape'): LayoutElement[] {
  return toElements(PRESETS[orientation][id]);
}

/** Ausgangslayout für „Custom Dashboard“ */
export const defaultCustomLayout = (orientation: ScreenOrientation = 'landscape') => presetLayout('classic', orientation);

export function resolveLayout(id: LayoutId, custom: LayoutElement[] | undefined, orientation: ScreenOrientation = 'landscape'): LayoutElement[] {
  if (id === 'custom') return custom && custom.length ? custom : defaultCustomLayout(orientation);
  return presetLayout(id, orientation);
}

const sameLayout = (a: LayoutElement[], b: LayoutElement[]) =>
  a.length === b.length &&
  a.every((el) => {
    const o = b.find((x) => x.id === el.id);
    return !!o && o.x === el.x && o.y === el.y && o.scale === el.scale && o.visible === el.visible;
  });

/**
 * Frühere Versionen haben jedes Display im Querformat gezeigt. Liegt für ein Hochformat-Modell noch eine unveränderte
 * Querformat-Vorlage vor (gespeichert oder importiert), wird sie durch die passende Hochformat-Vorlage ersetzt.
 * Selbst verschobene Layouts bleiben unangetastet.
 */
export function migrateLayout(model: ModelId, layout: LayoutElement[]): LayoutElement[] {
  if (screenOf(model) !== 'portrait') return layout;
  const match = PRESET_IDS.find((id) => sameLayout(layout, presetLayout(id, 'landscape')));
  return match ? presetLayout(match, 'portrait') : layout;
}
