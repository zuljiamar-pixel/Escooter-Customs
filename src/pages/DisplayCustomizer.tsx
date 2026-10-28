import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Contrast,
  Download,
  Gauge,
  Images,
  Layers,
  Paintbrush,
  Redo2,
  RotateCcw,
  Save,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ColorField } from '../components/color/ColorPicker';
import { DisplayScreen } from '../components/scooter/DisplayScreen';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { PreviewControls } from '../components/scooter/PreviewControls';
import { SevenSegment } from '../components/scooter/SevenSegment';
import { FONT_FAMILIES } from '../components/scooter/DisplayScreen';
import { Badge, Card, SectionLabel } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge, PreviewNotice } from '../components/ui/Compat';
import { Segmented, Slider } from '../components/ui/Form';
import { ConfirmDialog, PromptDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { resolveLayout, LAYOUT_IDS } from '../data/layouts';
import { SCOOTERS } from '../data/scooters';
import { ORIGINAL_THEMES, STORE_THEMES, findBuiltinTheme } from '../data/themes';
import { useNav } from '../hooks/useNav';
import { useSound } from '../hooks/useSound';
import { useUndo } from '../hooks/useUndo';
import { useI18n } from '../i18n';
import { contrastRatio, hsvToHex, NEON_PRESETS } from '../lib/color';
import { cn } from '../lib/cn';
import { downloadJson, safeFilename } from '../lib/download';
import { useModel, useStore } from '../store/AppStore';
import { FONT_IDS } from '../store/sanitize';
import { buildTransferFile } from '../store/transfer';
import type { BackgroundStyle, DisplayTheme, FontId, LayoutId } from '../store/types';

const BG_PRESETS = [
  { id: 'black', hex: '#000000' },
  { id: 'midnight', hex: '#02060f' },
  { id: 'violet', hex: '#07020f' },
  { id: 'wine', hex: '#0a0204' },
  { id: 'forest', hex: '#020a05' },
  { id: 'espresso', hex: '#0b0803' },
] as const;

const ACCENT_PRESETS = [
  { id: 'cobalt', hex: '#2f6bff' },
  { id: 'pink', hex: '#ff4dd8' },
  { id: 'lime', hex: '#c6ff00' },
  { id: 'gold', hex: '#ffd23f' },
  { id: 'white', hex: '#ffffff' },
  { id: 'cyan', hex: '#00e5ff' },
] as const;

const DESIGN_KEYS: (keyof DisplayTheme)[] = ['primary', 'background', 'accent', 'font', 'layout', 'backgroundStyle', 'glow'];

export function DisplayCustomizer() {
  const model = useModel();
  const store = useStore();
  const { designs, savedThemes, customLayouts, preview, settings, updateDesign, applyTheme, resetDesign, saveThemeAs, saveEditedTheme, pushColorHistory, colorHistory } = store;
  const { t } = useI18n();
  const { navigate } = useNav();
  const toast = useToast();
  const play = useSound();
  const design = designs[model];
  const theme = design.theme;

  const [saveOpen, setSaveOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const replaceTheme = useCallback((value: DisplayTheme) => updateDesign(model, value), [model, updateDesign]);
  const history = useUndo(theme, replaceTheme);

  const change = (patch: Partial<DisplayTheme>) => {
    history.record();
    updateDesign(model, patch);
  };

  const source = useMemo(
    () => (design.sourceId ? (findBuiltinTheme(design.sourceId) ?? savedThemes.find((s) => s.id === design.sourceId) ?? null) : null),
    [design.sourceId, savedThemes],
  );
  const modified = !source || DESIGN_KEYS.some((k) => source[k] !== theme[k]);
  const editingTheme = design.editingId ? savedThemes.find((s) => s.id === design.editingId) : undefined;
  const ratio = contrastRatio(theme.primary, theme.background);
  const contrastLevel = ratio >= 7 ? 'great' : ratio >= 4.5 ? 'good' : ratio >= 3 ? 'ok' : 'low';

  const quickThemes = [ORIGINAL_THEMES[model], ...savedThemes.slice(0, 6), ...STORE_THEMES.slice(0, 8)];

  const apply = (th: DisplayTheme) => {
    history.record();
    applyTheme(model, th);
    play('toggle');
  };

  const randomize = () => {
    history.record();
    const h = Math.random() * 360;
    updateDesign(model, {
      primary: hsvToHex({ h, s: 0.8, v: 1 }),
      accent: hsvToHex({ h: (h + 40 + Math.random() * 100) % 360, s: 0.85, v: 1 }),
      background: hsvToHex({ h, s: 0.7, v: 0.05 }),
      font: FONT_IDS[Math.floor(Math.random() * FONT_IDS.length)],
      backgroundStyle: (['solid', 'gradient', 'grid', 'carbon'] as BackgroundStyle[])[Math.floor(Math.random() * 4)],
      glow: 40 + Math.round(Math.random() * 50),
    });
    play('whoosh');
  };

  const handleSave = () => {
    if (editingTheme) {
      const saved = saveEditedTheme(model);
      if (saved) {
        play('success');
        toast(t('toast.themeUpdated', { name: saved.name }));
      }
    } else {
      setSaveOpen(true);
    }
  };

  const exportCurrent = () => {
    const file = buildTransferFile('themes', { themes: [{ ...theme, id: editingTheme?.id ?? `export-${Date.now().toString(36)}`, builtin: false, description: undefined }] });
    downloadJson(file, `${safeFilename(theme.name, 'theme')}.ecp-theme.json`);
    toast(t('toast.exported'));
  };

  const preview4 = (
    <>
      <div className="hidden lg:block">
        <LiveDisplay model={model} className="max-w-[520px] py-2" />
      </div>
      <div className="mx-auto w-[78%] max-w-[340px] lg:hidden">
        <LiveDisplay model={model} housing={false} className="shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] ring-1 ring-fg/15" />
      </div>
    </>
  );

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={Gauge}
        eyebrow={SCOOTERS[model].short}
        title={t('nav.display')}
        subtitle={t('display.subtitle')}
        badge={<CompatBadge level="app" />}
        actions={
          <>
            <IconButton icon={Undo2} label={t('common.undo')} variant="secondary" disabled={!history.canUndo} onClick={history.undo} />
            <IconButton icon={Redo2} label={t('common.redo')} variant="secondary" disabled={!history.canRedo} onClick={history.redo} />
            <Button icon={Shuffle} onClick={randomize}>
              {t('display.random')}
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              {editingTheme ? t('display.saveChanges') : t('display.saveAs')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* Vorschau */}
        <div className="sticky top-[68px] z-20 -mx-4 space-y-4 px-4 lg:top-6 lg:mx-0 lg:px-0">
          <div className="glass-strong rounded-b-3xl py-3 lg:glass lg:rounded-[var(--radius-card)] lg:p-5">
            <div className="mb-3 hidden items-center justify-between lg:flex">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{theme.name}</p>
                <p className="text-xs text-muted">
                  {editingTheme ? t('display.status.editing') : modified ? t('display.status.modified', { name: source?.name ?? theme.name }) : t('display.status.applied')}
                </p>
              </div>
              <Badge tone="warn">{t('compat.previewOnly')}</Badge>
            </div>
            {preview4}
            <div className="mt-3 flex items-center justify-center gap-2 px-4 lg:hidden">
              <Badge tone="warn">{t('compat.previewOnly')}</Badge>
              <span className="truncate text-xs text-muted">{theme.name}</span>
            </div>
          </div>
          <Card title={t('display.previewValues')} icon={SlidersHorizontal} className="hidden lg:block">
            <PreviewControls />
          </Card>
          <PreviewNotice className="hidden lg:flex" />
        </div>

        {/* Steuerung */}
        <div className="space-y-5">
          <Card
            title={t('display.themes.title')}
            icon={Sparkles}
            actions={
              <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('store')}>
                {t('nav.store.short')}
              </Button>
            }
          >
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {quickThemes.map((th) => {
                const active = design.sourceId === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => apply(th)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                      active ? 'border-accent/70 bg-accent/10 text-accent' : 'border-line bg-base-2/60 text-muted hover:text-fg',
                    )}
                  >
                    <span className="flex -space-x-1">
                      {[th.primary, th.accent].map((c, i) => (
                        <span key={i} className="size-3.5 rounded-full ring-2 ring-panel" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="max-w-28 truncate">{th.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title={t('display.colors.title')} icon={Paintbrush}>
            <div className="space-y-5">
              <ColorField label={t('display.color.primary')} value={theme.primary} onChange={(primary) => change({ primary })} onCommit={pushColorHistory} extra={colorHistory.slice(0, 3)} />
              <ColorField
                label={t('display.color.background')}
                value={theme.background}
                onChange={(background) => change({ background })}
                onCommit={pushColorHistory}
                presets={BG_PRESETS.map((p) => ({ ...p, name: t(`color.bg.${p.id}`) }))}
              />
              <ColorField
                label={t('display.color.accent')}
                value={theme.accent}
                onChange={(accent) => change({ accent })}
                onCommit={pushColorHistory}
                presets={[...NEON_PRESETS, ...ACCENT_PRESETS.map((p) => ({ ...p, name: t(`color.accent.${p.id}`) }))]}
              />
              <Slider label={t('display.glow')} value={theme.glow} min={0} max={100} onChange={(glow) => change({ glow })} format={(v) => `${v}%`} />
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs',
                  contrastLevel === 'low' ? 'border-danger/40 bg-danger/8 text-danger' : 'border-line bg-base-2/50 text-muted',
                )}
              >
                <Contrast className="size-4 shrink-0" aria-hidden />
                <span>
                  {t('display.contrast', { ratio: ratio.toFixed(1) })} · <strong className="font-semibold">{t(`display.contrast.${contrastLevel}`)}</strong>
                </span>
              </div>
            </div>
          </Card>

          <Card title={t('display.typo.title')} icon={Type}>
            <SectionLabel>{t('display.font')}</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {FONT_IDS.map((f: FontId) => {
                const active = theme.font === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => change({ font: f })}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all',
                      active ? 'border-accent/70 bg-accent/10 shadow-[0_0_20px_-8px_var(--ui-accent)]' : 'border-line bg-base-2/50 hover:border-accent/40',
                    )}
                  >
                    <span className="grid h-9 place-items-center" style={{ color: active ? theme.primary : 'var(--ui-fg)' }}>
                      {f === 'segment' ? (
                        <SevenSegment value="18" color={active ? theme.primary : 'currentColor'} height="32px" ghost={0.12} />
                      ) : (
                        <span style={{ fontFamily: FONT_FAMILIES[f], fontSize: 28, fontWeight: f === 'orbitron' ? 900 : 700, lineHeight: 1 }}>18</span>
                      )}
                    </span>
                    <span className={cn('text-[11px] font-medium', active ? 'text-accent' : 'text-muted')}>{t(`font.${f}`)}</span>
                  </button>
                );
              })}
            </div>

            <SectionLabel className="mt-5">{t('display.layout')}</SectionLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LAYOUT_IDS.map((id: LayoutId) => {
                const active = theme.layout === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => change({ layout: id })}
                    aria-pressed={active}
                    className={cn(
                      'overflow-hidden rounded-2xl border text-left transition-all',
                      active ? 'border-accent/70 shadow-[0_0_20px_-8px_var(--ui-accent)]' : 'border-line hover:border-accent/40',
                    )}
                  >
                    <DisplayScreen
                      theme={{ ...theme, layout: id }}
                      layout={resolveLayout(id, customLayouts[model])}
                      values={preview}
                      units={settings.units}
                      clock24h={settings.clock24h}
                      animated={false}
                    />
                    <span className={cn('block px-2.5 py-1.5 text-[11px] font-medium', active ? 'bg-accent/10 text-accent' : 'text-muted')}>{t(`layout.${id}`)}</span>
                  </button>
                );
              })}
            </div>
            {theme.layout === 'custom' && (
              <Button variant="outline" size="sm" className="mt-3" iconRight={ArrowRight} onClick={() => navigate('layout')}>
                {t('display.layout.editCustom')}
              </Button>
            )}

            <Segmented<BackgroundStyle>
              className="mt-5"
              label={t('display.bgStyle')}
              value={theme.backgroundStyle}
              onChange={(backgroundStyle) => change({ backgroundStyle })}
              options={(['solid', 'gradient', 'grid', 'carbon'] as BackgroundStyle[]).map((v) => ({ value: v, label: t(`bg.${v}`) }))}
            />
          </Card>

          <Card title={t('display.previewValues')} icon={SlidersHorizontal} className="lg:hidden">
            <PreviewControls />
          </Card>

          <Card title={t('display.manage.title')} icon={Layers}>
            <div className="mb-4 rounded-xl border border-line bg-base-2/50 px-3.5 py-3 text-sm">
              {editingTheme ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted">
                    {t('display.manage.editing')} <span className="font-semibold text-fg">{editingTheme.name}</span>
                  </p>
                  <IconButton
                    icon={X}
                    size="sm"
                    label={t('display.manage.stopEditing')}
                    onClick={() => {
                      applyTheme(model, { ...theme, id: theme.id });
                      toast(t('toast.editingStopped'), 'info');
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted">{modified ? t('display.manage.unsaved') : t('display.manage.basedOn', { name: source?.name ?? theme.name })}</p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {editingTheme && (
                <Button variant="primary" icon={Save} onClick={handleSave}>
                  {t('display.saveChanges')}
                </Button>
              )}
              <Button variant={editingTheme ? 'secondary' : 'primary'} icon={Save} onClick={() => setSaveOpen(true)}>
                {t('display.saveAsNew')}
              </Button>
              <Button icon={Download} onClick={exportCurrent}>
                {t('display.export')}
              </Button>
              <Button icon={Images} onClick={() => navigate('gallery')}>
                {t('display.toGallery')}
              </Button>
              <Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)} className="sm:col-span-2">
                {t('display.reset')}
              </Button>
            </div>
          </Card>

          <PreviewNotice className="lg:hidden" />
        </div>
      </div>

      <PromptDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t('display.saveDialog.title')}
        label={t('common.name')}
        initialValue={editingTheme ? `${theme.name} 2` : modified || !source?.builtin ? t('display.saveDialog.default', { name: theme.name }) : theme.name}
        confirmLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        emptyError={t('common.nameRequired')}
        hint={t('display.saveDialog.hint')}
        onSubmit={(name) => {
          const created = saveThemeAs(model, name);
          play('success');
          toast(t('toast.themeSaved', { name: created.name }));
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('display.resetDialog.title')}
        message={t('display.resetDialog.text', { model: SCOOTERS[model].short })}
        confirmLabel={t('display.reset')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          history.record();
          resetDesign(model);
          play('whoosh');
          toast(t('toast.reset'), 'info');
        }}
      />
    </div>
  );
}

