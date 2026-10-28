import { useState } from 'react';
import { Check, Copy, Droplet, Heart, History, Palette, PaintBucket, Sparkles, SwatchBook, Trash2, Wand } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ColorPicker } from '../components/color/ColorPicker';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { Card, SectionLabel } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge } from '../components/ui/Compat';
import { Segmented } from '../components/ui/Form';
import { useToast } from '../components/ui/Toast';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { contrastRatio, formatHsl, formatRgb, harmony, NEON_PRESETS, readableOn, type HarmonyId } from '../lib/color';
import { cn } from '../lib/cn';
import { copyToClipboard } from '../lib/download';
import { useModel, useStore } from '../store/AppStore';

type Target = 'primary' | 'background' | 'accent' | 'uiAccent' | 'bootGlow' | 'bootText';

const HARMONIES: HarmonyId[] = ['complementary', 'analogous', 'triadic', 'split', 'tetradic'];

function Swatch({ hex, onClick, active, label }: { hex: string; onClick: () => void; active?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label ?? hex}
      aria-label={label ?? hex}
      className={cn('group relative h-12 min-w-0 flex-1 rounded-xl ring-1 ring-fg/15 transition-transform hover:-translate-y-0.5', active && 'ring-2 ring-fg')}
      style={{ background: hex, boxShadow: `0 8px 24px -12px ${hex}` }}
    >
      <span className="absolute inset-x-0 bottom-1 text-center font-mono text-[9px] uppercase opacity-0 transition-opacity group-hover:opacity-100" style={{ color: readableOn(hex) }}>
        {hex}
      </span>
    </button>
  );
}

