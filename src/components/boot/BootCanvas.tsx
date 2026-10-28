import { useEffect, useRef, useState } from 'react';
import { BOOT_HOLD, ensureBootFonts, loadBootAssets, renderBootFrame, type BootAssets } from '../../lib/bootRenderer';
import { cn } from '../../lib/cn';
import type { BootDesign } from '../../store/types';

interface BootCanvasProps {
  design: BootDesign;
  /** Live-Animation; sonst wird ein Standbild des Endzustands gezeigt */
  playing?: boolean;
  loop?: boolean;
  /** Wird bei jeder Änderung neu gestartet */
  restartKey?: number;
  /** Feste Zeit in Sekunden (Scrubbing); überschreibt die Animation */
  seek?: number | null;
  onTime?: (seconds: number) => void;
  className?: string;
  label?: string;
}

export function BootCanvas({ design, playing = false, loop = true, restartKey = 0, seek = null, onTime, className, label }: BootCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<BootAssets>({ logo: null, tinted: null });
  const [fontsReady, setFontsReady] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const startRef = useRef(performance.now());
  const onTimeRef = useRef(onTime);
  onTimeRef.current = onTime;

  // Logo laden und einfärben
  useEffect(() => {
    let cancelled = false;
    void loadBootAssets(design).then((a) => !cancelled && setAssets(a));
    return () => {
      cancelled = true;
    };
  }, [design.logo, design.glowColor]);

  useEffect(() => {
    let cancelled = false;
    void ensureBootFonts(design).then(() => !cancelled && setFontsReady((n) => n + 1));
    return () => {
      cancelled = true;
    };
  }, [design.font, design.title, design.subtitle]);

  // Größe beobachten (scharfe Darstellung bei jeder Auflösung)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      setSize({ w: Math.round(entry.contentRect.width * dpr), h: Math.round(entry.contentRect.height * dpr) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    startRef.current = performance.now();
  }, [restartKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !size.w || !size.h) return;
    canvas.width = size.w;
    canvas.height = size.h;

    if (seek !== null || !playing) {
      renderBootFrame(ctx, design, seek ?? design.duration, size.w, size.h, assets);
      return;
    }

    let raf = 0;
    let lastReport = 0;
    const cycle = design.duration + BOOT_HOLD;
    const frame = (now: number) => {
      let t = (now - startRef.current) / 1000;
      if (loop && t > cycle) {
        startRef.current = now;
        t = 0;
      }
      const shown = Math.min(t, design.duration);
      renderBootFrame(ctx, design, shown, size.w, size.h, assets);
      if (now - lastReport > 80) {
        lastReport = now;
        onTimeRef.current?.(shown);
      }
      if (loop || t < design.duration) raf = requestAnimationFrame(frame);
      else onTimeRef.current?.(design.duration);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [design, assets, size, playing, loop, seek, fontsReady, restartKey]);

  return (
    <div ref={wrapRef} className={cn('relative aspect-[4/3] w-full overflow-hidden bg-black', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" role="img" aria-label={label} />
    </div>
  );
}
