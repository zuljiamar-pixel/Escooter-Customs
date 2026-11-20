import { useEffect, useId, useState } from 'react';
import { Bluetooth, Lightbulb } from 'lucide-react';
import { SCOOTERS } from '../../data/scooters';
import { useI18n } from '../../i18n';
import { formatSpeed, KM_PER_MILE, speedUnit } from '../../lib/units';
import { useModel, useStore } from '../../store/AppStore';
import { MAX_PREVIEW_SPEED } from '../../store/sanitize';
import type { DriveMode, Units } from '../../store/types';
import { Segmented, Slider, Switch } from '../ui/Form';

/** Zahlenfeld für beliebige Geschwindigkeiten (der Schieber deckt nur den üblichen Bereich des Modells ab). */
function SpeedInput({ kmh, units, onChange, label }: { kmh: number; units: Units; onChange: (kmh: number) => void; label: string }) {
  const id = useId();
  const shown = String(formatSpeed(kmh, units));
  const [text, setText] = useState(shown);
  // Wert von außen (Schieber, Einheitenwechsel) übernehmen
  useEffect(() => setText(shown), [shown]);

  const commit = (raw: string) => {
    setText(raw);
    const n = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(n) || n < 0) return;
    onChange(Math.min(MAX_PREVIEW_SPEED, units === 'imperial' ? n * KM_PER_MILE : n));
  };

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <label htmlFor={id} className="text-muted">
        {label}
      </label>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={Math.round(units === 'imperial' ? MAX_PREVIEW_SPEED / KM_PER_MILE : MAX_PREVIEW_SPEED)}
          step={1}
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(shown)}
          className="h-9 w-20 rounded-lg border border-line bg-base-2/70 px-2 text-right font-mono text-sm text-fg tabular-nums outline-none focus:border-accent/70"
        />
        <span className="w-9 text-xs text-subtle">{speedUnit(units)}</span>
      </span>
    </div>
  );
}

/** Regler für die simulierten Werte der Display-Vorschau (keine Live-Daten). */
export function PreviewControls({ compact }: { compact?: boolean }) {
  const { preview, updatePreview, settings } = useStore();
  const model = useModel();
  const { t } = useI18n();
  const max = SCOOTERS[model].previewMaxKmh;

  return (
    <div className="@container space-y-3">
      <Slider
        label={t('preview.speed')}
        value={Math.min(preview.speed, max)}
        min={0}
        max={max}
        onChange={(speed) => updatePreview({ speed })}
        // Der Schieber endet beim Modellmaximum; die Beschriftung zeigt immer den echten Wert (auch darüber).
        format={() => `${formatSpeed(preview.speed, settings.units)} ${speedUnit(settings.units)}`}
      />
      <SpeedInput kmh={preview.speed} units={settings.units} onChange={(speed) => updatePreview({ speed })} label={t('preview.speedExact')} />
      <Slider label={t('preview.battery')} value={preview.battery} min={0} max={100} onChange={(battery) => updatePreview({ battery })} format={(v) => `${v}%`} />
      <Segmented<DriveMode>
        label={t('preview.mode')}
        value={preview.mode}
        onChange={(mode) => updatePreview({ mode })}
        size={compact ? 'sm' : 'md'}
        options={[
          { value: 'eco', label: t('mode.eco') },
          { value: 'drive', label: t('mode.drive') },
          { value: 'sport', label: t('mode.sport') },
        ]}
      />
      {!compact && (
        <div className="grid gap-x-6 @md:grid-cols-2">
          <Switch icon={Lightbulb} label={t('preview.light')} checked={preview.light} onChange={(light) => updatePreview({ light })} />
          <Switch icon={Bluetooth} label={t('preview.bluetooth')} checked={preview.bluetooth} onChange={(bluetooth) => updatePreview({ bluetooth })} />
        </div>
      )}
    </div>
  );
}
