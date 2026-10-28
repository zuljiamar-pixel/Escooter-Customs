import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/cn';

type ToastTone = 'success' | 'error' | 'info' | 'warn';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

type ToastFn = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ToastFn | null>(null);

const ICONS = { success: CircleCheck, error: CircleX, info: Info, warn: TriangleAlert };
const TONES: Record<ToastTone, string> = {
  success: 'text-ok',
  error: 'text-danger',
  info: 'text-accent',
  warn: 'text-warn',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastFn>(
    (message, tone = 'success') => {
      nextId.current += 1;
      const id = nextId.current;
      setItems((list) => [...list.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6"
          role="status"
          aria-live="polite"
        >
          {items.map((item) => {
            const Icon = ICONS[item.tone];
            return (
              <div key={item.id} className="glass-strong pointer-events-auto flex w-full max-w-sm animate-pop-in items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl">
                <Icon className={cn('mt-0.5 size-5 shrink-0', TONES[item.tone])} aria-hidden />
                <p className="flex-1 text-sm text-fg">{item.message}</p>
                <button type="button" onClick={() => dismiss(item.id)} className="text-subtle hover:text-fg" aria-label="OK">
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
