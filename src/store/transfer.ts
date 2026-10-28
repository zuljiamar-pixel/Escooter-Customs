import { isModelId } from '../data/scooters';
import { sanitizeBoot, sanitizeLayout, sanitizeList, sanitizeSettings, sanitizeTheme } from './sanitize';
import type { BootDesign, DisplayTheme, LayoutElement, ModelId, Settings } from './types';

export const FILE_APP_ID = 'escooter-customizer-pro';
export const FILE_VERSION = 1;

export type TransferKind = 'themes' | 'boot-designs' | 'backup';

export interface TransferFile {
  app: typeof FILE_APP_ID;
  version: number;
  kind: TransferKind;
  exportedAt: string;
  themes?: DisplayTheme[];
  bootDesigns?: BootDesign[];
  layouts?: Partial<Record<ModelId, LayoutElement[]>>;
  settings?: Settings;
}

export function buildTransferFile(kind: TransferKind, payload: Omit<TransferFile, 'app' | 'version' | 'kind' | 'exportedAt'>): TransferFile {
  return { app: FILE_APP_ID, version: FILE_VERSION, kind, exportedAt: new Date().toISOString(), ...payload };
}

export interface ParsedImport {
  kind: TransferKind;
  themes: DisplayTheme[];
  bootDesigns: BootDesign[];
  layouts: Partial<Record<ModelId, LayoutElement[]>>;
  settings: Settings | null;
}

export class ImportError extends Error {
  readonly code: 'json' | 'format' | 'empty';
  constructor(code: 'json' | 'format' | 'empty') {
    super(code);
    this.code = code;
  }
}

/** Liest eine Export-Datei der App. Unbekannte Felder werden verworfen, ungültige Werte ersetzt. */
export function parseImport(text: string, settingsFallback: Settings): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('json');
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== FILE_APP_ID) {
    throw new ImportError('format');
  }
  const file = raw as Record<string, unknown>;
  const kind: TransferKind = file.kind === 'themes' || file.kind === 'boot-designs' || file.kind === 'backup' ? file.kind : 'backup';
  const themes = (sanitizeList(file.themes, sanitizeTheme) ?? []).map((t) => ({ ...t, builtin: false }));
  const bootDesigns = sanitizeList(file.bootDesigns, sanitizeBoot) ?? [];
  const layouts: Partial<Record<ModelId, LayoutElement[]>> = {};
  if (typeof file.layouts === 'object' && file.layouts !== null) {
    for (const [model, value] of Object.entries(file.layouts as Record<string, unknown>)) {
      const layout = sanitizeLayout(value);
      if (isModelId(model) && layout) layouts[model] = layout;
    }
  }
  const settings = kind === 'backup' && file.settings ? sanitizeSettings(file.settings, settingsFallback) : null;
  if (!themes.length && !bootDesigns.length && !Object.keys(layouts).length && !settings) {
    throw new ImportError('empty');
  }
  return { kind, themes, bootDesigns, layouts, settings };
}

/** Fügt importierte Einträge hinzu; bei gleicher ID wird eine neue ID vergeben, nichts wird überschrieben. */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[], makeId: () => string): T[] {
  const ids = new Set(existing.map((e) => e.id));
  const added = incoming.map((item) => {
    const id = ids.has(item.id) ? makeId() : item.id;
    ids.add(id);
    return { ...item, id };
  });
  return [...added, ...existing];
}
