import { memo, useEffect, useId, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { mix, withAlpha } from '../../lib/color';
import { cn } from '../../lib/cn';
import { formatDistance, formatSpeed, speedUnit, distanceUnit } from '../../lib/units';
import type { DisplayTheme, ElementId, FontId, LayoutElement, PreviewValues, Units } from '../../store/types';
import { SevenSegment } from './SevenSegment';

export const FONT_FAMILIES: Record<FontId, string> = {
  segment: "'Share Tech Mono', ui-monospace, monospace",
  orbitron: "'Orbitron', sans-serif",
  rajdhani: "'Rajdhani', sans-serif",
  mono: "'Share Tech Mono', ui-monospace, monospace",
  audiowide: "'Audiowide', sans-serif",
  clean: "'Space Grotesk Variable', system-ui, sans-serif",
};

const SPEED_WEIGHT: Record<FontId, number> = { segment: 400, orbitron: 900, rajdhani: 700, mono: 400, audiowide: 400, clean: 700 };

const MODE_LABEL = { eco: 'ECO', drive: 'D', sport: 'S' } as const;

export interface DisplayScreenProps {
  theme: DisplayTheme;
  layout: LayoutElement[];
  values: PreviewValues;
  units: Units;
  clock24h: boolean;
  animated?: boolean;
  /** Akkuwert, der tatsächlich vom Gerät gelesen wurde (überschreibt den Vorschauwert) */
  liveBattery?: number | null;
  editor?: {
    selectedId: ElementId | null;
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>, id: ElementId) => void;
    showGrid: boolean;
  };
  className?: string;
  label?: string;
}

