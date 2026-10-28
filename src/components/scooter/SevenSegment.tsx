import { memo } from 'react';

const W = 50;
const H = 90;
const T = 9;
const G = 1.6;
const M = T / 2;
const SPACING = 12;

const horiz = (y: number, x1: number, x2: number) =>
  `${x1},${y} ${x1 + M},${y - M} ${x2 - M},${y - M} ${x2},${y} ${x2 - M},${y + M} ${x1 + M},${y + M}`;
const vert = (x: number, y1: number, y2: number) =>
  `${x},${y1} ${x + M},${y1 + M} ${x + M},${y2 - M} ${x},${y2} ${x - M},${y2 - M} ${x - M},${y1 + M}`;

const L = M;
const R = W - M;
const TOP = M;
const MID = H / 2;
const BOT = H - M;

const SEGMENTS = {
  a: horiz(TOP, L + G, R - G),
  b: vert(R, TOP + G, MID - G),
  c: vert(R, MID + G, BOT - G),
  d: horiz(BOT, L + G, R - G),
  e: vert(L, MID + G, BOT - G),
  f: vert(L, TOP + G, MID - G),
  g: horiz(MID, L + G, R - G),
} as const;

type Seg = keyof typeof SEGMENTS;
const ALL: Seg[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

const DIGITS: Record<string, Seg[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ALL,
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

interface SevenSegmentProps {
  value: string;
  color: string;
  /** Deckkraft nicht leuchtender Segmente (realistischer LCD-Look) */
  ghost?: number;
  height: string;
  glow?: string;
}

/** Siebensegment-Anzeige als SVG; skaliert verlustfrei mit der Displaygröße. */
export const SevenSegment = memo(function SevenSegment({ value, color, ghost = 0.08, height, glow }: SevenSegmentProps) {
  const chars = value.split('');
  const width = chars.length * W + (chars.length - 1) * SPACING + 8;
  return (
    <svg
      viewBox={`-4 0 ${width} ${H}`}
      style={{ height, width: 'auto', overflow: 'visible', filter: glow }}
      aria-hidden
    >
      <g transform="skewX(-7) translate(6 0)">
        {chars.map((ch, i) => {
          const lit = new Set(DIGITS[ch] ?? []);
          return (
            <g key={i} transform={`translate(${i * (W + SPACING)} 0)`}>
              {ALL.map((seg) => (
                <polygon key={seg} points={SEGMENTS[seg]} fill={color} opacity={lit.has(seg) ? 1 : ghost} />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
});
