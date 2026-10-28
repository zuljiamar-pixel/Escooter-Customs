import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { withAlpha } from '../../lib/color';
import type { ModelId } from '../../store/types';

interface DisplayMockupProps {
  model: ModelId;
  children: ReactNode;
  accent: string;
  className?: string;
  /** Lenker hinter dem Gehäuse zeigen */
  handlebar?: boolean;
}

/**
 * Stilisierte Cockpit-Ansicht (Draufsicht) mit modellspezifischem Gehäuse.
 * Bewusst ohne Herstellerlogos – keine Originalgrafik.
 */
export function DisplayMockup({ model, children, accent, className, handlebar = true }: DisplayMockupProps) {
  const isG3 = model === 'max-g3';
  return (
    <div className={cn('relative mx-auto w-full', className)}>
      {handlebar && (
        <div
          aria-hidden
          className={cn('absolute left-1/2 -translate-x-1/2 rounded-full', isG3 ? 'top-[30%] h-[15%] w-[124%]' : 'top-[33%] h-[11%] w-[120%]')}
          style={{
            background: 'linear-gradient(180deg, #3a414d 0%, #1b1f26 45%, #0b0d11 100%)',
            maskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
          }}
        />
      )}
      <div
        className={cn(
          'relative',
          isG3 ? 'rounded-[2.2rem] px-[7%] pt-[6%] pb-[13%]' : 'rounded-[2.6rem_2.6rem_3.6rem_3.6rem] px-[8.5%] pt-[7%] pb-[12%]',
        )}
        style={{
          background: isG3
            ? 'linear-gradient(165deg, #2a2f38 0%, #14171d 38%, #08090c 100%)'
            : 'linear-gradient(175deg, #2d323b 0%, #15181e 45%, #090a0d 100%)',
          boxShadow: `0 30px 60px -25px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 6px rgba(0,0,0,0.6), 0 0 60px -20px ${withAlpha(accent, 0.45)}`,
        }}
      >
        {/* Glanzkante */}
        <div aria-hidden className={cn('pointer-events-none absolute top-[3%] h-px', isG3 ? 'inset-x-[8%]' : 'inset-x-[14%]')} style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} />
        <div
          className={cn('relative overflow-hidden p-[1.6%]', isG3 ? 'rounded-[1.1rem]' : 'rounded-[1.5rem]')}
          style={{ background: '#000', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 2px 10px rgba(0,0,0,0.9)' }}
        >
          <div className={cn('overflow-hidden', isG3 ? 'rounded-[0.8rem]' : 'rounded-[1.2rem]')}>{children}</div>
        </div>
        {/* Bedientaste */}
        <div aria-hidden className="absolute bottom-[3.5%] left-1/2 flex -translate-x-1/2 items-center gap-[0.6rem]">
          {isG3 ? (
            <span
              className="block size-[clamp(14px,3.4vw,22px)] rounded-full"
              style={{ background: 'radial-gradient(circle at 35% 30%, #3b414c, #111318)', boxShadow: `0 0 0 2px ${withAlpha(accent, 0.75)}, 0 0 12px ${withAlpha(accent, 0.6)}` }}
            />
          ) : (
            <span
              className="block h-[clamp(9px,2vw,13px)] w-[clamp(30px,8vw,48px)] rounded-full"
              style={{ background: 'linear-gradient(180deg, #353a44, #111318)', boxShadow: `0 0 0 1.5px ${withAlpha(accent, 0.7)}, 0 0 12px ${withAlpha(accent, 0.5)}` }}
            />
          )}
        </div>
        <span aria-hidden className="absolute bottom-[4%] left-[9%] font-tech text-[clamp(7px,1.4vw,10px)] font-semibold tracking-[0.3em] text-white/25">
          {isG3 ? 'MAX G3' : 'F3 PRO'}
        </span>
      </div>
    </div>
  );
}
