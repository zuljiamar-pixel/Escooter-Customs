import { memo, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  Download,
  FileBraces,
  Film,
  ImagePlus,
  LayoutGrid,
  Pause,
  Play,
  Power,
  Repeat,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wand,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { BootCanvas } from '../components/boot/BootCanvas';
import { ColorField } from '../components/color/ColorPicker';
import { DisplayMockup } from '../components/scooter/DisplayMockup';
import { Badge, Card, SectionLabel } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge, PreviewNotice } from '../components/ui/Compat';
import { Segmented, Select, Slider, Switch, TextField } from '../components/ui/Form';
import { ConfirmDialog, PromptDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { BOOT_TEMPLATES, bootFromTemplate, type BootTemplate } from '../data/bootTemplates';
import { SCOOTERS } from '../data/scooters';
import { useSound } from '../hooks/useSound';
import { useCallbackStable } from '../hooks/useStableCallback';
import { useI18n } from '../i18n';
import { exportBootPng, exportBootVideo, pickVideoMime } from '../lib/bootRenderer';
import { cn } from '../lib/cn';
import { downloadBlob, downloadJson, safeFilename } from '../lib/download';
import { ImageProcessingError, processLogoFile, ACCEPTED_IMAGE_TYPES } from '../lib/image';
import { useModel, useStore } from '../store/AppStore';
import { BOOT_EFFECTS, BOOT_EMBLEMS } from '../store/sanitize';
import { buildTransferFile } from '../store/transfer';
import type { BootBackground, BootDesign } from '../store/types';

const EXPORT_SIZES = {
  display: { w: 640, h: 480 },
  hd: { w: 1280, h: 960 },
  phone: { w: 1080, h: 1920 },
  desktop: { w: 1920, h: 1080 },
} as const;
type ExportSize = keyof typeof EXPORT_SIZES;

const TemplateButton = memo(function TemplateButton({ tpl, active, logo, label, showModel, onSelect }: { tpl: BootTemplate; active: boolean; logo: string | null; label: string; showModel: boolean; onSelect: (id: string) => void }) {
  const previewDesign = useMemo(() => ({ ...bootFromTemplate(tpl, `tpl-${tpl.templateId}`, 0), logo }), [tpl, logo]);
  return (
    <button
      type="button"
      onClick={() => onSelect(tpl.templateId)}
      aria-pressed={active}
      className={cn('overflow-hidden rounded-2xl border text-left transition-all', active ? 'border-accent/70 shadow-[0_0_20px_-8px_var(--ui-accent)]' : 'border-line hover:border-accent/40')}
    >
      <BootCanvas design={previewDesign} />
      <span className={cn('flex items-center justify-between gap-1 px-2.5 py-1.5 text-[11px] font-medium', active ? 'bg-accent/10 text-accent' : 'text-muted')}>
        <span className="truncate">{label}</span>
        {showModel && <span className="shrink-0 font-display text-[9px] tracking-wider text-subtle">{SCOOTERS[tpl.model].short}</span>}
      </span>
    </button>
  );
});

export function BootLogo() {
  const model = useModel();
  const { bootDrafts, bootDesigns, updateBootDraft, loadBootTemplate, resetBootDraft, saveBootAs, saveEditedBoot, settings } = useStore();
  const { t, l } = useI18n();
  const toast = useToast();
  const play = useSound();
  const draft = bootDrafts[model];
  const design = draft.design;
  const editing = draft.editingId ? bootDesigns.find((b) => b.id === draft.editingId) : undefined;

  const [playing, setPlaying] = useState(!settings.reducedMotion);
  const [loop, setLoop] = useState(true);
  const [restartKey, setRestartKey] = useState(0);
  const [seek, setSeek] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exportSize, setExportSize] = useState<ExportSize>('display');
  const [exporting, setExporting] = useState<'png' | 'video' | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const change = (patch: Partial<BootDesign>) => updateBootDraft(model, patch);
  const restart = () => {
    setSeek(null);
    setPlaying(true);
    setRestartKey((k) => k + 1);
    play('startup');
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const logo = await processLogoFile(file);
      change({ logo });
      restart();
      toast(t('toast.logoUploaded'));
    } catch (err) {
      const code = err instanceof ImageProcessingError ? err.code : 'decode';
      play('error');
      toast(t(`boot.upload.error.${code}`), 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const exportPng = async () => {
    setExporting('png');
    try {
      const { w, h } = EXPORT_SIZES[exportSize];
      const blob = await exportBootPng(design, w, h);
      downloadBlob(blob, `${safeFilename(design.name, 'boot-logo')}-${w}x${h}.png`);
      play('success');
      toast(t('toast.exported'));
    } catch {
      toast(t('toast.exportFailed'), 'error');
    } finally {
      setExporting(null);
    }
  };

  const videoSupported = typeof window !== 'undefined' && pickVideoMime() !== null;
  const exportVideo = async () => {
    setExporting('video');
    setVideoProgress(0);
    try {
      const { w, h } = EXPORT_SIZES[exportSize];
      const { blob, ext } = await exportBootVideo(design, w, h, setVideoProgress);
      downloadBlob(blob, `${safeFilename(design.name, 'boot-logo')}-${w}x${h}.${ext}`);
      play('success');
      toast(t('toast.videoExported', { ext: ext.toUpperCase() }));
    } catch {
      toast(t('toast.videoFailed'), 'error');
    } finally {
      setExporting(null);
    }
  };

  const exportJson = () => {
    downloadJson(buildTransferFile('boot-designs', { bootDesigns: [{ ...design, id: editing?.id ?? `export-${Date.now().toString(36)}` }] }), `${safeFilename(design.name, 'boot-logo')}.ecp-boot.json`);
    toast(t('toast.exported'));
  };

  const handleSave = () => {
    if (editing) {
      const saved = saveEditedBoot(model);
      if (saved) {
        play('success');
        toast(t('toast.bootUpdated', { name: saved.name }));
      }
    } else setSaveOpen(true);
  };

  const selectTemplate = useCallbackStable((id: string) => {
    loadBootTemplate(model, id);
    restart();
  });

  const ownTemplates = BOOT_TEMPLATES.filter((tp) => tp.model === model);
  const otherTemplates = BOOT_TEMPLATES.filter((tp) => tp.model !== model);

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={Power}
        eyebrow={SCOOTERS[model].short}
        title={t('nav.boot')}
        subtitle={t('boot.subtitle')}
        badge={
          <>
            <CompatBadge level="app" />
            <Badge tone="warn">{t('boot.transferUnsupported')}</Badge>
          </>
        }
        actions={
          <Button variant="primary" icon={Save} onClick={handleSave}>
            {editing ? t('display.saveChanges') : t('boot.save')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card padded={false} className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{design.name}</p>
                <p className="text-xs text-muted">{editing ? t('boot.status.editing') : t('boot.status.draft')}</p>
              </div>
              <Badge tone="warn">{t('boot.simulated')}</Badge>
            </div>
            <DisplayMockup model={model} accent={design.glowColor} className="max-w-[520px]">
              <BootCanvas
                design={design}
                playing={playing}
                loop={loop}
                restartKey={restartKey}
                seek={seek}
                onTime={setTime}
                label={t('boot.previewLabel', { name: design.name })}
              />
            </DisplayMockup>
            <div className="mt-5 flex items-center gap-2">
              <IconButton
                icon={playing && seek === null ? Pause : Play}
                variant="secondary"
                label={playing && seek === null ? t('boot.pause') : t('boot.play')}
                onClick={() => {
                  if (seek !== null) {
                    setSeek(null);
                    setPlaying(true);
                  } else setPlaying((p) => !p);
                }}
              />
              <IconButton icon={RotateCcw} variant="secondary" label={t('boot.replay')} onClick={restart} />
              <IconButton icon={Repeat} variant="secondary" label={t('boot.loop')} active={loop} onClick={() => setLoop((v) => !v)} aria-pressed={loop} />
              <input
                type="range"
                className="range flex-1"
                min={0}
                max={design.duration}
                step={0.01}
                value={seek ?? time}
                aria-label={t('boot.timeline')}
                style={{ ['--fill' as string]: `${((seek ?? time) / design.duration) * 100}%` }}
                onChange={(e) => {
                  setPlaying(false);
                  setSeek(Number(e.target.value));
                }}
              />
              <span className="w-12 text-right font-mono text-xs text-muted tabular-nums">{(seek ?? time).toFixed(1)}s</span>
            </div>
          </Card>
          <PreviewNotice />
        </div>

        <div className="space-y-5">
          <Card title={t('boot.templates')} icon={LayoutGrid} subtitle={t('boot.templates.subtitle')}>
            <SectionLabel>{t('boot.templates.for', { model: SCOOTERS[model].short })}</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {ownTemplates.map((tp) => (
                <TemplateButton key={tp.templateId} tpl={tp} active={design.templateId === tp.templateId} logo={design.logo} label={l(tp.label)} showModel={false} onSelect={selectTemplate} />
              ))}
            </div>
            <SectionLabel className="mt-4">{t('boot.templates.more')}</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {otherTemplates.map((tp) => (
                <TemplateButton key={tp.templateId} tpl={tp} active={design.templateId === tp.templateId} logo={design.logo} label={l(tp.label)} showModel onSelect={selectTemplate} />
              ))}
            </div>
          </Card>

          <Card title={t('boot.logo.title')} icon={ImagePlus}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:text-left',
                dragOver ? 'border-accent bg-accent/10' : 'border-line bg-base-2/40',
              )}
            >
              <div className="checker grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-line">
                {design.logo ? <img src={design.logo} alt={t('boot.logo.current')} className="max-h-full max-w-full object-contain" /> : <Upload className="size-6 text-subtle" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{design.logo ? t('boot.logo.replace') : t('boot.logo.drop')}</p>
                <p className="mt-0.5 text-xs text-muted">{t('boot.logo.formats')}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button size="sm" variant="primary" icon={Upload} loading={uploading} onClick={() => fileRef.current?.click()}>
                    {t('boot.logo.choose')}
                  </Button>
                  {design.logo && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      onClick={() => {
                        change({ logo: null });
                        toast(t('toast.logoRemoved'), 'info');
                      }}
                    >
                      {t('common.remove')}
                    </Button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Slider label={t('boot.logo.size')} value={Math.round(design.logoScale * 100)} min={15} max={100} onChange={(v) => change({ logoScale: v / 100 })} format={(v) => `${v}%`} />
              {design.logo && <Switch label={t('boot.logo.tint')} description={t('boot.logo.tintHint')} checked={design.logoTint} onChange={(logoTint) => change({ logoTint })} />}
              {!design.logo && (
                <Segmented
                  label={t('boot.emblem')}
                  size="sm"
                  value={design.emblem}
                  onChange={(emblem) => change({ emblem })}
                  options={BOOT_EMBLEMS.map((e) => ({ value: e, label: t(`boot.emblem.${e}`) }))}
                />
              )}
            </div>
          </Card>

          <Card title={t('boot.text.title')} icon={Type}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={t('boot.text.title.label')} value={design.title} onChange={(title) => change({ title })} maxLength={24} showCount placeholder="MAX G3" />
              <TextField label={t('boot.text.subtitle')} value={design.subtitle} onChange={(subtitle) => change({ subtitle })} maxLength={32} showCount placeholder={t('boot.text.subtitle.placeholder')} />
            </div>
            <Select
              className="mt-3"
              label={t('display.font')}
              value={design.font}
              onChange={(font) => change({ font })}
              options={(['orbitron', 'rajdhani', 'mono', 'audiowide', 'clean'] as const).map((f) => ({ value: f, label: t(`font.${f}`) }))}
            />
          </Card>

          <Card title={t('boot.style.title')} icon={Sparkles}>
            <div className="space-y-5">
              <div>
                <SectionLabel>{t('boot.effect')}</SectionLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BOOT_EFFECTS.map((effect) => (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => {
                        change({ effect });
                        restart();
                      }}
                      aria-pressed={design.effect === effect}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all',
                        design.effect === effect ? 'border-accent/70 bg-accent/10 text-accent' : 'border-line bg-base-2/50 text-muted hover:text-fg',
                      )}
                    >
                      <Wand className="mb-1 size-4" aria-hidden />
                      {t(`boot.effect.${effect}`)}
                    </button>
                  ))}
                </div>
              </div>
              <ColorField label={t('boot.color.text')} value={design.textColor} onChange={(textColor) => change({ textColor })} presets={[{ id: 'white', hex: '#ffffff', name: t('color.accent.white') }, { id: 'ice', hex: '#e8fbff', name: 'Ice' }, { id: 'silver', hex: '#c8d0dc', name: 'Silver' }]} />
              <ColorField label={t('boot.color.glow')} value={design.glowColor} onChange={(glowColor) => change({ glowColor })} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField label={t('boot.color.bg')} value={design.background} onChange={(background) => change({ background })} presets={[{ id: 'black', hex: '#000000', name: t('color.bg.black') }, { id: 'midnight', hex: '#01040a', name: t('color.bg.midnight') }]} />
                <ColorField label={t('boot.color.bg2')} value={design.background2} onChange={(background2) => change({ background2 })} presets={[{ id: 'deep', hex: '#062a3d', name: 'Deep Teal' }, { id: 'navy', hex: '#0b1a4a', name: 'Navy' }, { id: 'plum', hex: '#2a0b45', name: 'Plum' }]} />
              </div>
              <Segmented<BootBackground>
                label={t('boot.bgStyle')}
                value={design.backgroundStyle}
                onChange={(backgroundStyle) => change({ backgroundStyle })}
                options={(['solid', 'radial', 'grid'] as BootBackground[]).map((v) => ({ value: v, label: t(`boot.bg.${v}`) }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Slider label={t('boot.duration')} value={design.duration} min={1.5} max={8} step={0.1} onChange={(duration) => change({ duration })} format={(v) => `${v.toFixed(1)} s`} />
                <Slider label={t('display.glow')} value={design.glow} min={0} max={100} onChange={(glow) => change({ glow })} format={(v) => `${v}%`} />
              </div>
              <Switch label={t('boot.progress')} checked={design.showProgress} onChange={(showProgress) => change({ showProgress })} />
            </div>
          </Card>

          <Card title={t('boot.export.title')} icon={Download} subtitle={t('boot.export.subtitle')}>
            <Select<ExportSize>
              label={t('boot.export.size')}
              value={exportSize}
              onChange={setExportSize}
              options={(Object.keys(EXPORT_SIZES) as ExportSize[]).map((k) => ({ value: k, label: `${t(`boot.export.size.${k}`)} · ${EXPORT_SIZES[k].w}×${EXPORT_SIZES[k].h}` }))}
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Button icon={ImagePlus} loading={exporting === 'png'} disabled={exporting !== null} onClick={() => void exportPng()}>
                PNG
              </Button>
              <Button icon={Film} loading={exporting === 'video'} disabled={exporting !== null || !videoSupported} onClick={() => void exportVideo()} title={videoSupported ? undefined : t('boot.export.videoUnsupported')}>
                {exporting === 'video' ? `${Math.round(videoProgress * 100)}%` : t('boot.export.video')}
              </Button>
              <Button icon={FileBraces} disabled={exporting !== null} onClick={exportJson}>
                JSON
              </Button>
            </div>
            <p className="mt-3 text-xs text-subtle">{videoSupported ? t('boot.export.hint') : t('boot.export.videoUnsupported')}</p>

            <div className="mt-5 grid gap-2 border-t border-line/70 pt-4 sm:grid-cols-2">
              {editing && (
                <Button variant="primary" icon={Save} onClick={handleSave}>
                  {t('display.saveChanges')}
                </Button>
              )}
              <Button variant={editing ? 'secondary' : 'primary'} icon={Save} onClick={() => setSaveOpen(true)}>
                {t('boot.saveAsNew')}
              </Button>
              {editing && (
                <Button
                  icon={X}
                  onClick={() => {
                    resetBootDraft(model);
                    toast(t('toast.editingStopped'), 'info');
                  }}
                >
                  {t('boot.newDesign')}
                </Button>
              )}
              <Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)} className={editing ? '' : 'sm:col-span-1'}>
                {t('boot.reset')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <PromptDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t('boot.saveDialog.title')}
        label={t('common.name')}
        initialValue={editing ? `${design.name} 2` : design.name}
        confirmLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        emptyError={t('common.nameRequired')}
        hint={t('boot.saveDialog.hint')}
        onSubmit={(name) => {
          const created = saveBootAs(model, name);
          play('success');
          toast(t('toast.bootSaved', { name: created.name }));
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('boot.reset')}
        message={t('boot.resetConfirm')}
        confirmLabel={t('common.reset')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          resetBootDraft(model);
          restart();
          toast(t('toast.reset'), 'info');
        }}
      />
    </div>
  );
}
