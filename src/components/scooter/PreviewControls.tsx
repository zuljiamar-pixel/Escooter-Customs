import { Bluetooth, Lightbulb } from 'lucide-react';
import { SCOOTERS } from '../../data/scooters';
import { useI18n } from '../../i18n';
import { formatSpeed, speedUnit } from '../../lib/units';
import { useModel, useStore } from '../../store/AppStore';
import type { DriveMode } from '../../store/types';
import { Segmented, Slider, Switch } from '../ui/Form';

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
        format={(v) => `${formatSpeed(v, settings.units)} ${speedUnit(settings.units)}`}
      />
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
