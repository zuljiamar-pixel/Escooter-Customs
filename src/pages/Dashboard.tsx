import {
  ArrowLeftRight,
  ArrowRight,
  BatteryCharging,
  Bluetooth,
  BluetoothConnected,
  Gauge,
  Info,
  LayoutDashboard,
  LayoutTemplate,
  Palette,
  Power,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { SCOOTERS } from '../data/scooters';
import { PageHeader } from '../components/layout/PageHeader';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { PreviewControls } from '../components/scooter/PreviewControls';
import { ScooterIllustration } from '../components/scooter/ScooterIllustration';
import { DisplayScreen } from '../components/scooter/DisplayScreen';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PreviewNotice } from '../components/ui/Compat';
import { useToast } from '../components/ui/Toast';
import { resolveLayout } from '../data/layouts';
import { useNav } from '../hooks/useNav';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { useModel, useStore } from '../store/AppStore';
import { useBluetooth } from '../store/BluetoothContext';
import type { RouteId } from '../hooks/useHashRoute';

function BatteryRing({ value, live }: { value: number; live: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const low = value <= 20;
  return (
    <svg viewBox="0 0 120 120" className="size-32 shrink-0" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ui-line)" strokeWidth="9" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={low ? 'var(--color-danger)' : live ? 'var(--color-ok)' : 'var(--ui-accent)'}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dasharray .6s ease', filter: 'drop-shadow(0 0 6px currentColor)' }}
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-fg font-display text-[26px] font-bold">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export function Dashboard() {
  const model = useModel();
  const { designs, savedThemes, customLayouts, preview, settings, applyTheme } = useStore();
  const ble = useBluetooth();
  const { navigate } = useNav();
  const { t, l } = useI18n();
  const toast = useToast();
  const play = useSound();
  const scooter = SCOOTERS[model];
  const design = designs[model];
  const liveBattery = ble.status === 'connected' ? (ble.result?.battery ?? null) : null;
  const battery = liveBattery ?? preview.battery;
  const connected = ble.status === 'connected';

  const quick: { id: RouteId; icon: LucideIcon; title: string; text: string }[] = [
    { id: 'display', icon: Gauge, title: t('nav.display'), text: t('dash.quick.display') },
    { id: 'boot', icon: Power, title: t('nav.boot'), text: t('dash.quick.boot') },
    { id: 'layout', icon: LayoutTemplate, title: t('nav.layout'), text: t('dash.quick.layout') },
    { id: 'rgb', icon: Palette, title: t('nav.rgb'), text: t('dash.quick.rgb') },
  ];

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow={t('dash.eyebrow')}
        title={scooter.name}
        subtitle={l(scooter.tagline)}
        actions={
          <>
            <Button icon={ArrowLeftRight} onClick={() => navigate('select')}>
              {t('shell.switchModel')}
            </Button>
            <Button variant="primary" icon={Sparkles} onClick={() => navigate('display')}>
              {t('dash.customize')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
        <Card neon title={t('dash.live.title')} subtitle={t('dash.live.subtitle')} icon={Gauge} actions={<Badge tone="warn">{t('compat.previewOnly')}</Badge>}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <LiveDisplay model={model} className="max-w-[460px] py-4" />
            <PreviewControls />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Card title={t('dash.battery.title')} icon={BatteryCharging}>
            <div className="flex items-center gap-4">
              <BatteryRing value={battery} live={liveBattery !== null} />
              <div className="min-w-0 space-y-2">
                <Badge tone={liveBattery !== null ? 'ok' : 'warn'}>{liveBattery !== null ? t('dash.battery.live') : t('dash.battery.preview')}</Badge>
                <p className="text-xs leading-relaxed text-muted">{liveBattery !== null ? t('dash.battery.liveText') : t('dash.battery.previewText')}</p>
              </div>
            </div>
          </Card>

          <Card title={t('dash.connection.title')} icon={connected ? BluetoothConnected : Bluetooth}>
            <div className="flex items-center gap-3">
              <span className={cn('relative grid size-12 shrink-0 place-items-center rounded-2xl', connected ? 'bg-ok/12 text-ok' : 'bg-elevated text-muted')}>
                {connected && <span className="absolute inset-0 animate-ping rounded-2xl bg-ok/20" aria-hidden />}
                {connected ? <BluetoothConnected className="size-6" /> : <Bluetooth className="size-6" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{connected && ble.deviceName ? ble.deviceName : t(`ble.status.${ble.status}`)}</p>
                <p className="text-xs text-muted">{ble.support === 'ok' ? t('dash.connection.readOnly') : t('ble.unsupported.short')}</p>
              </div>
            </div>
            <Button className="mt-4" block icon={Bluetooth} onClick={() => navigate('connect')}>
              {connected ? t('dash.connection.manage') : t('dash.connection.connect')}
            </Button>
          </Card>

          <Card title={t('dash.design.title')} icon={Sparkles}>
            <p className="truncate font-display text-lg font-bold tracking-wide text-fg">{design.theme.name}</p>
            <div className="mt-2 flex items-center gap-2">
              {[design.theme.primary, design.theme.background, design.theme.accent].map((c, i) => (
                <span key={i} className="size-7 rounded-lg ring-1 ring-fg/15" style={{ background: c }} title={c} />
              ))}
              <span className="ml-1 text-xs text-muted">
                {t(`font.${design.theme.font}`)} · {t(`layout.${design.theme.layout}`)}
              </span>
            </div>
            {design.editingId && <p className="mt-2 text-xs text-accent">{t('dash.design.editing')}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" icon={Palette} onClick={() => navigate('display')}>
                {t('common.edit')}
              </Button>
              <Button size="sm" icon={Store} onClick={() => navigate('store')}>
                {t('nav.store.short')}
              </Button>
            </div>
          </Card>

          <Card title={t('dash.scooter.title')} icon={Info}>
            <ScooterIllustration model={model} accent={design.theme.accent} className="mx-auto -mt-2 mb-1 max-w-[300px]" />
            <p className="text-xs text-muted">
              {scooter.batteryWh} Wh · {t('select.range')} {scooter.rangeKm} km · {scooter.wheelInch}″ · {l(scooter.display)}
            </p>
            <Button className="mt-3" size="sm" block iconRight={ArrowRight} onClick={() => navigate('info')}>
              {t('dash.scooter.details')}
            </Button>
          </Card>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-subtle">{t('dash.quick.title')}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quick.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                play('tap');
                navigate(q.id);
              }}
              className="glass group animate-page-in rounded-[var(--radius-card)] p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/50"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/25 transition-shadow group-hover:shadow-[0_0_24px_-4px_var(--ui-accent)]">
                <q.icon className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-fg">{q.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{q.text}</p>
            </button>
          ))}
        </div>
      </section>

      {savedThemes.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-subtle">{t('dash.recent')}</h2>
            <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('gallery')}>
              {t('nav.gallery')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {savedThemes.slice(0, 3).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  applyTheme(model, theme);
                  play('success');
                  toast(t('toast.applied', { name: theme.name }));
                }}
                className="glass group overflow-hidden rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:border-accent/50"
              >
                <DisplayScreen theme={theme} layout={resolveLayout(theme.layout, customLayouts[model])} values={preview} units={settings.units} clock24h={settings.clock24h} animated={false} />
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="truncate text-sm font-medium text-fg">{theme.name}</span>
                  <span className="shrink-0 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">{t('common.apply')}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <PreviewNotice className="mt-6" />
    </div>
  );
}
