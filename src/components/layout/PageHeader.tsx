import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30 sm:grid">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-wide text-fg sm:text-[28px]">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
