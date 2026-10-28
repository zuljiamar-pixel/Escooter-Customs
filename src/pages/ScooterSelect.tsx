import { ArrowLeft, ArrowRight, BatteryFull, Check, CircleGauge, MonitorSmartphone, Route } from 'lucide-react';
import { ORIGINAL_THEMES, STORE_THEMES } from '../data/themes';
import { MODEL_IDS, SCOOTERS } from '../data/scooters';
import { BrandMark } from '../components/layout/AppShell';
import { ScooterIllustration } from '../components/scooter/ScooterIllustration';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { Button } from '../components/ui/Button';
import { PreviewNotice } from '../components/ui/Compat';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { useStore } from '../store/AppStore';
import type { ModelId } from '../store/types';

const SHOWCASE: Record<ModelId, string> = { 'max-g3': 'neon-blue', 'f3-pro': 'ultra-violet' };

export function ScooterSelect({ onDone }: { onDone: () => void }) {
  const { model, selectModel, settings } = useStore();
  const { t, l } = useI18n();
  const play = useSound();
  const firstRun = model === null;

  const choose = (id: ModelId) => {
    play('success');
    selectModel(id);
    onDone();
  };

  return (
    <div className="relative z-10 mx-auto min-h-dvh w-full max-w-6xl overflow-x-clip px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10 sm:px-6 lg:pt-12">
      {!firstRun && (
        <Button variant="ghost" icon={ArrowLeft} onClick={onDone} className="mb-2">
          {t('common.back')}
        </Button>
      )}
      <header className="mb-8 flex animate-page-in flex-col items-center text-center">
        <BrandMark className="mb-5 size-14" />
        <p className="font-display text-[11px] font-semibold tracking-[0.35em] text-accent">{firstRun ? t('select.welcome') : t('select.switch')}</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-wide sm:text-5xl">
          <span className="text-gradient">ESCOOTER CUSTOMIZER PRO</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">{t('select.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {MODEL_IDS.map((id, i) => {
          const scooter = SCOOTERS[id];
          const showcase = STORE_THEMES.find((th) => th.id === SHOWCASE[id]) ?? ORIGINAL_THEMES[id];
          const selected = model === id;
          return (
            <article
              key={id}
              className={cn(
                'glass neon-border group relative flex animate-page-in flex-col overflow-hidden rounded-[1.75rem] p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6',
                selected && 'glow-accent',
              )}
              style={{ animationDelay: `${120 + i * 120}ms` }}
            >
              <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full opacity-40 blur-3xl" style={{ background: showcase.primary }} aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-subtle">Segway-Ninebot</p>
                  <h2 className="font-display text-2xl font-bold tracking-wider text-fg">{scooter.short}</h2>
                  <p className="mt-1 text-sm text-muted">{l(scooter.tagline)}</p>
                </div>
                {selected && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                    <Check className="size-3.5" /> {t('select.current')}
                  </span>
                )}
              </div>

              <div className="relative my-5 grid grid-cols-[1.2fr_1fr] items-center gap-4">
                <ScooterIllustration model={id} accent={showcase.primary} animated={!settings.reducedMotion} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                <LiveDisplay model={id} theme={showcase} housing={false} className="shadow-[0_0_40px_-12px_var(--ui-accent)] ring-1 ring-fg/15" />
              </div>

              <dl className="relative mb-5 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: BatteryFull, label: t('select.battery'), value: `${scooter.batteryWh} Wh` },
                  { icon: Route, label: t('select.range'), value: `${scooter.rangeKm} km` },
                  { icon: CircleGauge, label: t('select.tires'), value: `${scooter.wheelInch}″` },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-line/80 bg-base-2/60 px-2 py-2.5">
                    <s.icon className="mx-auto mb-1 size-4 text-accent" aria-hidden />
                    <dt className="text-[10px] uppercase tracking-wider text-subtle">{s.label}</dt>
                    <dd className="font-display text-sm font-semibold text-fg">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="relative mb-4 flex items-center gap-2 text-xs text-muted">
                <MonitorSmartphone className="size-4 text-accent" aria-hidden />
                {l(scooter.display)} · {t('select.dashboardHint')}
              </p>

              <Button variant={selected ? 'outline' : 'primary'} size="lg" block iconRight={ArrowRight} onClick={() => choose(id)} className="relative mt-auto">
                {selected ? t('select.continue', { model: scooter.short }) : t('select.choose', { model: scooter.short })}
              </Button>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-8 max-w-3xl animate-page-in" style={{ animationDelay: '380ms' }}>
        <PreviewNotice />
        <p className="mt-4 text-center text-[11px] leading-relaxed text-subtle">{t('legal.disclaimer')}</p>
      </div>
    </div>
  );
}
