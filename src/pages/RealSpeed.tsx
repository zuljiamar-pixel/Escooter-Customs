import { useRef, useState } from 'react';
import { Calculator, CircleDot, Maximize, Play, RotateCcw, Ruler, Satellite, Square } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DisplayMockup } from '../components/scooter/DisplayMockup';
import { DisplayScreen } from '../components/scooter/DisplayScreen';
import { Badge, Card, SectionLabel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatBadge } from '../components/ui/Compat';
import { NumberField, Segmented } from '../components/ui/Form';
import { useToast } from '../components/ui/Toast';
import { resolveLayout } from '../data/layouts';
import { SCOOTERS, screenOf } from '../data/scooters';
import { useGpsSpeed, type GpsStatus } from '../hooks/useGpsSpeed';
import { useI18n } from '../i18n';
import {
  circumferenceFromInch,
  correctedSpeed,
  diameterFromCircumference,
  displayDeviation,
  GOOD_ACCURACY_M,
  rpmFromSpeed,
  speedFromRpm,
} from '../lib/speed';
import { distanceUnit, formatDistance, KM_PER_MILE, speedUnit } from '../lib/units';
import { useModel, useStore } from '../store/AppStore';
import { MAX_PREVIEW_SPEED } from '../store/sanitize';
import type { Units } from '../store/types';

const STATUS_TONE: Record<GpsStatus, 'muted' | 'warn' | 'ok' | 'danger'> = {
  idle: 'muted',
  locating: 'warn',
  active: 'ok',
  denied: 'danger',
  unavailable: 'danger',
  error: 'danger',
};

const toUnit = (kmh: number, units: Units) => (units === 'imperial' ? kmh / KM_PER_MILE : kmh);
const fromUnit = (value: number, units: Units) => (units === 'imperial' ? value * KM_PER_MILE : value);
/** Ab dieser Geschwindigkeit ist ein Vergleich mit dem Scooter-Display aussagekräftig */
const COMPARE_MIN_KMH = 5;

