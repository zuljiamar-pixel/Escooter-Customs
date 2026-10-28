import { useEffect, useRef, type CSSProperties } from 'react';
import { Zap } from 'lucide-react';
import type { SplashAnimation } from '../store/types';

interface SplashProps {
  animation: Exclude<SplashAnimation, 'none'>;
  onDone: () => void;
  skipLabel: string;
}

const DURATION = 2200;

/** Startanimation der App (nicht des Scooters). Antippen überspringt sie. */
export function Splash({ animation, onDone, skipLabel }: SplashProps) {
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const id = window.setTimeout(() => done.current(), DURATION + 350);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] grid cursor-pointer place-items-center overflow-hidden bg-base"
      style={{ animation: `splash-out 0.35s ease ${DURATION}ms forwards` }}
      onClick={() => done.current()}
      role="presentation"
    >
      <div className="app-backdrop" />
      {animation === 'neon-scan' && (
        <div
          className="absolute inset-x-0 top-1/2 h-0.5 bg-accent shadow-[0_0_30px_6px_var(--ui-accent)]"
          style={{ animation: 'splash-scanline 1.4s cubic-bezier(.6,0,.4,1) 0.1s both' }}
        />
      )}
      {animation === 'pulse' &&
        [0, 0.35, 0.7].map((d) => (
          <span
            key={d}
            className="absolute size-40 rounded-full border-2 border-accent"
            style={{ animation: `splash-ring 1.6s ease-out ${d}s both`, boxShadow: '0 0 30px var(--ui-accent)' }}
          />
        ))}
      {animation === 'hyperdrive' &&
        Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 h-px w-40 origin-left bg-gradient-to-r from-transparent to-accent"
            style={{ ['--a' as string]: `${(i * 360) / 28}deg`, animation: `splash-line 1.1s cubic-bezier(.5,0,.8,.4) ${(i % 7) * 0.08}s both` } as CSSProperties}
          />
        ))}
      <div className="relative flex flex-col items-center gap-5 text-center">
        <span
          className="grid size-24 place-items-center rounded-3xl bg-base-2 ring-1 ring-accent/50 shadow-[0_0_60px_-10px_var(--ui-accent)]"
          style={{ animation: 'splash-mark 0.7s cubic-bezier(.2,.9,.3,1.2) 0.15s both' }}
        >
          <Zap className="size-12 fill-accent text-accent" aria-hidden />
        </span>
        <div className="relative">
          <p className="font-display text-3xl font-black tracking-[0.18em] text-fg sm:text-4xl" style={{ animation: 'splash-reveal 0.9s cubic-bezier(.2,.8,.2,1) 0.45s both' }}>
            ESCOOTER
          </p>
          {animation === 'glitch' && (
            <>
              <p aria-hidden className="absolute inset-x-0 top-0 font-display text-3xl font-black tracking-[0.18em] text-[#ff2d55] mix-blend-screen sm:text-4xl" style={{ animation: 'splash-glitch 0.6s steps(2) 0.5s 3 both' }}>
                ESCOOTER
              </p>
              <p aria-hidden className="absolute inset-x-0 top-0 font-display text-3xl font-black tracking-[0.18em] text-accent mix-blend-screen sm:text-4xl" style={{ animation: 'splash-glitch 0.5s steps(2) 0.6s 3 reverse both' }}>
                ESCOOTER
              </p>
            </>
          )}
          <p className="neon-text mt-2 font-display text-sm font-semibold tracking-[0.5em]" style={{ animation: 'splash-reveal 0.9s cubic-bezier(.2,.8,.2,1) 0.75s both' }}>
            CUSTOMIZER PRO
          </p>
        </div>
      </div>
      <p className="absolute bottom-[max(env(safe-area-inset-bottom),1.5rem)] text-xs text-subtle">{skipLabel}</p>
    </div>
  );
}
