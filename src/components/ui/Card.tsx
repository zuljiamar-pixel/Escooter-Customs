import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  neon?: boolean;
  padded?: boolean;
  as?: 'section' | 'div' | 'article';
}

export function Card({ title, subtitle, icon: Icon, actions, neon, padded = true, as: Tag = 'section', className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn('glass relative rounded-[var(--radius-card)]', neon && 'neon-border', padded && 'p-4 sm:p-5', className)} {...rest}>
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/25">
                <Icon className="size-[18px]" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="truncate text-[15px] font-semibold tracking-tight text-fg">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle', className)}>{children}</h3>;
}

type Tone = 'accent' | 'ok' | 'warn' | 'danger' | 'muted';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/12 text-accent ring-accent/30',
  ok: 'bg-ok/12 text-ok ring-ok/30',
  warn: 'bg-warn/12 text-warn ring-warn/30',
  danger: 'bg-danger/12 text-danger ring-danger/30',
  muted: 'bg-elevated text-muted ring-line',
};

export function Badge({ tone = 'muted', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/25">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
