import type { ElementId, LayoutElement, LayoutId } from '../store/types';

export const ELEMENT_IDS: ElementId[] = ['speed', 'unit', 'gauge', 'battery', 'mode', 'trip', 'light', 'bluetooth', 'clock'];

type Preset = Record<ElementId, [x: number, y: number, scale: number, visible: boolean]>;

const PRESETS: Record<Exclude<LayoutId, 'custom'>, Preset> = {
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

const toElements = (preset: Preset): LayoutElement[] =>
  ELEMENT_IDS.map((id) => {
    const [x, y, scale, visible] = preset[id];
    return { id, x, y, scale, visible };
  });

export const LAYOUT_IDS: LayoutId[] = ['classic', 'sport', 'minimal', 'arc', 'custom'];

export function presetLayout(id: Exclude<LayoutId, 'custom'>): LayoutElement[] {
  return toElements(PRESETS[id]);
}

export const DEFAULT_CUSTOM_LAYOUT = presetLayout('classic');

export function resolveLayout(id: LayoutId, custom: LayoutElement[] | undefined): LayoutElement[] {
  if (id === 'custom') return custom && custom.length ? custom : DEFAULT_CUSTOM_LAYOUT;
  return presetLayout(id);
}
