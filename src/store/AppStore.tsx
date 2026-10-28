import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { bootFromTemplate, BOOT_TEMPLATES } from '../data/bootTemplates';
import { isModelId } from '../data/scooters';
import { usePersistentState } from '../hooks/usePersistentState';
import { createId } from '../lib/id';
import { clearAllStored } from '../lib/storage';
import {
  DEFAULT_PREVIEW,
  DEFAULT_SETTINGS,
  defaultBootDraft,
  defaultBootDrafts,
  defaultDesigns,
  defaultLayouts,
  originalDesign,
} from './defaults';
import {
  sanitizeBoot,
  sanitizeColorList,
  sanitizeLayout,
  sanitizeList,
  sanitizePreview,
  sanitizeSettings,
  sanitizeTheme,
} from './sanitize';
import { buildTransferFile, mergeById, type ParsedImport, type TransferFile } from './transfer';
import type {
  ActiveDesign,
  BootDesign,
  BootDraft,
  DisplayTheme,
  LayoutElement,
  ModelId,
  PreviewValues,
  Settings,
} from './types';

const MAX_HISTORY = 16;
const MAX_PALETTE = 24;

function sanitizePerModel<T>(raw: unknown, item: (r: unknown) => T | null, fallback: () => Record<ModelId, T>): Record<ModelId, T> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const base = fallback();
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isModelId(key)) continue;
    const v = item(value);
    if (v) base[key] = v;
  }
  return base;
}

const sanitizeActiveDesign = (raw: unknown): ActiveDesign | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const theme = sanitizeTheme(r.theme);
  if (!theme) return null;
  return {
    theme,
    sourceId: typeof r.sourceId === 'string' ? r.sourceId : null,
    editingId: typeof r.editingId === 'string' ? r.editingId : null,
  };
};

const sanitizeBootDraft = (raw: unknown): BootDraft | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const design = sanitizeBoot(r.design);
  if (!design) return null;
  return { design, editingId: typeof r.editingId === 'string' ? r.editingId : null };
};

export interface AppStore {
  settings: Settings;
  model: ModelId | null;
  designs: Record<ModelId, ActiveDesign>;
  savedThemes: DisplayTheme[];
  favorites: string[];
  customLayouts: Record<ModelId, LayoutElement[]>;
  bootDrafts: Record<ModelId, BootDraft>;
  bootDesigns: BootDesign[];
  preview: PreviewValues;
  colorHistory: string[];
  palette: string[];

  updateSettings: (patch: Partial<Settings>) => void;
  selectModel: (model: ModelId) => void;

  updateDesign: (model: ModelId, patch: Partial<DisplayTheme>) => void;
  applyTheme: (model: ModelId, theme: DisplayTheme) => void;
  editTheme: (model: ModelId, theme: DisplayTheme) => void;
  resetDesign: (model: ModelId) => void;
  saveThemeAs: (model: ModelId, name: string) => DisplayTheme;
  saveEditedTheme: (model: ModelId) => DisplayTheme | null;
  addTheme: (theme: DisplayTheme, name?: string) => DisplayTheme;
  renameTheme: (id: string, name: string) => void;
  duplicateTheme: (id: string, suffix: string) => DisplayTheme | null;
  deleteTheme: (id: string) => void;
  toggleFavorite: (id: string) => void;

  setCustomLayout: (model: ModelId, elements: LayoutElement[]) => void;

  updateBootDraft: (model: ModelId, patch: Partial<BootDesign>) => void;
  loadBootTemplate: (model: ModelId, templateId: string) => void;
  resetBootDraft: (model: ModelId) => void;
  saveBootAs: (model: ModelId, name: string) => BootDesign;
  saveEditedBoot: (model: ModelId) => BootDesign | null;
  editBoot: (design: BootDesign) => void;
  duplicateBoot: (id: string, suffix: string) => BootDesign | null;
  renameBoot: (id: string, name: string) => void;
  deleteBoot: (id: string) => void;

  updatePreview: (patch: Partial<PreviewValues>) => void;
  pushColorHistory: (hex: string) => void;
  togglePaletteColor: (hex: string) => void;

