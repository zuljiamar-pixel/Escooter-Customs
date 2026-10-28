import { resolveLayout } from '../../data/layouts';
import { SCOOTERS } from '../../data/scooters';
import { useI18n } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { useBluetooth } from '../../store/BluetoothContext';
import type { DisplayTheme, ModelId } from '../../store/types';
import { cn } from '../../lib/cn';
import { DisplayMockup } from './DisplayMockup';
import { DisplayScreen } from './DisplayScreen';

interface LiveDisplayProps {
  model: ModelId;
  /** Abweichendes Theme (z. B. Vorschau im Store); sonst das aktive Design */
  theme?: DisplayTheme;
  housing?: boolean;
  className?: string;
}

/** Display mit den aktuellen Vorschauwerten aus dem Store. */
export function LiveDisplay({ model, theme, housing = true, className }: LiveDisplayProps) {
  const { designs, customLayouts, preview, settings } = useStore();
  const { result, status } = useBluetooth();
  const { t } = useI18n();
  const active = theme ?? designs[model].theme;
  const layout = resolveLayout(active.layout, customLayouts[model]);
  const liveBattery = status === 'connected' ? (result?.battery ?? null) : null;

  const screen = (
    <DisplayScreen
      theme={active}
      layout={layout}
      values={{ ...preview, bluetooth: preview.bluetooth || status === 'connected' }}
      units={settings.units}
      clock24h={settings.clock24h}
      animated={settings.displayAnimations && !settings.reducedMotion}
      liveBattery={liveBattery}
      label={t('display.aria', { model: SCOOTERS[model].short, theme: active.name })}
    />
  );

  if (!housing) return <div className={cn('overflow-hidden rounded-2xl', className)}>{screen}</div>;
  return (
    <DisplayMockup model={model} accent={active.accent} className={className}>
      {screen}
    </DisplayMockup>
  );
}
