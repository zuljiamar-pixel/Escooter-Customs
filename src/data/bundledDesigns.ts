import apex from '../../designs/max-g3-apex.json?raw';
import { DEFAULT_SETTINGS } from '../store/defaults';
import { parseImport, type ParsedImport } from '../store/transfer';
import type { DisplayTheme, LayoutElement, Localized, ModelId } from '../store/types';

/** Ein mitgeliefertes Design aus `designs/`: Theme mit eigenem Layout, optional mit Boot-Logo. */
export interface BundledDesign {
  model: ModelId;
  theme: DisplayTheme;
  layout: LayoutElement[];
  description: Localized;
  data: ParsedImport;
}

function bundled(raw: string, model: ModelId, description: Localized): BundledDesign {
  const data = parseImport(raw, DEFAULT_SETTINGS);
  const layout = data.layouts[model];
  if (!data.themes.length || !layout) throw new Error(`Bundled design for ${model} needs a theme and a layout`);
  return { model, theme: data.themes[0], layout, description, data };
}

export const BUNDLED_DESIGNS: BundledDesign[] = [
  bundled(apex, 'max-g3', {
    de: 'Ruhiges Cockpit: weiße Ziffern, Bernstein-Akzent, Rundinstrument und passendes Boot-Logo.',
    en: 'Calm cockpit: white digits, amber accent, arc gauge and a matching boot logo.',
  }),
];

export const bundledDesignsFor = (model: ModelId) => BUNDLED_DESIGNS.filter((d) => d.model === model);
