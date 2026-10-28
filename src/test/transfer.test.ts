import { describe, expect, it } from 'vitest';
import { STORE_THEMES } from '../data/themes';
import { DEFAULT_SETTINGS } from '../store/defaults';
import { buildTransferFile, FILE_APP_ID, ImportError, mergeById, parseImport } from '../store/transfer';
import { presetLayout } from '../data/layouts';

describe('transfer files', () => {
  it('round-trips a theme export', () => {
    const file = buildTransferFile('themes', { themes: [STORE_THEMES[0]] });
    const parsed = parseImport(JSON.stringify(file), DEFAULT_SETTINGS);
    expect(parsed.kind).toBe('themes');
    expect(parsed.themes).toHaveLength(1);
    expect(parsed.themes[0].builtin).toBe(false);
    expect(parsed.themes[0].primary).toBe(STORE_THEMES[0].primary);
    expect(parsed.settings).toBeNull();
  });

  it('round-trips a backup with layouts and settings', () => {
    const file = buildTransferFile('backup', {
      themes: [],
      bootDesigns: [],
      layouts: { 'f3-pro': presetLayout('arc') },
      settings: { ...DEFAULT_SETTINGS, language: 'en' },
    });
    const parsed = parseImport(JSON.stringify(file), DEFAULT_SETTINGS);
    expect(parsed.layouts['f3-pro']).toEqual(presetLayout('arc'));
    expect(parsed.settings?.language).toBe('en');
  });

  it('rejects foreign or broken files', () => {
    expect(() => parseImport('{not json', DEFAULT_SETTINGS)).toThrow(ImportError);
    expect(() => parseImport(JSON.stringify({ app: 'other' }), DEFAULT_SETTINGS)).toThrow(ImportError);
    expect(() => parseImport(JSON.stringify({ app: FILE_APP_ID, kind: 'themes', themes: [] }), DEFAULT_SETTINGS)).toThrow(ImportError);
  });

  it('never overwrites existing ids when merging', () => {
    let n = 0;
    const merged = mergeById([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }, { id: 'c' }], () => `new-${++n}`);
    expect(merged.map((m) => m.id)).toEqual(['new-1', 'c', 'a', 'b']);
  });
});