  exportThemes: (ids?: string[]) => TransferFile;
  exportBootDesigns: (ids?: string[]) => TransferFile;
  exportBackup: () => TransferFile;
  applyImport: (data: ParsedImport) => { themes: number; bootDesigns: number; layouts: number; settings: boolean };
  resetAll: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = usePersistentState<Settings>('settings', () => DEFAULT_SETTINGS, (r) =>
    sanitizeSettings(r, DEFAULT_SETTINGS),
  );
  const [model, setModel] = usePersistentState<ModelId | null>('model', () => null, (r) => (isModelId(r) ? r : null));
  const [designs, setDesigns] = usePersistentState('designs', defaultDesigns, (r) =>
    sanitizePerModel(r, sanitizeActiveDesign, defaultDesigns),
  );
  const [savedThemes, setSavedThemes] = usePersistentState<DisplayTheme[]>('themes', () => [], (r) => sanitizeList(r, sanitizeTheme));
  const [favorites, setFavorites] = usePersistentState<string[]>('favorites', () => [], (r) =>
    Array.isArray(r) ? r.filter((v): v is string => typeof v === 'string').slice(0, 200) : null,
  );
  const [customLayouts, setCustomLayouts] = usePersistentState('layouts', defaultLayouts, (r) =>
    sanitizePerModel(r, sanitizeLayout, defaultLayouts),
  );
  const [bootDrafts, setBootDrafts] = usePersistentState('bootDrafts', defaultBootDrafts, (r) =>
    sanitizePerModel(r, sanitizeBootDraft, defaultBootDrafts),
  );
  const [bootDesigns, setBootDesigns] = usePersistentState<BootDesign[]>('bootDesigns', () => [], (r) =>
    sanitizeList(r, sanitizeBoot, 60),
  );
  const [preview, setPreview] = usePersistentState<PreviewValues>('preview', () => DEFAULT_PREVIEW, (r) =>
    sanitizePreview(r, DEFAULT_PREVIEW),
  );
  const [colorHistory, setColorHistory] = usePersistentState<string[]>('colorHistory', () => [], (r) =>
    sanitizeColorList(r, MAX_HISTORY),
  );
  const [palette, setPalette] = usePersistentState<string[]>('palette', () => [], (r) => sanitizeColorList(r, MAX_PALETTE));

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [setSettings]);

  const patchDesign = useCallback(
    (m: ModelId, fn: (d: ActiveDesign) => ActiveDesign) => setDesigns((all) => ({ ...all, [m]: fn(all[m]) })),
    [setDesigns],
  );

  const updateDesign = useCallback(
    (m: ModelId, patch: Partial<DisplayTheme>) =>
      patchDesign(m, (d) => ({ ...d, theme: { ...d.theme, ...patch, updatedAt: Date.now() } })),
    [patchDesign],
  );

  const applyTheme = useCallback(
    (m: ModelId, theme: DisplayTheme) => patchDesign(m, () => ({ theme: { ...theme }, sourceId: theme.id, editingId: null })),
    [patchDesign],
  );

  const editTheme = useCallback(
    (m: ModelId, theme: DisplayTheme) =>
      patchDesign(m, () => ({ theme: { ...theme }, sourceId: theme.id, editingId: theme.builtin ? null : theme.id })),
    [patchDesign],
  );

  const resetDesign = useCallback((m: ModelId) => setDesigns((all) => ({ ...all, [m]: originalDesign(m) })), [setDesigns]);

  const addTheme = useCallback(
    (theme: DisplayTheme, name?: string) => {
      const now = Date.now();
      const created: DisplayTheme = {
        ...theme,
        id: createId('theme'),
        name: (name ?? theme.name).trim().slice(0, 40) || theme.name,
        builtin: false,
        description: undefined,
        createdAt: now,
        updatedAt: now,
      };
      setSavedThemes((list) => [created, ...list]);
      return created;
    },
    [setSavedThemes],
  );

  const saveThemeAs = useCallback(
    (m: ModelId, name: string) => {
      const created = addTheme(designs[m].theme, name);
      patchDesign(m, () => ({ theme: { ...created }, sourceId: created.id, editingId: created.id }));
      return created;
    },
    [addTheme, designs, patchDesign],
  );

  const saveEditedTheme = useCallback(
    (m: ModelId) => {
      const { editingId, theme } = designs[m];
      if (!editingId || !savedThemes.some((t) => t.id === editingId)) return null;
      const updated: DisplayTheme = { ...theme, id: editingId, builtin: false, updatedAt: Date.now() };
      setSavedThemes((list) => list.map((t) => (t.id === editingId ? updated : t)));
      return updated;
    },
    [designs, savedThemes, setSavedThemes],
  );

  const renameTheme = useCallback(
    (id: string, name: string) => {
      const clean = name.trim().slice(0, 40);
      if (!clean) return;
      setSavedThemes((list) => list.map((t) => (t.id === id ? { ...t, name: clean, updatedAt: Date.now() } : t)));
      setDesigns((all) => {
        const next = { ...all };
        for (const key of Object.keys(next) as ModelId[]) {
          if (next[key].editingId === id) next[key] = { ...next[key], theme: { ...next[key].theme, name: clean } };
        }
        return next;
      });
    },
    [setSavedThemes, setDesigns],
  );

  const duplicateTheme = useCallback(
    (id: string, suffix: string) => {
      const source = savedThemes.find((t) => t.id === id);
      if (!source) return null;
      return addTheme(source, `${source.name} ${suffix}`.slice(0, 40));
    },
    [savedThemes, addTheme],
  );

  const deleteTheme = useCallback(
    (id: string) => {
      setSavedThemes((list) => list.filter((t) => t.id !== id));
      setFavorites((f) => f.filter((x) => x !== id));
      setDesigns((all) => {
        const next = { ...all };
        for (const key of Object.keys(next) as ModelId[]) {
          if (next[key].editingId === id) next[key] = { ...next[key], editingId: null };
        }
        return next;
      });
    },
    [setSavedThemes, setFavorites, setDesigns],
  );

  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f])),
    [setFavorites],
  );

  const setCustomLayout = useCallback(
    (m: ModelId, elements: LayoutElement[]) => setCustomLayouts((all) => ({ ...all, [m]: elements })),
    [setCustomLayouts],
  );

  const patchBoot = useCallback(
    (m: ModelId, fn: (d: BootDraft) => BootDraft) => setBootDrafts((all) => ({ ...all, [m]: fn(all[m]) })),
    [setBootDrafts],
  );

  const updateBootDraft = useCallback(
    (m: ModelId, patch: Partial<BootDesign>) =>
      patchBoot(m, (d) => ({ ...d, design: { ...d.design, ...patch, model: m, updatedAt: Date.now() } })),
    [patchBoot],
  );

  const loadBootTemplate = useCallback(
    (m: ModelId, templateId: string) => {
      const template = BOOT_TEMPLATES.find((t) => t.templateId === templateId);
      if (!template) return;
      // Eigenes Logo bleibt beim Wechsel der Vorlage erhalten.
      patchBoot(m, (d) => ({
        editingId: d.editingId,
        design: { ...bootFromTemplate(template, d.design.id), model: m, logo: d.design.logo, name: d.editingId ? d.design.name : template.name },
      }));
    },
    [patchBoot],
  );

  const resetBootDraft = useCallback((m: ModelId) => patchBoot(m, () => defaultBootDraft(m)), [patchBoot]);

  const saveBootAs = useCallback(
    (m: ModelId, name: string) => {
      const now = Date.now();
      const created: BootDesign = {
        ...bootDrafts[m].design,
        id: createId('boot'),
        model: m,
        name: name.trim().slice(0, 40) || bootDrafts[m].design.name,
        createdAt: now,
        updatedAt: now,
      };
      setBootDesigns((list) => [created, ...list]);
      patchBoot(m, () => ({ design: { ...created }, editingId: created.id }));
      return created;
    },
    [bootDrafts, setBootDesigns, patchBoot],
  );

  const saveEditedBoot = useCallback(
    (m: ModelId) => {
      const { editingId, design } = bootDrafts[m];
      if (!editingId || !bootDesigns.some((b) => b.id === editingId)) return null;
      const updated: BootDesign = { ...design, id: editingId, model: m, updatedAt: Date.now() };
      setBootDesigns((list) => list.map((b) => (b.id === editingId ? updated : b)));
      return updated;
    },
    [bootDrafts, bootDesigns, setBootDesigns],
  );

  const editBoot = useCallback(
    (design: BootDesign) => patchBoot(design.model, () => ({ design: { ...design }, editingId: design.id })),
    [patchBoot],
  );

  const duplicateBoot = useCallback(
    (id: string, suffix: string) => {
      const source = bootDesigns.find((b) => b.id === id);
      if (!source) return null;
      const now = Date.now();
      const copy: BootDesign = { ...source, id: createId('boot'), name: `${source.name} ${suffix}`.slice(0, 40), createdAt: now, updatedAt: now };
      setBootDesigns((list) => [copy, ...list]);
      return copy;
    },
    [bootDesigns, setBootDesigns],
  );

  const renameBoot = useCallback(
    (id: string, name: string) => {
      const clean = name.trim().slice(0, 40);
      if (!clean) return;
      setBootDesigns((list) => list.map((b) => (b.id === id ? { ...b, name: clean, updatedAt: Date.now() } : b)));
      setBootDrafts((all) => {
        const next = { ...all };
        for (const key of Object.keys(next) as ModelId[]) {
          if (next[key].editingId === id) next[key] = { ...next[key], design: { ...next[key].design, name: clean } };
        }
        return next;
      });
    },
    [setBootDesigns, setBootDrafts],
  );

  const deleteBoot = useCallback(
    (id: string) => {
      setBootDesigns((list) => list.filter((b) => b.id !== id));
      setBootDrafts((all) => {
        const next = { ...all };
        for (const key of Object.keys(next) as ModelId[]) {
          if (next[key].editingId === id) next[key] = { ...next[key], editingId: null };
        }
        return next;
      });
    },
    [setBootDesigns, setBootDrafts],
  );

  const updatePreview = useCallback((patch: Partial<PreviewValues>) => setPreview((p) => ({ ...p, ...patch })), [setPreview]);

  const pushColorHistory = useCallback(
    (hex: string) => setColorHistory((h) => [hex, ...h.filter((c) => c !== hex)].slice(0, MAX_HISTORY)),
    [setColorHistory],
  );

  const togglePaletteColor = useCallback(
    (hex: string) => setPalette((p) => (p.includes(hex) ? p.filter((c) => c !== hex) : [hex, ...p].slice(0, MAX_PALETTE))),
    [setPalette],
  );

  const exportThemes = useCallback(
    (ids?: string[]) => buildTransferFile('themes', { themes: ids ? savedThemes.filter((t) => ids.includes(t.id)) : savedThemes }),
    [savedThemes],
  );

  const exportBootDesigns = useCallback(
    (ids?: string[]) =>
      buildTransferFile('boot-designs', { bootDesigns: ids ? bootDesigns.filter((b) => ids.includes(b.id)) : bootDesigns }),
    [bootDesigns],
  );

  const exportBackup = useCallback(
    () => buildTransferFile('backup', { themes: savedThemes, bootDesigns, layouts: customLayouts, settings }),
    [savedThemes, bootDesigns, customLayouts, settings],
  );

  const applyImport = useCallback(
    (data: ParsedImport) => {
      if (data.themes.length) setSavedThemes((list) => mergeById(list, data.themes, () => createId('theme')));
      if (data.bootDesigns.length) setBootDesigns((list) => mergeById(list, data.bootDesigns, () => createId('boot')).slice(0, 60));
      const layoutKeys = Object.keys(data.layouts) as ModelId[];
      if (layoutKeys.length) setCustomLayouts((all) => ({ ...all, ...data.layouts }));
      if (data.settings) setSettings(data.settings);
      return { themes: data.themes.length, bootDesigns: data.bootDesigns.length, layouts: layoutKeys.length, settings: !!data.settings };
    },
    [setSavedThemes, setBootDesigns, setCustomLayouts, setSettings],
  );

  const resetAll = useCallback(() => {
    clearAllStored();
    setSettings(DEFAULT_SETTINGS);
    setModel(null);
    setDesigns(defaultDesigns());
    setSavedThemes([]);
    setFavorites([]);
    setCustomLayouts(defaultLayouts());
    setBootDrafts(defaultBootDrafts());
    setBootDesigns([]);
    setPreview(DEFAULT_PREVIEW);
    setColorHistory([]);
    setPalette([]);
  }, [
    setSettings,
    setModel,
    setDesigns,
    setSavedThemes,
    setFavorites,
    setCustomLayouts,
    setBootDrafts,
    setBootDesigns,
    setPreview,
    setColorHistory,
    setPalette,
  ]);

  const value = useMemo<AppStore>(
    () => ({
      settings,
      model,
      designs,
      savedThemes,
      favorites,
      customLayouts,
      bootDrafts,
      bootDesigns,
      preview,
      colorHistory,
      palette,
      updateSettings,
      selectModel: setModel,
      updateDesign,
      applyTheme,
      editTheme,
      resetDesign,
      saveThemeAs,
      saveEditedTheme,
      addTheme,
      renameTheme,
      duplicateTheme,
      deleteTheme,
      toggleFavorite,
      setCustomLayout,
      updateBootDraft,
      loadBootTemplate,
      resetBootDraft,
      saveBootAs,
      saveEditedBoot,
      editBoot,
      duplicateBoot,
      renameBoot,
      deleteBoot,
      updatePreview,
      pushColorHistory,
      togglePaletteColor,
      exportThemes,
      exportBootDesigns,
      exportBackup,
      applyImport,
      resetAll,
    }),
    [
      settings,
      model,
      designs,
      savedThemes,
      favorites,
      customLayouts,
      bootDrafts,
      bootDesigns,
      preview,
      colorHistory,
      palette,
      updateSettings,
      setModel,
      updateDesign,
      applyTheme,
      editTheme,
      resetDesign,
      saveThemeAs,
      saveEditedTheme,
      addTheme,
      renameTheme,
      duplicateTheme,
      deleteTheme,
      toggleFavorite,
      setCustomLayout,
      updateBootDraft,
      loadBootTemplate,
      resetBootDraft,
      saveBootAs,
      saveEditedBoot,
      editBoot,
      duplicateBoot,
      renameBoot,
      deleteBoot,
      updatePreview,
      pushColorHistory,
      togglePaletteColor,
      exportThemes,
      exportBootDesigns,
      exportBackup,
      applyImport,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

/** Aktuelles Modell; Seiten innerhalb der Shell werden nur mit gewähltem Modell gerendert. */
export function useModel(): ModelId {
  const { model } = useStore();
  return model ?? 'max-g3';
}
