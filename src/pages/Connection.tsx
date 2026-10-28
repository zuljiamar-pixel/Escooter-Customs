import {
  BatteryMedium,
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Check,
  CircleX,
  Cpu,
  Eraser,
  ListChecks,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
  Unplug,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatBadge, CompatMatrix } from '../components/ui/Compat';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import type { DeviceInfoField } from '../lib/bluetooth';
import { useBluetooth } from '../store/BluetoothContext';

const INFO_FIELDS: DeviceInfoField[] = ['manufacturer', 'model', 'firmware', 'hardware', 'software'];

export function Connection() {
  const ble = useBluetooth();
  const { t, locale } = useI18n();
  const busy = ble.status === 'requesting' || ble.status === 'connecting' || ble.status === 'reading';
  const connected = ble.status === 'connected';
  const supported = ble.support === 'ok';
  const StatusIcon = connected ? BluetoothConnected : busy ? BluetoothSearching : Bluetooth;
  const time = (ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const anyService = !!ble.result && (ble.result.services.battery || ble.result.services.deviceInfo);

  return (
    <div className="animate-page-in">
      <PageHeader icon={Bluetooth} eyebrow={t('ble.eyebrow')} title={t('nav.connect')} subtitle={t('ble.subtitle')} badge={<CompatBadge level="official" />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card neon>
            <div className="flex flex-col items-center py-4 text-center">
              <div className="relative mb-5 grid size-28 place-items-center">
                {busy && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
                    <span className="absolute inset-3 animate-ping rounded-full bg-accent/15 [animation-delay:300ms]" />
                  </>
                )}
                <span
                  className={cn(
                    'relative grid size-24 place-items-center rounded-full ring-1 transition-all',
                    connected ? 'bg-ok/12 text-ok ring-ok/40 shadow-[0_0_40px_-8px_var(--color-ok)]' : ble.status === 'error' || ble.status === 'disconnected' ? 'bg-warn/10 text-warn ring-warn/40' : 'bg-accent/10 text-accent ring-accent/40',
                  )}
                >
                  <StatusIcon className="size-10" aria-hidden />
                </span>
              </div>
              <p className="font-display text-lg font-bold tracking-wide text-fg" aria-live="polite">
                {t(`ble.status.${ble.status}`)}
              </p>
              {ble.deviceName && <p className="mt-1 text-sm text-muted">{ble.deviceName}</p>}
              {!ble.deviceName && connected && <p className="mt-1 text-sm text-muted">{t('ble.unnamed')}</p>}

              {!supported ? (
                <div className="mt-5 w-full rounded-2xl border border-warn/35 bg-warn/[0.07] px-4 py-3 text-left text-sm">
                  <p className="flex items-center gap-2 font-semibold text-warn">
                    <TriangleAlert className="size-4" /> {ble.support === 'insecure' ? t('ble.insecure.title') : t('ble.unsupported.title')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{ble.support === 'insecure' ? t('ble.insecure.text') : t('ble.unsupported.text')}</p>
                </div>
              ) : (
                <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
                  {!connected && (
                    <Button variant="primary" size="lg" icon={BluetoothSearching} loading={busy} onClick={() => void ble.scan()}>
                      {ble.status === 'disconnected' || ble.status === 'error' ? t('ble.scanAgain') : t('ble.scan')}
                    </Button>
                  )}
                  {(ble.status === 'disconnected' || ble.status === 'idle') && ble.deviceName !== null && (
                    <Button size="lg" icon={RefreshCw} onClick={() => void ble.reconnect()}>
                      {t('ble.reconnect')}
                    </Button>
                  )}
                  {connected && (
                    <>
                      <Button size="lg" icon={RefreshCw} onClick={() => void ble.refresh()}>
                        {t('ble.refresh')}
                      </Button>
                      <Button size="lg" variant="danger" icon={Unplug} onClick={ble.disconnect}>
                        {t('ble.disconnect')}
                      </Button>
                    </>
                  )}
                </div>
              )}
              {ble.error && ble.status !== 'connected' && (
                <div className="mt-4 w-full rounded-2xl border border-danger/35 bg-danger/[0.07] px-4 py-3 text-left">
                  <p className="flex items-center gap-2 text-sm font-semibold text-danger">
                    <CircleX className="size-4" /> {t(`ble.error.${ble.error}`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{t(`ble.error.${ble.error}.help`)}</p>
                </div>
              )}
            </div>
          </Card>

          <Card title={t('ble.data.title')} icon={Cpu} actions={ble.lastRead ? <span className="text-xs text-subtle">{t('ble.data.lastRead', { time: time(ble.lastRead) })}</span> : undefined}>
            {!ble.result ? (
              <p className="text-sm text-muted">{t('ble.data.none')}</p>
            ) : (
              <div className="space-y-4">
                {!connected && (
                  <p className="rounded-xl border border-warn/35 bg-warn/[0.07] px-3 py-2 text-xs font-medium text-warn">{t('ble.data.stale')}</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ['battery', 'Battery Service · 0x180F'],
                    ['deviceInfo', 'Device Information · 0x180A'],
                  ] as const).map(([key, label]) => {
                    const ok = ble.result?.services[key];
                    return (
                      <div key={key} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs', ok ? 'border-ok/35 bg-ok/[0.06] text-ok' : 'border-line bg-base-2/50 text-muted')}>
                        {ok ? <Check className="size-4" /> : <CircleX className="size-4" />}
                        <span className="font-mono">{label}</span>
                      </div>
                    );
                  })}
                </div>
                {anyService ? (
                  <dl className="divide-y divide-line/70 rounded-xl border border-line/80 px-3">
                    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <dt className="flex items-center gap-2 text-muted">
                        <BatteryMedium className="size-4" /> {t('ble.data.battery')}
                      </dt>
                      <dd className="font-semibold text-fg">{ble.result.battery !== null ? `${ble.result.battery}%` : t('ble.data.notReadable')}</dd>
                    </div>
                    {INFO_FIELDS.map((f) => (
                      <div key={f} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <dt className="text-muted">{t(`ble.info.${f}`)}</dt>
                        <dd className="truncate font-medium text-fg">{ble.result?.info[f] ?? '–'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="rounded-xl border border-warn/35 bg-warn/[0.07] px-3.5 py-3 text-xs leading-relaxed text-muted">
                    <p className="mb-1 font-semibold text-warn">{t('ble.data.noServices')}</p>
                    {t('ble.data.noServicesText')}
                  </div>
                )}
                <p className="text-[11px] text-subtle">{t('ble.data.readOnly')}</p>
              </div>
            )}
          </Card>

          <Card
            title={t('ble.log.title')}
            icon={ScrollText}
            actions={
              ble.log.length > 0 && (
                <Button size="sm" variant="ghost" icon={Eraser} onClick={ble.clearLog}>
                  {t('ble.log.clear')}
                </Button>
              )
            }
          >
            {ble.log.length === 0 ? (
              <p className="text-sm text-muted">{t('ble.log.empty')}</p>
            ) : (
              <ol className="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
                {ble.log.map((entry) => (
                  <li key={entry.id} className="flex gap-3 rounded-lg px-2 py-1 odd:bg-base-2/50">
                    <span className="shrink-0 text-subtle">{time(entry.time)}</span>
                    <span className={cn(entry.event === 'error' ? 'text-danger' : entry.event === 'connected' || entry.event === 'read-done' ? 'text-ok' : 'text-fg')}>
                      {t(`ble.log.${entry.event}`)}
                      {entry.detail && entry.event !== 'error' && <span className="text-muted"> · {entry.detail}</span>}
                      {entry.detail && entry.event === 'error' && <span className="text-muted"> · {t(`ble.error.${entry.detail as 'unknown'}`)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title={t('ble.safety.title')} icon={ShieldCheck} actions={<Badge tone="ok">{t('ble.safety.badge')}</Badge>}>
            <ul className="space-y-2.5 text-sm">
              {(['noWrite', 'noCommands', 'noLimits', 'standardOnly', 'local'] as const).map((k) => (
                <li key={k} className="flex gap-2.5 text-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                  {t(`ble.safety.${k}`)}
                </li>
              ))}
            </ul>
          </Card>

          <Card title={t('ble.tips.title')} icon={ListChecks}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted marker:text-accent">
              {(['browser', 'officialApp', 'nearby', 'select', 'permission'] as const).map((k) => (
                <li key={k}>{t(`ble.tips.${k}`)}</li>
              ))}
            </ol>
          </Card>

          <Card title={t('compat.title')} icon={ShieldCheck}>
            <CompatMatrix />
          </Card>
        </div>
      </div>
    </div>
  );
}
