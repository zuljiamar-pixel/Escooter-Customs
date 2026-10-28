import { useEffect, useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { clamp, hexToHsv, hexToRgb, hsvToHex, normalizeHex, rgbToHex, type HSV, type RGB } from '../../lib/color';
import { cn } from '../../lib/cn';
import { useI18n } from '../../i18n';
import { ColorWheel } from './ColorWheel';
import { NEON_PRESETS } from '../../lib/color';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  /** Wird nach Abschluss einer Auswahl aufgerufen (z. B. für den Verlauf) */
  onCommit?: (hex: string) => void;
  wheelSize?: number;
  compact?: boolean;
}

/** Hält HSV intern, damit der Farbton bei Grau/Schwarz nicht verloren geht. */
export function useHsvState(value: string, onChange: (hex: string) => void) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const last = useRef(value);

  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      if (hsvToHex(hsv) !== value) setHsv(hexToHsv(value));
    }
  }, [value, hsv]);

  const set = (next: HSV) => {
    setHsv(next);
    const hex = hsvToHex(next);
    last.current = hex;
    onChange(hex);
  };
  return [hsv, set] as const;
}

export function ColorPicker({ value, onChange, onCommit, wheelSize = 240, compact }: ColorPickerProps) {
  const { t } = useI18n();
  const [hsv, setHsv] = useHsvState(value, onChange);
  const rgb = hexToRgb(value);

  return (
    <div className={cn('grid gap-4', compact ? 'sm:grid-cols-[minmax(0,180px)_1fr] sm:items-center' : '')}>
      <ColorWheel hsv={hsv} onChange={setHsv} onCommit={() => onCommit?.(hsvToHex(hsv))} size={compact ? 180 : wheelSize} label={t('color.wheel')} />
      <div className="space-y-3">
        <BrightnessSlider hsv={hsv} onChange={setHsv} onCommit={() => onCommit?.(hsvToHex(hsv))} label={t('color.brightness')} />
        <HexInput value={value} onChange={(hex) => { onChange(hex); onCommit?.(hex); }} label={t('color.hex')} />
        <RgbInputs rgb={rgb} onChange={(next) => { const hex = rgbToHex(next); onChange(hex); onCommit?.(hex); }} />
      </div>
    </div>
  );
}

function BrightnessSlider({ hsv, onChange, onCommit, label }: { hsv: HSV; onChange: (h: HSV) => void; onCommit: () => void; label: string }) {
  const full = hsvToHex({ ...hsv, v: 1 });
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono">{Math.round(hsv.v * 100)}%</span>
      </div>
      <div className="relative h-7">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full ring-1 ring-line" style={{ background: `linear-gradient(90deg, #000, ${full})` }} />
        <input
          type="range"
          aria-label={label}
          min={0}
          max={100}
          value={Math.round(hsv.v * 100)}
          onChange={(e) => onChange({ ...hsv, v: Number(e.target.value) / 100 })}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          className="range range-clear absolute inset-0"
        />
      </div>
    </div>
  );
}

export function HexInput({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(value);
    setInvalid(false);
  }, [value]);

  const commit = () => {
    const hex = normalizeHex(draft);
    if (hex) {
      setInvalid(false);
      if (hex !== value) onChange(hex);
      setDraft(hex);
    } else {
      setInvalid(true);
    }
  };

  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <div className={cn('flex h-10 items-center gap-2 rounded-xl border bg-base-2/70 px-2.5 focus-within:border-accent/70', invalid ? 'border-danger/60' : 'border-line')}>
        <span className="size-5 shrink-0 rounded-md ring-1 ring-fg/15" style={{ background: value }} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          maxLength={7}
          spellCheck={false}
          aria-invalid={invalid}
          className="w-full bg-transparent font-mono text-sm uppercase text-fg outline-none"
        />
      </div>
    </label>
  );
}

function RgbInputs({ rgb, onChange }: { rgb: RGB; onChange: (rgb: RGB) => void }) {
  const channels: { key: keyof RGB; label: string; color: string }[] = [
    { key: 'r', label: 'R', color: '#ff4d6a' },
    { key: 'g', label: 'G', color: '#2ee59d' },
    { key: 'b', label: 'B', color: '#3d8bff' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {channels.map((c) => (
        <label key={c.key} className="block">
          <span className="mb-1 block text-xs font-semibold" style={{ color: c.color }}>
            {c.label}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={255}
            value={rgb[c.key]}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange({ ...rgb, [c.key]: clamp(Math.round(n), 0, 255) });
            }}
            className="h-10 w-full rounded-xl border border-line bg-base-2/70 px-2.5 font-mono text-sm text-fg outline-none focus:border-accent/70"
          />
        </label>
      ))}
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onCommit?: (hex: string) => void;
  presets?: readonly { id: string; hex: string; name?: string }[];
  extra?: string[];
}

/** Farbwahl mit Neon-Presets und aufklappbarem RGB-Picker für eigene Farben. */
export function ColorField({ label, value, onChange, onCommit, presets = NEON_PRESETS, extra = [] }: ColorFieldProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const swatches = [
    ...presets.map((p) => ({ hex: p.hex, name: p.name ?? t(`color.preset.${p.id}` as 'color.preset.blue') })),
    ...extra.filter((hex) => !presets.some((p) => p.hex === hex)).map((hex) => ({ hex, name: hex })),
  ];
  const isCustom = !swatches.some((s) => s.hex === value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="font-mono text-xs uppercase text-subtle">{value}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((s) => {
          const active = s.hex === value;
          return (
            <button
              key={s.hex}
              type="button"
              title={s.name}
              aria-label={s.name}
              aria-pressed={active}
              onClick={() => {
                onChange(s.hex);
                onCommit?.(s.hex);
              }}
              className={cn(
                'relative grid size-9 place-items-center rounded-xl ring-1 ring-fg/15 transition-transform hover:scale-110',
                active && 'scale-110 ring-2 ring-fg',
              )}
              style={{ background: s.hex, boxShadow: active ? `0 0 18px -2px ${s.hex}` : undefined }}
            >
              {active && <Check className="size-4 text-white mix-blend-difference" aria-hidden />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            'grid size-9 place-items-center rounded-xl border border-dashed transition-colors',
            open || isCustom ? 'border-accent text-accent' : 'border-line text-muted hover:text-fg',
          )}
          style={isCustom ? { background: value } : undefined}
          title={t('color.custom')}
          aria-label={t('color.custom')}
        >
          {isCustom ? <Check className="size-4 text-white mix-blend-difference" /> : <Plus className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3 animate-fade-in rounded-2xl border border-line bg-base-2/60 p-3">
          <ColorPicker value={value} onChange={onChange} onCommit={onCommit} compact />
        </div>
      )}
    </div>
  );
}
