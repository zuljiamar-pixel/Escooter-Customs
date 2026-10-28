import { useId } from 'react';
import type { ModelId } from '../../store/types';
import { withAlpha } from '../../lib/color';
import { cn } from '../../lib/cn';

interface Props {
  model: ModelId;
  accent: string;
  className?: string;
  animated?: boolean;
}

/** Stilisierte Seitenansicht als Linienzeichnung (keine Originalgrafik). */
export function ScooterIllustration({ model, accent, className, animated }: Props) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = `sc${raw}`;
  const g3 = model === 'max-g3';
  const wheelR = g3 ? 47 : 42;
  const frontX = 330;
  const rearX = 78;
  const groundY = 262;
  const wheelY = groundY - wheelR;
  const deckTop = g3 ? 196 : 202;
  const deckH = g3 ? 22 : 16;
  const stemTopX = 300;
  const stemTopY = 38;
  const stemW = g3 ? 13 : 10;

  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy={wheelY} r={wheelR} fill="#07090d" stroke={withAlpha(accent, 0.9)} strokeWidth="3" />
      <circle cx={cx} cy={wheelY} r={wheelR - 9} fill="none" stroke="#1d232d" strokeWidth="8" />
      <circle cx={cx} cy={wheelY} r={wheelR - 16} fill={`url(#${id}-rim)`} stroke={withAlpha(accent, 0.35)} strokeWidth="1.2" />
      <g className={animated ? 'origin-center animate-spin-slow' : undefined} style={{ transformOrigin: `${cx}px ${wheelY}px`, transformBox: 'view-box' }}>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * 72 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * 7}
              y1={wheelY + Math.sin(a) * 7}
              x2={cx + Math.cos(a) * (wheelR - 18)}
              y2={wheelY + Math.sin(a) * (wheelR - 18)}
              stroke={withAlpha(accent, 0.55)}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle cx={cx} cy={wheelY} r="6" fill="#0b0e13" stroke={accent} strokeWidth="2" />
    </g>
  );

  return (
    <svg viewBox="0 0 410 290" className={cn('h-auto w-full', className)} role="img" aria-label={g3 ? 'MAX G3' : 'F3 Pro'}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a313c" />
          <stop offset="1" stopColor="#0b0e13" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop offset="0" stopColor="#1a202a" />
          <stop offset="1" stopColor="#0a0d12" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="205" cy={groundY + 8} rx="190" ry="9" fill={withAlpha(accent, 0.18)} />

      {/* Hinterrad-Schutzblech */}
      <path d={`M ${rearX - wheelR - 6} ${wheelY - 2} A ${wheelR + 8} ${wheelR + 8} 0 0 1 ${rearX + wheelR * 0.65} ${wheelY - wheelR - 2}`} fill="none" stroke="#2a313c" strokeWidth="7" strokeLinecap="round" />
      <rect x={rearX - wheelR - 10} y={wheelY - 8} width="7" height="5" rx="2" fill="#ff3b3b" filter={`url(#${id}-glow)`} />

      {/* Trittbrett */}
      <path
        d={`M ${rearX + 10} ${deckTop} L ${frontX - 62} ${deckTop} Q ${frontX - 44} ${deckTop} ${frontX - 40} ${deckTop + deckH * 0.6} L ${frontX - 46} ${deckTop + deckH} L ${rearX + 18} ${deckTop + deckH} Q ${rearX + 6} ${deckTop + deckH} ${rearX + 10} ${deckTop} Z`}
        fill={`url(#${id}-body)`}
        stroke={withAlpha(accent, 0.5)}
        strokeWidth="1.5"
      />
      <line x1={rearX + 30} y1={deckTop + deckH + 0.5} x2={frontX - 70} y2={deckTop + deckH + 0.5} stroke={accent} strokeWidth="2" filter={`url(#${id}-glow)`} opacity="0.9" />
      <path d={`M ${rearX + 14} ${deckTop + 3} L ${rearX - 2} ${wheelY}`} stroke="#2a313c" strokeWidth="10" strokeLinecap="round" />

      {/* Lenksäule */}
      <path d={`M ${frontX - 46} ${deckTop + 6} L ${stemTopX - 6} ${stemTopY + 60}`} stroke="#1e242e" strokeWidth={stemW + 6} strokeLinecap="round" />
      <path d={`M ${frontX} ${wheelY} L ${stemTopX} ${stemTopY}`} stroke={`url(#${id}-body)`} strokeWidth={stemW + 4} strokeLinecap="round" />
      <path d={`M ${frontX} ${wheelY} L ${stemTopX} ${stemTopY}`} stroke={withAlpha(accent, 0.6)} strokeWidth="1.4" strokeLinecap="round" />
      {g3 && (
        <g stroke={withAlpha(accent, 0.8)} strokeWidth="2" fill="none">
          {Array.from({ length: 5 }, (_, i) => {
            const t = 0.12 + i * 0.045;
            const x = frontX + (stemTopX - frontX) * t;
            const y = wheelY + (stemTopY - wheelY) * t;
            return <line key={i} x1={x - 9} y1={y - 2} x2={x + 9} y2={y + 2} />;
          })}
        </g>
      )}
      {/* Vorderlicht */}
      <circle cx={stemTopX + 10} cy={stemTopY + 70} r={g3 ? 7 : 6} fill="#fff" filter={`url(#${id}-glow)`} />
      <path d={`M ${stemTopX + 16} ${stemTopY + 64} L 408 ${stemTopY + 40} L 408 ${stemTopY + 102} Z`} fill={withAlpha('#ffffff', 0.06)} />

      {/* Lenker & Display */}
      <path d={`M ${stemTopX - 34} ${stemTopY - 2} L ${stemTopX + 30} ${stemTopY + 2}`} stroke="#2a313c" strokeWidth="9" strokeLinecap="round" />
      <rect x={stemTopX - 16} y={stemTopY - 12} width="30" height="13" rx="4" fill="#07090d" stroke={accent} strokeWidth="1.5" filter={`url(#${id}-glow)`} />
      <rect x={stemTopX - 12} y={stemTopY - 9} width="22" height="7" rx="2" fill={withAlpha(accent, 0.55)} />

      {/* Vorderes Schutzblech */}
      <path d={`M ${frontX - wheelR * 0.8} ${wheelY - wheelR * 0.62} A ${wheelR + 7} ${wheelR + 7} 0 0 1 ${frontX + wheelR + 4} ${wheelY - 6}`} fill="none" stroke="#2a313c" strokeWidth="7" strokeLinecap="round" />

      {wheel(rearX)}
      {wheel(frontX)}
    </svg>
  );
}
