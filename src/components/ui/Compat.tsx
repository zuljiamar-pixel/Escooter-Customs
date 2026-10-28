import { useState } from 'react';
import { Ban, BadgeCheck, Eye, Info, MonitorSmartphone, ShieldOff, type LucideIcon } from 'lucide-react';
import { COMPAT_ITEMS, type CompatItem } from '../../data/compat';
import { useI18n, type TKey } from '../../i18n';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { Modal } from './Modal';

type Level = CompatItem['level'];

const LEVEL_META: Record<Level, { icon: LucideIcon; tone: string; label: TKey; text: TKey }> = {
  app: { icon: MonitorSmartphone, tone: 'text-accent bg-accent/10 ring-accent/30', label: 'compat.level.app', text: 'compat.level.app.text' },
  official: { icon: BadgeCheck, tone: 'text-ok bg-ok/10 ring-ok/30', label: 'compat.level.official', text: 'compat.level.official.text' },
  unsupported: { icon: Ban, tone: 'text-warn bg-warn/10 ring-warn/30', label: 'compat.level.unsupported', text: 'compat.level.unsupported.text' },
  excluded: { icon: ShieldOff, tone: 'text-danger bg-danger/10 ring-danger/30', label: 'compat.level.excluded', text: 'compat.level.excluded.text' },
};

export function CompatBadge({ level, className }: { level: Level; className?: string }) {
  const { t } = useI18n();
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', meta.tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {t(meta.label)}
    </span>
  );
}

/** Deutlicher Hinweis: Das Design ist eine Vorschau und wird nicht auf den Scooter übertragen. */
export function PreviewNotice({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/[0.07] text-sm',
          compact ? 'px-3 py-2' : 'px-4 py-3',
          className,
        )}
        role="note"
      >
        <Eye className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-warn">{t('compat.preview.title')}</p>
          {!compact && <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('compat.preview.text')}</p>}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-xs font-semibold text-warn underline-offset-2 hover:underline">
          {t('compat.details')}
        </button>
      </div>
      <CompatDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CompatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('compat.title')} size="lg" closeLabel={t('common.close')} footer={<Button variant="primary" onClick={onClose}>{t('common.understood')}</Button>}>
      <CompatMatrix />
    </Modal>
  );
}

/** Übersicht in drei (plus eine ausgeschlossene) Kategorien. */
export function CompatMatrix({ className }: { className?: string }) {
  const { t, l } = useI18n();
  const levels: Level[] = ['app', 'official', 'unsupported', 'excluded'];
  return (
    <div className={cn('space-y-5', className)}>
      <p className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {t('compat.intro')}
      </p>
      {levels.map((level, index) => {
        const meta = LEVEL_META[level];
        const Icon = meta.icon;
        const items = COMPAT_ITEMS.filter((i) => i.level === level);
        return (
          <section key={level}>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn('grid size-7 place-items-center rounded-lg ring-1 ring-inset', meta.tone)}>
                <Icon className="size-4" aria-hidden />
              </span>
              <h3 className="text-sm font-semibold text-fg">
                {level !== 'excluded' && <span className="mr-1 text-subtle">{index + 1}.</span>}
                {t(meta.label)}
              </h3>
            </div>
            <p className="mb-2 text-xs text-subtle">{t(meta.text)}</p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-line/80 bg-base-2/50 px-3.5 py-2.5">
                  <p className="text-sm font-medium text-fg">{l(item.title)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{l(item.detail)}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