export function RgbStudio() {
  const model = useModel();
  const { designs, updateDesign, updateSettings, updateBootDraft, palette, togglePaletteColor, colorHistory, pushColorHistory } = useStore();
  const { t } = useI18n();
  const toast = useToast();
  const play = useSound();
  const [color, setColor] = useState(designs[model].theme.primary);
  const [harmonyType, setHarmonyType] = useState<HarmonyId>('complementary');
  const [copied, setCopied] = useState<string | null>(null);
  const theme = designs[model].theme;
  const inPalette = palette.includes(color);

  const copy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(text);
      play('tap');
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400);
    } else {
      toast(t('toast.copyFailed'), 'error');
    }
  };

  const applyTo = (target: Target) => {
    pushColorHistory(color);
    switch (target) {
      case 'primary':
      case 'background':
      case 'accent':
        updateDesign(model, { [target]: color });
        break;
      case 'uiAccent':
        updateSettings({ uiAccent: color });
        break;
      case 'bootGlow':
        updateBootDraft(model, { glowColor: color });
        break;
      case 'bootText':
        updateBootDraft(model, { textColor: color });
        break;
    }
    play('success');
    toast(t('toast.colorApplied', { target: t(`rgb.target.${target}`) }));
  };

  const formats = [
    { label: 'HEX', value: color.toUpperCase() },
    { label: 'RGB', value: formatRgb(color) },
    { label: 'HSL', value: formatHsl(color) },
  ];

  const contrastBg = contrastRatio(color, theme.background);

  return (
    <div className="animate-page-in">
      <PageHeader icon={Palette} eyebrow={t('rgb.eyebrow')} title={t('nav.rgb')} subtitle={t('rgb.subtitle')} badge={<CompatBadge level="app" />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card neon title={t('rgb.picker.title')} subtitle={t('rgb.picker.subtitle')} icon={Droplet}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-start lg:grid-cols-1 xl:grid-cols-[minmax(0,300px)_1fr]">
            <ColorPicker value={color} onChange={setColor} onCommit={pushColorHistory} wheelSize={300} />
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl p-5 ring-1 ring-fg/15" style={{ background: color, color: readableOn(color), boxShadow: `0 20px 50px -20px ${color}` }}>
                <p className="font-display text-2xl font-bold tracking-wider uppercase">{color}</p>
                <p className="mt-1 text-xs opacity-75">{formatRgb(color)}</p>
                <IconButton
                  icon={Heart}
                  label={inPalette ? t('rgb.palette.remove') : t('rgb.palette.add')}
                  onClick={() => {
                    togglePaletteColor(color);
                    play('toggle');
                  }}
                  className={cn('absolute top-3 right-3 bg-black/15 hover:bg-black/25', inPalette && '[&_svg]:fill-current')}
                  style={{ color: readableOn(color) }}
                />
              </div>
              {formats.map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-xl border border-line bg-base-2/50 py-1.5 pr-1.5 pl-3">
                  <span className="w-9 text-[10px] font-bold tracking-wider text-subtle">{f.label}</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg">{f.value}</code>
                  <IconButton icon={copied === f.value ? Check : Copy} size="sm" label={t('common.copy')} onClick={() => void copy(f.value)} className={copied === f.value ? 'text-ok' : ''} />
                </div>
              ))}
              <div>
                <SectionLabel className="mt-4">{t('rgb.neon')}</SectionLabel>
                <div className="flex gap-2">
                  {NEON_PRESETS.map((p) => (
                    <Swatch key={p.id} hex={p.hex} active={p.hex === color} label={t(`color.preset.${p.id}`)} onClick={() => setColor(p.hex)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title={t('rgb.apply.title')} subtitle={t('rgb.apply.subtitle')} icon={PaintBucket}>
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-4">
              <LiveDisplay model={model} housing={false} className="ring-1 ring-fg/15" />
              <div className="space-y-1.5 text-xs text-muted">
                {(['primary', 'background', 'accent'] as const).map((k) => (
                  <p key={k} className="flex items-center gap-2">
                    <span className="size-3.5 rounded ring-1 ring-fg/20" style={{ background: theme[k] }} />
                    {t(`rgb.target.${k}`)}
                  </p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['primary', 'background', 'accent', 'uiAccent', 'bootGlow', 'bootText'] as Target[]).map((target) => (
                <Button key={target} size="sm" onClick={() => applyTo(target)} className="justify-start" title={t(`rgb.target.${target}`)}>
                  <span className="size-3.5 shrink-0 rounded-full ring-1 ring-fg/20" style={{ background: color }} />
                  <span className="truncate">{t(`rgb.target.${target}`)}</span>
                </Button>
              ))}
            </div>
            <p className={cn('mt-3 text-xs', contrastBg < 3 ? 'text-danger' : 'text-muted')}>{t('rgb.contrastBg', { ratio: contrastBg.toFixed(1) })}</p>
          </Card>

          <Card title={t('rgb.harmony.title')} icon={Wand}>
            <Segmented<HarmonyId>
              size="sm"
              value={harmonyType}
              onChange={setHarmonyType}
              options={HARMONIES.map((h) => ({ value: h, label: t(`rgb.harmony.${h}`) }))}
            />
            <div className="mt-3 flex gap-2">
              {harmony(color, harmonyType).map((hex, i) => (
                <Swatch key={`${hex}-${i}`} hex={hex} active={hex === color} onClick={() => setColor(hex)} />
              ))}
            </div>
            <p className="mt-2 text-xs text-subtle">{t('rgb.harmony.hint')}</p>
          </Card>

          <Card
            title={t('rgb.palette.title')}
            icon={SwatchBook}
            actions={
              <Button size="sm" variant={inPalette ? 'outline' : 'secondary'} icon={inPalette ? Check : Sparkles} onClick={() => togglePaletteColor(color)}>
                {inPalette ? t('rgb.palette.saved') : t('rgb.palette.add')}
              </Button>
            }
          >
            {palette.length ? (
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {palette.map((hex) => (
                  <div key={hex} className="group relative">
                    <button type="button" onClick={() => setColor(hex)} className="aspect-square w-full rounded-xl ring-1 ring-fg/15 transition-transform hover:scale-105" style={{ background: hex }} aria-label={hex} title={hex} />
                    <button
                      type="button"
                      onClick={() => togglePaletteColor(hex)}
                      className="absolute -top-1.5 -right-1.5 hidden size-5 place-items-center rounded-full bg-panel text-danger ring-1 ring-line group-hover:grid"
                      aria-label={t('rgb.palette.remove')}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t('rgb.palette.empty')}</p>
            )}
            <SectionLabel className="mt-5 flex items-center gap-1.5">
              <History className="size-3.5" /> {t('rgb.history')}
            </SectionLabel>
            {colorHistory.length ? (
              <div className="flex flex-wrap gap-2">
                {colorHistory.map((hex) => (
                  <button key={hex} type="button" onClick={() => setColor(hex)} className="size-8 rounded-lg ring-1 ring-fg/15 transition-transform hover:scale-110" style={{ background: hex }} title={hex} aria-label={hex} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t('rgb.history.empty')}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