export function RealSpeed() {
  const model = useModel();
  const { designs, customLayouts, preview, settings, updatePreview } = useStore();
  const { t, locale } = useI18n();
  const toast = useToast();
  const gps = useGpsSpeed();
  const units = settings.units;
  const unit = speedUnit(units);
  const scooter = SCOOTERS[model];
  const theme = designs[model].theme;
  const screen = screenOf(model);
  const nominalCirc = circumferenceFromInch(scooter.wheelInch);
  const num = (n: number, digits = 1) => n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  // GPS-Vergleich: was zeigt der Scooter gerade?
  const [scooterShows, setScooterShows] = useState(0);
  const fsRef = useRef<HTMLDivElement>(null);
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;

  // Reifen-Rechner
  const [sizeMode, setSizeMode] = useState<'inch' | 'mm'>('inch');
  const [inch, setInch] = useState(scooter.wheelInch);
  const [circMm, setCircMm] = useState(() => Math.round(nominalCirc));
  const [rpm, setRpm] = useState(450);
  const [reverseKmh, setReverseKmh] = useState(20);
  const circ = sizeMode === 'inch' ? circumferenceFromInch(inch) : circMm;
  const calcKmh = speedFromRpm(rpm, circ);
  const reverseRpm = rpmFromSpeed(reverseKmh, circ);

  // Abweichung durch andere Reifengröße
  const [actualCirc, setActualCirc] = useState(() => Math.round(nominalCirc));
  const [displayedKmh, setDisplayedKmh] = useState(25);
  const realKmh = correctedSpeed(displayedKmh, nominalCirc, actualCirc);
  const tireDeviation = displayDeviation(displayedKmh, realKmh);

  const compareKmh = fromUnit(scooterShows, units);
  const canCompare = gps.status === 'active' && gps.kmh >= COMPARE_MIN_KMH && compareKmh > 0;
  const gpsDeviation = canCompare ? displayDeviation(compareKmh, gps.kmh) : 0;

  const deviationText = (pct: number) =>
    Math.abs(pct) < 1 ? t('tacho.deviation.exact') : t(pct > 0 ? 'tacho.deviation.more' : 'tacho.deviation.less', { pct: num(Math.abs(pct)) });

  const toggleFullscreen = () => {
    const el = fsRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen().catch(() => toast(t('tacho.fullscreenFailed'), 'error'));
  };

  const applyToPreview = () => {
    const speed = Math.min(MAX_PREVIEW_SPEED, Math.round(calcKmh * 10) / 10);
    updatePreview({ speed });
    toast(t('tacho.calc.applied', { speed: `${num(toUnit(speed, units))} ${unit}` }));
  };

  const weakSignal = gps.status === 'active' && gps.accuracy !== null && gps.accuracy > GOOD_ACCURACY_M;

  return (
    <div className="animate-page-in">
      <PageHeader icon={Satellite} eyebrow={scooter.short} title={t('nav.tacho')} subtitle={t('tacho.subtitle')} badge={<CompatBadge level="official" />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <Card
          neon
          title={t('tacho.gps.title')}
          subtitle={t('tacho.gps.subtitle')}
          icon={Satellite}
          actions={<Badge tone={STATUS_TONE[gps.status]}>{t(`tacho.status.${gps.status}`)}</Badge>}
        >
          <div ref={fsRef} className="rounded-2xl py-2 [&:fullscreen]:grid [&:fullscreen]:place-items-center [&:fullscreen]:bg-black">
            <DisplayMockup model={model} accent={theme.accent} className="max-w-[420px]">
              <DisplayScreen
                theme={theme}
                layout={resolveLayout(theme.layout, customLayouts[model], screen)}
                orientation={screen}
                maxSpeed={scooter.previewMaxKmh}
                values={{ ...preview, speed: gps.kmh, trip: gps.distanceKm }}
                units={units}
                clock24h={settings.clock24h}
                animated={false}
                label={t('tacho.gps.displayLabel', { speed: `${Math.round(toUnit(gps.kmh, units))} ${unit}` })}
              />
            </DisplayMockup>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {gps.running ? (
              <Button variant="primary" icon={Square} onClick={gps.stop} className="flex-1">
                {t('tacho.gps.stop')}
              </Button>
            ) : (
              <Button variant="primary" icon={Play} onClick={gps.start} disabled={gps.status === 'unavailable' && !('geolocation' in navigator)} className="flex-1">
                {t('tacho.gps.start')}
              </Button>
            )}
            <Button icon={RotateCcw} onClick={gps.reset}>
              {t('tacho.gps.reset')}
            </Button>
            {canFullscreen && (
              <Button icon={Maximize} onClick={toggleFullscreen}>
                {t('tacho.gps.fullscreen')}
              </Button>
            )}
          </div>

          <p className="mt-3 text-xs text-muted" aria-live="polite">
            {gps.status === 'active' && gps.accuracy !== null
              ? `${t('tacho.gps.accuracy', { m: Math.round(gps.accuracy) })}${weakSignal ? ` · ${t('tacho.gps.weak')}` : ''}`
              : t(`tacho.help.${gps.status}`)}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: t('tacho.stat.now'), value: `${Math.round(toUnit(gps.kmh, units))}`, unit },
              { label: t('tacho.stat.max'), value: `${Math.round(toUnit(gps.maxKmh, units))}`, unit },
              { label: t('tacho.stat.distance'), value: formatDistance(gps.distanceKm, units, 2), unit: distanceUnit(units) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line/80 bg-base-2/60 px-2 py-3">
                <dt className="text-[10px] uppercase tracking-wider text-subtle">{s.label}</dt>
                <dd className="font-display text-lg font-bold text-fg tabular-nums">
                  {s.value} <span className="text-xs font-medium text-muted">{s.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <SectionLabel className="mt-6">{t('tacho.compare.title')}</SectionLabel>
          <NumberField label={t('tacho.compare.scooterShows')} unit={unit} value={scooterShows} max={toUnit(MAX_PREVIEW_SPEED, units)} onChange={setScooterShows} />
          <output className="mt-2 block rounded-xl bg-base-2/60 px-3 py-2.5 text-sm text-fg">
            {canCompare
              ? `${t('tacho.compare.real', { speed: `${num(toUnit(gps.kmh, units))} ${unit}` })} ${deviationText(gpsDeviation)}`
              : t('tacho.compare.hint', { min: `${Math.round(toUnit(COMPARE_MIN_KMH, units))} ${unit}` })}
          </output>
          <p className="mt-2 text-xs text-warn">{t('tacho.safety')}</p>
        </Card>

        <div className="space-y-5">
          <Card title={t('tacho.calc.title')} subtitle={t('tacho.calc.subtitle')} icon={Calculator}>
            <Segmented<'inch' | 'mm'>
              label={t('tacho.calc.sizeMode')}
              value={sizeMode}
              onChange={(mode) => {
                if (mode === 'mm') setCircMm(Math.round(circumferenceFromInch(inch)));
                setSizeMode(mode);
              }}
              options={[
                { value: 'inch', label: t('tacho.calc.byInch') },
                { value: 'mm', label: t('tacho.calc.byCirc') },
              ]}
            />
            <div className="mt-3 space-y-2.5">
              {sizeMode === 'inch' ? (
                <NumberField label={t('tacho.calc.inch')} unit="″" value={inch} decimals={1} max={30} onChange={setInch} />
              ) : (
                <NumberField label={t('tacho.calc.circ')} unit="mm" value={circMm} max={5000} onChange={setCircMm} hint={t('tacho.calc.measureHint')} />
              )}
              <p className="text-xs text-subtle">{t('tacho.calc.wheelInfo', { circ: Math.round(circ), dia: Math.round(diameterFromCircumference(circ)) })}</p>
              <NumberField label={t('tacho.calc.rpm')} unit={t('tacho.calc.rpmUnit')} value={rpm} max={20000} onChange={setRpm} />
            </div>
            <output className="mt-4 flex items-baseline justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3">
              <span className="text-sm text-muted">{t('tacho.calc.result')}</span>
              <span className="font-display text-3xl font-bold text-fg tabular-nums">
                {num(toUnit(calcKmh, units))} <span className="text-sm font-medium text-muted">{unit}</span>
              </span>
            </output>
            <Button size="sm" icon={CircleDot} onClick={applyToPreview} className="mt-3">
              {t('tacho.calc.apply')}
            </Button>

            <SectionLabel className="mt-6">{t('tacho.calc.reverse')}</SectionLabel>
            <NumberField
              label={t('tacho.calc.atSpeed')}
              unit={unit}
              value={Math.round(toUnit(reverseKmh, units) * 10) / 10}
              decimals={1}
              max={toUnit(MAX_PREVIEW_SPEED, units)}
              onChange={(v) => setReverseKmh(fromUnit(v, units))}
            />
            <p className="mt-2 text-sm text-fg">{t('tacho.calc.reverseResult', { rpm: num(reverseRpm, 0), rps: num(reverseRpm / 60) })}</p>
          </Card>

          <Card title={t('tacho.tire.title')} subtitle={t('tacho.tire.subtitle')} icon={Ruler}>
            <p className="mb-3 text-sm text-muted">{t('tacho.tire.nominal', { model: scooter.short, inch: scooter.wheelInch, circ: Math.round(nominalCirc) })}</p>
            <div className="space-y-2.5">
              <NumberField label={t('tacho.tire.actual')} unit="mm" value={actualCirc} max={5000} onChange={setActualCirc} hint={t('tacho.calc.measureHint')} />
              <NumberField
                label={t('tacho.tire.displayed')}
                unit={unit}
                value={Math.round(toUnit(displayedKmh, units) * 10) / 10}
                decimals={1}
                max={toUnit(MAX_PREVIEW_SPEED, units)}
                onChange={(v) => setDisplayedKmh(fromUnit(v, units))}
              />
            </div>
            <output className="mt-4 block rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-muted">{t('tacho.tire.real')}</span>
                <span className="font-display text-3xl font-bold text-fg tabular-nums">
                  {num(toUnit(realKmh, units))} <span className="text-sm font-medium text-muted">{unit}</span>
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted">{realKmh > 0 ? deviationText(tireDeviation) : ''}</span>
            </output>
            <p className="mt-3 text-xs text-subtle">{t('tacho.tire.note')}</p>
          </Card>

          <Card title={t('tacho.how.title')} icon={CircleDot}>
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>{t('tacho.how.scooter')}</p>
              <p>{t('tacho.how.app')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