function backgroundFor(theme: DisplayTheme): CSSProperties {
  const { background: bg, accent, primary } = theme;
  switch (theme.backgroundStyle) {
    case 'gradient':
      return {
        background: `radial-gradient(120% 90% at 50% 18%, ${mix(bg, accent, 0.22)} 0%, ${bg} 62%), ${bg}`,
      };
    case 'grid':
      return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(90% 70% at 50% 40%, transparent 30%, ${withAlpha(bg, 0.9)} 100%), linear-gradient(${withAlpha(primary, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(primary, 0.07)} 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 8cqh 8cqh, 8cqh 8cqh',
      };
    case 'carbon':
      return {
        backgroundColor: bg,
        backgroundImage: `linear-gradient(27deg, ${mix(bg, '#ffffff', 0.05)} 5px, transparent 5px), linear-gradient(207deg, ${mix(bg, '#ffffff', 0.05)} 5px, transparent 5px), linear-gradient(27deg, ${mix(bg, '#000000', 0.4)} 5px, transparent 5px), linear-gradient(207deg, ${mix(bg, '#000000', 0.4)} 5px, transparent 5px), linear-gradient(90deg, ${mix(bg, '#ffffff', 0.03)} 10px, transparent 10px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 5px, 10px 0, 0 10px, 10px 5px, 0 0',
      };
    default:
      return { background: bg };
  }
}

function useClock(enabled: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

function HeadlightIcon({ on, color }: { on: boolean; color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ height: '7.5cqh', width: 'auto', overflow: 'visible' }} aria-hidden>
      <path d="M13 5c4.5 0 8 3.1 8 7s-3.5 7-8 7c-1 0-1.6-.9-1.6-2V7c0-1.1.6-2 1.6-2Z" fill={on ? color : 'none'} stroke={color} strokeWidth="1.8" />
      {[7, 10.5, 14, 17.5].map((y) => (
        <path key={y} d={`M2.5 ${y - 1.2} L8.5 ${y}`} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function BluetoothIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ height: '7cqh', width: 'auto' }} aria-hidden>
      <path d="m7 7 10 10-5 5V2l5 5L7 17" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Gauge({ fraction, primary, accent }: { fraction: number; primary: string; accent: string }) {
  const id = 'gauge' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75;
  const arc = circumference * sweep;
  const ticks = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg viewBox="0 0 100 100" style={{ height: '82cqh', width: '82cqh', overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={primary} />
        </linearGradient>
      </defs>
      <g transform="rotate(135 50 50)">
        <circle cx="50" cy="50" r={r} fill="none" stroke={withAlpha(primary, 0.12)} strokeWidth="5" strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth="5"
          strokeDasharray={`${arc * fraction} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </g>
      {ticks.map((i) => {
        const a = ((135 + (270 * i) / 10) * Math.PI) / 180;
        const r1 = i % 5 === 0 ? 31 : 33.5;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * r1}
            y1={50 + Math.sin(a) * r1}
            x2={50 + Math.cos(a) * 36}
            y2={50 + Math.sin(a) * 36}
            stroke={withAlpha(primary, i / 10 <= fraction ? 0.85 : 0.25)}
            strokeWidth={i % 5 === 0 ? 1.6 : 1}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function Battery({ level, accent, primary, font }: { level: number; accent: string; primary: string; font: string }) {
  const low = level <= 20;
  const color = low ? '#ff3b3b' : accent;
  const lit = Math.ceil(level / 10);
  return (
    <div className="flex items-center" style={{ gap: '2cqh', width: '58cqw' }}>
      <div className="flex flex-1 items-center" style={{ gap: '0.9cqh', height: '5.5cqh', padding: '0.8cqh', border: `0.45cqh solid ${withAlpha(color, 0.55)}`, borderRadius: '1.4cqh' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-full flex-1"
            style={{
              borderRadius: '0.5cqh',
              background: i < lit ? color : withAlpha(color, 0.1),
              boxShadow: i < lit ? `0 0 1.6cqh ${withAlpha(color, 0.6)}` : undefined,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontFamily: font, fontSize: '6cqh', color: low ? color : primary, minWidth: '13cqh', textAlign: 'right', fontWeight: 600 }}>
        {Math.round(level)}%
      </span>
    </div>
  );
}

function DisplayScreenInner({ theme, layout, values, units, clock24h, animated = true, liveBattery, editor, className, label }: DisplayScreenProps) {
  const visible = layout.filter((e) => e.visible);
  const now = useClock(visible.some((e) => e.id === 'clock'));
  const { primary, accent, glow } = theme;
  const font = FONT_FAMILIES[theme.font];
  const g = glow / 100;
  const glowText = g > 0 ? `0 0 ${(1.2 * g).toFixed(2)}cqh ${withAlpha(primary, 0.9)}, 0 0 ${(5 * g).toFixed(2)}cqh ${withAlpha(primary, 0.55)}` : 'none';
  const glowFilter = g > 0 ? `drop-shadow(0 0 ${(1.6 * g).toFixed(2)}cqh ${withAlpha(primary, 0.85)}) drop-shadow(0 0 ${(4 * g).toFixed(2)}cqh ${withAlpha(primary, 0.4)})` : undefined;
  const accentGlow = g > 0 ? `0 0 ${(2.5 * g).toFixed(2)}cqh ${withAlpha(accent, 0.7)}` : 'none';
  const speed = formatSpeed(values.speed, units);
  const battery = liveBattery ?? values.battery;
  const speedFraction = Math.min(1, values.speed / 25);

  const renderElement = (el: LayoutElement): ReactNode => {
    switch (el.id) {
      case 'speed':
        return theme.font === 'segment' ? (
          <SevenSegment value={String(speed).padStart(2, ' ')} color={primary} height="36cqh" glow={glowFilter} />
        ) : (
          <span style={{ fontFamily: font, fontWeight: SPEED_WEIGHT[theme.font], fontSize: '44cqh', lineHeight: 0.9, color: primary, textShadow: glowText, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {speed}
          </span>
        );
      case 'unit':
        return (
          <span style={{ fontFamily: font, fontSize: '6.2cqh', color: accent, letterSpacing: '0.18em', fontWeight: 600, textShadow: accentGlow }}>
            {speedUnit(units).toUpperCase()}
          </span>
        );
      case 'gauge':
        return <Gauge fraction={speedFraction} primary={primary} accent={accent} />;
      case 'battery':
        return <Battery level={battery} accent={accent} primary={primary} font={font} />;
      case 'mode':
        return (
          <span
            style={{
              fontFamily: font,
              fontSize: '6.8cqh',
              fontWeight: 700,
              color: values.mode === 'sport' ? '#ffffff' : primary,
              background: values.mode === 'sport' ? accent : withAlpha(accent, 0.12),
              border: `0.45cqh solid ${accent}`,
              borderRadius: '1.6cqh',
              padding: '0.6cqh 2.2cqh',
              boxShadow: accentGlow,
              letterSpacing: '0.08em',
            }}
          >
            {MODE_LABEL[values.mode]}
          </span>
        );
      case 'trip':
        return (
          <span className="flex flex-col items-center" style={{ fontFamily: font, lineHeight: 1.05 }}>
            <span style={{ fontSize: '3.8cqh', color: accent, letterSpacing: '0.2em', fontWeight: 600 }}>TRIP</span>
            <span style={{ fontSize: '6.2cqh', color: primary, fontWeight: 600, textShadow: g > 0.4 ? glowText : undefined }}>
              {formatDistance(values.trip, units)}
              <span style={{ fontSize: '3.6cqh', marginLeft: '0.8cqh', color: withAlpha(primary, 0.7) }}>{distanceUnit(units)}</span>
            </span>
          </span>
        );
      case 'light':
        return (
          <span style={{ opacity: values.light ? 1 : 0.22, filter: values.light && g > 0 ? `drop-shadow(0 0 ${(2 * g).toFixed(2)}cqh ${accent})` : undefined }}>
            <HeadlightIcon on={values.light} color={values.light ? accent : primary} />
          </span>
        );
      case 'bluetooth':
        return (
          <span style={{ opacity: values.bluetooth ? 1 : 0.22, filter: values.bluetooth && g > 0 ? `drop-shadow(0 0 ${(2 * g).toFixed(2)}cqh ${accent})` : undefined }}>
            <BluetoothIcon color={values.bluetooth ? accent : primary} />
          </span>
        );
      case 'clock':
        return (
          <span style={{ fontFamily: font, fontSize: '6cqh', color: primary, fontWeight: 600, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
            {now.toLocaleTimeString(clock24h ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !clock24h })}
          </span>
        );
    }
  };

  return (
    <div className={cn('display-screen select-none', className)} style={backgroundFor(theme)} role="img" aria-label={label}>
      {editor?.showGrid && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${withAlpha(accent, 0.18)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(accent, 0.18)} 1px, transparent 1px)`,
            backgroundSize: '10% 10%',
          }}
        />
      )}
      {visible.map((el) => {
        const selected = editor?.selectedId === el.id;
        return (
          <div
            key={el.id}
            data-element={el.id}
            onPointerDown={editor ? (e) => editor.onPointerDown(e, el.id) : undefined}
            className={cn(
              'absolute flex items-center justify-center whitespace-nowrap',
              editor && 'cursor-grab touch-none rounded-[1cqh] active:cursor-grabbing',
              editor && (selected ? 'outline-2 outline-offset-[0.8cqh] outline-dashed' : 'hover:outline-1 hover:outline-offset-[0.8cqh] hover:outline-dashed'),
            )}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              transform: `translate(-50%, -50%) scale(${el.scale})`,
              outlineColor: editor ? (selected ? accent : withAlpha(accent, 0.5)) : undefined,
              transition: editor ? 'none' : 'left 0.45s cubic-bezier(.2,.8,.2,1), top 0.45s cubic-bezier(.2,.8,.2,1), transform 0.45s cubic-bezier(.2,.8,.2,1)',
              zIndex: el.id === 'gauge' ? 0 : 1,
            }}
          >
            {renderElement(el)}
          </div>
        );
      })}
      {animated && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 animate-scan" style={{ background: `linear-gradient(180deg, transparent, ${withAlpha(primary, 0.05)}, transparent)` }} />
      )}
      <div className="display-pixels" />
      <div className="display-reflection" />
    </div>
  );
}

export const DisplayScreen = memo(DisplayScreenInner);
