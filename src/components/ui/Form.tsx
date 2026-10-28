import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  className?: string;
}

export function Slider({ label, value, min, max, step = 1, onChange, format, className }: SliderProps) {
  const id = useId();
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className={className}>
      <div className="mb-0.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-fg tabular-nums">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  label?: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Segmented<T extends string>({ label, options, value, onChange, className, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className={className}>
      {label && <div className="mb-1.5 text-sm text-muted">{label}</div>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-2xl border border-line bg-base-2/70 p-1">
        {options.map((o) => {
          const active = o.value === value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-200',
                size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
                active ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-accent)_45%,transparent)]' : 'text-muted hover:text-fg',
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
              <span className="truncate">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SwitchProps {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: LucideIcon;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, icon: Icon, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-4 py-2', disabled && 'opacity-50')}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <Icon className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />}
        <div className="min-w-0">
          <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-fg">
            {label}
          </label>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300',
          checked ? 'border-accent/60 bg-accent/25 shadow-[0_0_16px_-4px_var(--ui-accent)]' : 'border-line bg-elevated',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-all duration-300',
            checked ? 'left-[calc(100%-1.4rem)] bg-accent' : 'left-1 bg-subtle',
          )}
        />
      </button>
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string | null;
  showCount?: boolean;
}

export function TextField({ label, value, onChange, hint, error, showCount, maxLength, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        {showCount && maxLength && (
          <span className="font-mono text-[11px] text-subtle">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          'h-11 w-full rounded-xl border bg-base-2/70 px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent/70 focus:ring-2 focus:ring-accent/20',
          error ? 'border-danger/60' : 'border-line',
        )}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

export function Select<T extends string>({ label, value, options, onChange, className }: SelectProps<T>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-base-2/70 px-3.5 pr-9 text-sm text-fg outline-none focus:border-accent/70"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-panel text-fg">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </div>
  );
}
