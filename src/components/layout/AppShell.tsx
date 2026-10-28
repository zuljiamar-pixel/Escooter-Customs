import { useEffect, useState, type ReactNode } from 'react';
import { Bluetooth, BluetoothConnected, ChevronRight, Menu, X, Zap } from 'lucide-react';
import { SCOOTERS } from '../../data/scooters';
import { useNav } from '../../hooks/useNav';
import { useSound } from '../../hooks/useSound';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { useModel } from '../../store/AppStore';
import { useBluetooth, type BleStatus } from '../../store/BluetoothContext';
import { BOTTOM_ITEMS, NAV_GROUPS, NAV_ITEMS, type NavItem } from './navItems';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative grid size-10 shrink-0 place-items-center rounded-xl bg-base-2 ring-1 ring-accent/40', className)}>
      <span className="absolute inset-0 animate-glow-pulse rounded-xl shadow-[0_0_24px_-4px_var(--ui-accent)]" aria-hidden />
      <Zap className="relative size-5 fill-accent text-accent" aria-hidden />
    </span>
  );
}

function statusTone(status: BleStatus) {
  if (status === 'connected') return 'text-ok';
  if (status === 'error' || status === 'disconnected') return 'text-warn';
  if (status === 'idle') return 'text-subtle';
  return 'text-accent';
}

function ModelChip({ onClick }: { onClick: () => void }) {
  const model = useModel();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-base-2/60 px-3 py-2.5 text-left transition-colors hover:border-accent/50"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-accent/12 font-display text-[10px] font-bold text-accent">{model === 'max-g3' ? 'G3' : 'F3'}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-subtle">{t('shell.model')}</span>
        <span className="block truncate text-sm font-semibold text-fg">{SCOOTERS[model].short}</span>
      </span>
      <span className="text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">{t('shell.switch')}</span>
    </button>
  );
}

function NavLink({ item, active, onClick, compact }: { item: NavItem; active: boolean; onClick: () => void; compact?: boolean }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 font-medium transition-all duration-200',
        compact ? 'h-12 text-[15px]' : 'h-10 text-sm',
        active ? 'bg-accent/12 text-accent' : 'text-muted hover:bg-elevated/70 hover:text-fg',
      )}
    >
      {active && <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--ui-accent)]" aria-hidden />}
      <Icon className={cn('size-[18px] shrink-0 transition-transform', !active && 'group-hover:scale-110')} aria-hidden />
      <span className="truncate">{t(item.label)}</span>
      {compact && <ChevronRight className="ml-auto size-4 text-subtle" aria-hidden />}
    </button>
  );
}

function ConnectionPill({ onClick }: { onClick: () => void }) {
  const { status, deviceName } = useBluetooth();
  const { t } = useI18n();
  const Icon = status === 'connected' ? BluetoothConnected : Bluetooth;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-base-2/60 px-3 py-2.5 text-left transition-colors hover:border-accent/50">
      <Icon className={cn('size-5 shrink-0', statusTone(status))} aria-hidden />
      <span className="min-w-0">
        <span className="block text-[11px] text-subtle">{t('shell.connection')}</span>
        <span className={cn('block truncate text-sm font-medium', statusTone(status))}>
          {status === 'connected' && deviceName ? deviceName : t(`ble.status.${status}`)}
        </span>
      </span>
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate } = useNav();
  const { t } = useI18n();
  const play = useSound();
  const { status } = useBluetooth();
  const model = useModel();
  const [moreOpen, setMoreOpen] = useState(false);

  const go = (id: NavItem['id'] | 'select') => {
    play('tap');
    setMoreOpen(false);
    navigate(id);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const moreActive = !BOTTOM_ITEMS.includes(route as NavItem['id']);
  const ConnIcon = status === 'connected' ? BluetoothConnected : Bluetooth;

  return (
    <div className="relative z-10 min-h-dvh lg:pl-72">
      {/* Seitenleiste (Desktop) */}
      <aside className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-y-0 border-l-0 lg:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <BrandMark />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-[13px] font-bold tracking-[0.14em] text-fg">ESCOOTER</p>
            <p className="font-display text-[10px] font-semibold tracking-[0.22em] text-accent">CUSTOMIZER PRO</p>
          </div>
        </div>
        <div className="px-4">
          <ModelChip onClick={() => go('select')} />
        </div>
        <nav className="no-scrollbar mt-4 flex-1 space-y-5 overflow-y-auto px-4 pb-4" aria-label={t('nav.main')}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">{t(group.label)}</p>
              <div className="space-y-0.5">
                {group.items.map((id) => (
                  <NavLink key={id} item={NAV_ITEMS[id]} active={route === id} onClick={() => go(id)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line/70 p-4">
          <ConnectionPill onClick={() => go('connect')} />
        </div>
      </aside>

      {/* Kopfzeile (Mobil) */}
      <header className="glass-strong sticky top-0 z-30 flex items-center gap-3 border-x-0 border-t-0 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 lg:hidden">
        <BrandMark className="size-9" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-fg">ESCOOTER</p>
          <p className="font-display text-[9px] font-semibold tracking-[0.2em] text-accent">CUSTOMIZER PRO</p>
        </div>
        <button
          type="button"
          onClick={() => go('select')}
          className="rounded-xl border border-line bg-base-2/60 px-3 py-1.5 font-display text-[10px] font-bold tracking-wider text-accent"
          aria-label={t('shell.switchModel')}
        >
          {SCOOTERS[model].short}
        </button>
        <button type="button" onClick={() => go('connect')} className="grid size-9 place-items-center rounded-xl border border-line bg-base-2/60" aria-label={t('nav.connect')}>
          <ConnIcon className={cn('size-[18px]', statusTone(status))} />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1400px] overflow-x-clip px-4 pt-5 pb-32 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">{children}</main>

      {/* Untere Navigation (Mobil) */}
      <nav className="glass-strong pb-safe fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 lg:hidden" aria-label={t('nav.main')}>
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1.5 pb-1.5">
          {BOTTOM_ITEMS.map((id) => {
            const item = NAV_ITEMS[id];
            const Icon = item.icon;
            const active = route === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors', active ? 'text-accent' : 'text-subtle')}
              >
                <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-all', active && 'bg-accent/15 shadow-[0_0_18px_-4px_var(--ui-accent)]')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {t(item.short)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              play('tap');
              setMoreOpen(true);
            }}
            aria-expanded={moreOpen}
            className={cn('flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium', moreActive ? 'text-accent' : 'text-subtle')}
          >
            <span className={cn('grid h-7 w-12 place-items-center rounded-full', moreActive && 'bg-accent/15')}>
              <Menu className="size-5" aria-hidden />
            </span>
            {t('nav.more')}
          </button>
        </div>
      </nav>

      {/* Mehr-Sheet (Mobil) */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.more')}>
          <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} aria-hidden />
          <div className="glass-strong pb-safe absolute inset-x-0 bottom-0 max-h-[85dvh] animate-slide-up overflow-y-auto rounded-t-3xl px-4 pt-3">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden />
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="font-display text-sm font-bold tracking-wider text-fg">{t('nav.allAreas')}</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="grid size-9 place-items-center rounded-xl text-muted hover:text-fg" aria-label={t('common.close')}>
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-3">
              <ModelChip onClick={() => go('select')} />
            </div>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">{t(group.label)}</p>
                {group.items.map((id) => (
                  <NavLink key={id} item={NAV_ITEMS[id]} active={route === id} onClick={() => go(id)} compact />
                ))}
              </div>
            ))}
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
