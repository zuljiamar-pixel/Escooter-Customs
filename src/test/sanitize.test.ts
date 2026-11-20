import { describe, expect, it } from 'vitest';
import { ELEMENT_IDS, migrateLayout, presetLayout, resolveLayout } from '../data/layouts';
import { BOOT_TEMPLATES, bootFromTemplate } from '../data/bootTemplates';
import { ALL_BUILTIN_THEMES } from '../data/themes';
import { DEFAULT_PREVIEW, DEFAULT_SETTINGS } from '../store/defaults';
import { sanitizeBoot, sanitizeLayout, sanitizePreview, sanitizeSettings, sanitizeTheme } from '../store/sanitize';

describe('sanitizeTheme', () => {
  it('rejects non-objects and missing ids', () => {
    expect(sanitizeTheme(null)).toBeNull();
    expect(sanitizeTheme('x')).toBeNull();
    expect(sanitizeTheme({ name: 'x' })).toBeNull();
  });

  it('repairs invalid values', () => {
    const t = sanitizeTheme({ id: 'a', name: '   ', primary: 'nope', glow: 900, font: 'comic', layout: 'weird', accent: 'abc' });
    expect(t).not.toBeNull();
    expect(t!.name).toBe('Theme');
    expect(t!.primary).toBe('#00d4ff');
    expect(t!.accent).toBe('#aabbcc');
    expect(t!.glow).toBe(100);
    expect(t!.font).toBe('segment');
    expect(t!.layout).toBe('classic');
  });

  it('keeps all builtin themes intact', () => {
    for (const theme of ALL_BUILTIN_THEMES) {
      const s = sanitizeTheme(theme)!;
      expect(s.primary).toBe(theme.primary);
      expect(s.font).toBe(theme.font);
      expect(s.layout).toBe(theme.layout);
    }
  });
});

describe('sanitizeLayout', () => {
  it('fills missing elements as hidden and clamps values', () => {
    const l = sanitizeLayout([{ id: 'speed', x: 500, y: -3, scale: 9, visible: true }, { id: 'bogus' }])!;
    expect(l).toHaveLength(ELEMENT_IDS.length);
    const speed = l.find((e) => e.id === 'speed')!;
    expect(speed).toMatchObject({ x: 100, y: 0, scale: 2, visible: true });
    expect(l.find((e) => e.id === 'clock')!.visible).toBe(false);
  });

  it('returns null for unusable input', () => {
    expect(sanitizeLayout({})).toBeNull();
    expect(sanitizeLayout([{ id: 'nope' }])).toBeNull();
  });

  it('resolves presets and custom layouts', () => {
    expect(resolveLayout('sport', undefined)).toEqual(presetLayout('sport'));
    const custom = presetLayout('arc');
    expect(resolveLayout('custom', custom)).toBe(custom);
    expect(resolveLayout('custom', [])).toHaveLength(ELEMENT_IDS.length);
  });

  it('keeps every preset element inside the display', () => {
    for (const orientation of ['landscape', 'portrait'] as const) {
      for (const id of ['classic', 'sport', 'minimal', 'arc'] as const) {
        const layout = presetLayout(id, orientation);
        expect(layout.map((e) => e.id)).toEqual(ELEMENT_IDS);
        for (const el of layout) {
          expect(el.x).toBeGreaterThanOrEqual(0);
          expect(el.x).toBeLessThanOrEqual(100);
          expect(el.y).toBeGreaterThanOrEqual(0);
          expect(el.y).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('uses the portrait presets for portrait displays', () => {
    expect(resolveLayout('sport', undefined, 'portrait')).toEqual(presetLayout('sport', 'portrait'));
    expect(resolveLayout('custom', undefined, 'portrait')).toEqual(presetLayout('classic', 'portrait'));
    expect(presetLayout('classic', 'portrait')).not.toEqual(presetLayout('classic', 'landscape'));
  });
});

describe('migrateLayout', () => {
  it('turns an untouched landscape preset into the portrait preset on the MAX G3', () => {
    expect(migrateLayout('max-g3', presetLayout('arc', 'landscape'))).toEqual(presetLayout('arc', 'portrait'));
  });

  it('leaves edited layouts and landscape models alone', () => {
    const moved = presetLayout('classic', 'landscape').map((e) => (e.id === 'speed' ? { ...e, x: 40 } : e));
    expect(migrateLayout('max-g3', moved)).toBe(moved);
    const f3 = presetLayout('classic', 'landscape');
    expect(migrateLayout('f3-pro', f3)).toBe(f3);
  });
});

describe('sanitizeBoot', () => {
  it('drops logos that are not image data URLs', () => {
    const base = bootFromTemplate(BOOT_TEMPLATES[0], 'b1', 1);
    expect(sanitizeBoot({ ...base, logo: 'javascript:alert(1)' })!.logo).toBeNull();
    expect(sanitizeBoot({ ...base, logo: 'data:text/html;base64,PHNjcmlwdD4=' })!.logo).toBeNull();
    expect(sanitizeBoot({ ...base, logo: 'data:image/png;base64,iVBORw0KGgo=' })!.logo).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('clamps duration and restricts text length', () => {
    const b = sanitizeBoot({ id: 'x', duration: 99, title: 'A'.repeat(100), model: 'unknown' })!;
    expect(b.duration).toBe(8);
    expect(b.title).toHaveLength(24);
    expect(b.model).toBe('max-g3');
  });

  it('accepts every template', () => {
    for (const tpl of BOOT_TEMPLATES) {
      const d = bootFromTemplate(tpl, tpl.templateId, 0);
      expect(sanitizeBoot(d)).toEqual(d);
    }
  });
});

describe('settings & preview', () => {
  it('falls back to defaults', () => {
    expect(sanitizeSettings(null, DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ language: 'fr', volume: 7 }, DEFAULT_SETTINGS)).toMatchObject({ language: 'de', volume: 1 });
    expect(sanitizePreview({ battery: 140, mode: 'turbo' }, DEFAULT_PREVIEW)).toMatchObject({ battery: 100, mode: 'drive' });
    expect(sanitizePreview({ speed: 120 }, DEFAULT_PREVIEW).speed).toBe(120);
    expect(sanitizePreview({ speed: 5000 }, DEFAULT_PREVIEW).speed).toBe(999);
  });
});
