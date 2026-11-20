import { resolveLayout } from '../../data/layouts';
import { SCOOTERS, screenOf } from '../../data/scooters';
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
  const screen = screenOf(model);
  const maxKmh = SCOOTERS[model].previewMaxKmh;
  const layout = resolveLayout(active.layout, customLayouts[model], screen);
  const liveBattery = status === 'connected' ? (result?.battery ?? null) : null;

  const display = (
    <DisplayScreen
      theme={active}
      layout={layout}
      orientation={screen} maxSpeed={maxKmh}
      values={{ ...preview, bluetooth: preview.bluetooth || status === 'connected' }}
      units={settings.units}
      clock24h={settings.clock24h}
      animated={settings.displayAnimations && !settings.reducedMotion}
      liveBattery={liveBattery}
      label={t('display.aria', { model: SCOOTERS[model].short, theme: active.name })}
    />
  );

  if (!housing) {
    const bare = <div className={cn('overflow-hidden rounded-2xl', className)}>{display}</div>;
    // Hochformat ohne Gehäuse: so breit, dass es so hoch wird wie ein Querformat-Display an derselben Stelle.
    return screen === 'portrait' ? <div className="mx-auto w-[66%] max-w-[360px]">{bare}</div> : bare;
  }
  return (
    <DisplayMockup model={model} accent={active.accent} className={className}>
      {display}
    </DisplayMockup>
  );
}
