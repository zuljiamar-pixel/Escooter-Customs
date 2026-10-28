import { ArrowLeftRight, BookOpen, ExternalLink, Info, MonitorSmartphone, ShieldCheck, Table2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { ScooterIllustration } from '../components/scooter/ScooterIllustration';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatMatrix } from '../components/ui/Compat';
import { MODEL_IDS, SCOOTERS } from '../data/scooters';
import { useNav } from '../hooks/useNav';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { useModel, useStore } from '../store/AppStore';

export function ScooterInfo() {
  const model = useModel();
  const { designs, settings } = useStore();
  const { t, l } = useI18n();
  const { navigate } = useNav();
  const scooter = SCOOTERS[model];
  const other = SCOOTERS[model === 'max-g3' ? 'f3-pro' : 'max-g3'];
  const accent = designs[model].theme.accent;
  const compareIds = Array.from(new Set([...scooter.specs.map((s) => s.id), ...other.specs.map((s) => s.id)]));

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={Info}
        eyebrow={t('info.eyebrow')}
        title={scooter.name}
        subtitle={l(scooter.tagline)}
        actions={
          <Button icon={ArrowLeftRight} onClick={() => navigate('select')}>
            {t('shell.switchModel')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card neon padded={false} className="overflow-hidden">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -top-20 -left-20 size-72 rounded-full opacity-30 blur-3xl" style={{ background: accent }} aria-hidden />
            <ScooterIllustration model={model} accent={accent} animated={!settings.reducedMotion} className="relative mx-auto max-w-xl animate-float" />
            <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: t('select.battery'), value: `${scooter.batteryWh} Wh` },
                { label: t('select.range'), value: `${t('info.upTo')} ${scooter.rangeKm} km` },
                { label: t('select.tires'), value: `${scooter.wheelInch}″` },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-line/80 bg-base-2/60 px-2 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-subtle">{s.label}</p>
                  <p className="font-display text-base font-bold text-fg">{s.value}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-3 text-center text-[11px] text-subtle">{t('info.illustration')}</p>
          </div>
        </Card>

        <Card title={t('info.specs')} icon={BookOpen} actions={<Badge tone="warn">{t('info.regional')}</Badge>}>
          <dl className="divide-y divide-line/70">
            {scooter.specs.map((spec) => (
              <div key={spec.id} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] gap-3 py-2.5 text-sm">
                <dt className="text-muted">{l(spec.label)}</dt>
                <dd className="font-medium text-fg">{l(spec.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-subtle">{t('info.source')}</p>
        </Card>

        <Card title={t('info.display.title')} icon={MonitorSmartphone}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
            <LiveDisplay model={model} />
            <div className="space-y-2 text-sm text-muted">
              <p>
                <span className="font-semibold text-fg">{l(scooter.display)}</span> · {t('info.display.text')}
              </p>
              <p className="text-xs">{t('info.display.note')}</p>
              <Button size="sm" variant="outline" onClick={() => navigate('display')}>
                {t('dash.customize')}
              </Button>
            </div>
          </div>
        </Card>

        <Card title={t('info.official.title')} icon={ShieldCheck}>
          <ul className="space-y-2.5 text-sm text-muted">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              {t('info.official.app')}
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              {t('info.official.manual')}
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
              {t('info.official.safety')}
            </li>
          </ul>
          <a
            href="https://www.segway.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-elevated px-4 text-sm font-medium text-fg transition-colors hover:border-accent/60 hover:text-accent"
          >
            segway.com <ExternalLink className="size-4" aria-hidden />
          </a>
        </Card>

        <Card title={t('info.compare')} icon={Table2} className="lg:col-span-2">
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-medium text-subtle">{t('info.compare.feature')}</th>
                  {MODEL_IDS.map((id) => (
                    <th key={id} className={cn('px-3 py-2 font-display text-xs font-bold tracking-wider', id === model ? 'text-accent' : 'text-fg')}>
                      {SCOOTERS[id].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {compareIds.map((specId) => {
                  const label = scooter.specs.find((s) => s.id === specId)?.label ?? other.specs.find((s) => s.id === specId)?.label;
                  return (
                    <tr key={specId}>
                      <td className="py-2.5 pr-3 text-muted">{label ? l(label) : specId}</td>
                      {MODEL_IDS.map((id) => {
                        const spec = SCOOTERS[id].specs.find((s) => s.id === specId);
                        return (
                          <td key={id} className={cn('px-3 py-2.5', id === model ? 'text-fg' : 'text-muted')}>
                            {spec ? l(spec.value) : '–'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('compat.title')} icon={ShieldCheck} className="lg:col-span-2">
          <CompatMatrix />
        </Card>
      </div>
    </div>
  );
}
