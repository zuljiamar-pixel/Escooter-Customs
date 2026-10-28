import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp, hsvToRgb, type HSV } from '../../lib/color';

interface ColorWheelProps {
  hsv: HSV;
  onChange: (hsv: HSV) => void;
  onCommit?: () => void;
  size?: number;
  label: string;
}

const wheelCache = new Map<number, string>();

/** Rendert die Farbscheibe einmalig pro Größe und cached sie als Data-URL. */
function wheelImage(px: number): string {
  const cached = wheelCache.get(px);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(px, px);
  const r = px / 2;
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const dx = x - r + 0.5;
      const dy = y - r + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (y * px + x) * 4;
      if (dist > r) continue;
      const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const { r: cr, g, b } = hsvToRgb({ h, s: Math.min(1, dist / r), v: 1 });
      img.data[i] = cr;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      // Weiche Kante
      img.data[i + 3] = dist > r - 1.5 ? Math.round(255 * (r - dist) / 1.5) : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  wheelCache.set(px, url);
  return url;
}

export function ColorWheel({ hsv, onChange, onCommit, size = 240, label }: ColorWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const px = Math.round(size * Math.min(2, window.devicePixelRatio || 1));
    if (imgRef.current) imgRef.current.src = wheelImage(px);
  }, [size]);

  const update = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const r = rect.width / 2;
    const dx = clientX - rect.left - r;
    const dy = clientY - rect.top - r;
    const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const s = clamp(Math.sqrt(dx * dx + dy * dy) / r, 0, 1);
    onChange({ h, s, v: hsv.v === 0 ? 1 : hsv.v });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX, e.clientY);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) update(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onCommit?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    let next: HSV | null = null;
    if (e.key === 'ArrowLeft') next = { ...hsv, h: (hsv.h - step + 360) % 360 };
    if (e.key === 'ArrowRight') next = { ...hsv, h: (hsv.h + step) % 360 };
    if (e.key === 'ArrowUp') next = { ...hsv, s: clamp(hsv.s + step / 100, 0, 1) };
    if (e.key === 'ArrowDown') next = { ...hsv, s: clamp(hsv.s - step / 100, 0, 1) };
    if (next) {
      e.preventDefault();
      onChange(next);
    }
  };

  const angle = (hsv.h * Math.PI) / 180;
  const markerX = 50 + Math.cos(angle) * hsv.s * 50;
  const markerY = 50 + Math.sin(angle) * hsv.s * 50;
  const { r, g, b } = hsvToRgb(hsv);

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hsv.h)}
      aria-valuetext={`H ${Math.round(hsv.h)}°, S ${Math.round(hsv.s * 100)}%`}
      className="relative mx-auto aspect-square touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base"
      style={{ width: '100%', maxWidth: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <img ref={imgRef} alt="" draggable={false} className="pointer-events-none size-full rounded-full" />
      <div className="pointer-events-none absolute inset-0 rounded-full bg-black" style={{ opacity: 1 - hsv.v }} />
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 40px -6px rgb(${r} ${g} ${b} / 0.7), inset 0 0 0 1px rgba(255,255,255,0.08)` }}
      />
      <span
        className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)]"
        style={{ left: `${markerX}%`, top: `${markerY}%`, background: `rgb(${r} ${g} ${b})` }}
      />
    </div>
  );
}
