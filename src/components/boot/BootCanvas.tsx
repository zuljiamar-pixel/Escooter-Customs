import { useEffect, useRef, useState } from 'react';
import { BOOT_HOLD, ensureBootFonts, loadBootAssets, NO_ASSETS, releaseBootAssets, renderBootFrame, type BootAssets } from '../../lib/bootRenderer';
import { seekVideo } from '../../lib/mediaStore';
import { cn } from '../../lib/cn';
import { screenOf } from '../../data/scooters';
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
  /** In einer einheitlichen 4:3-Kachel zeigen (Hochformat steht mittig) */
  tile?: boolean;
  /** Meldet, ob ein gewähltes eigenes Video auf diesem Gerät fehlt */
  onMediaMissing?: (missing: boolean) => void;
}

export function BootCanvas({ design, playing = false, loop = true, restartKey = 0, seek = null, onTime, className, label, tile = false, onMediaMissing }: BootCanvasProps) {
  const portrait = screenOf(design.model) === 'portrait';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<BootAssets>(NO_ASSETS);
  const [fontsReady, setFontsReady] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const startRef = useRef(performance.now());
  const restartRef = useRef(restartKey);
  const onTimeRef = useRef(onTime);
  onTimeRef.current = onTime;
  const missingRef = useRef(onMediaMissing);
  missingRef.current = onMediaMissing;

  const mediaKey = design.media ? `${design.media.kind}:${design.media.src}` : '';

  // Logo und eigenes Bild/Video laden (Logo wird bei Bedarf eingefärbt)
  useEffect(() => {
    let cancelled = false;
    let loaded: BootAssets | null = null;
    void loadBootAssets(design).then((a) => {
      if (cancelled) return releaseBootAssets(a);
      loaded = a;
      setAssets(a);
      missingRef.current?.(!!design.media && !a.media);
    });
    return () => {
      cancelled = true;
      if (loaded) releaseBootAssets(loaded);
    };
    // Nur bei anderem Logo, anderer Leuchtfarbe oder anderem Bild/Video neu laden
  }, [design.logo, design.glowColor, mediaKey]);

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
    const draw = (t: number) => renderBootFrame(ctx, design, t, size.w, size.h, assets);
    const video = assets.media instanceof HTMLVideoElement ? assets.media : null;
    const restarted = restartRef.current !== restartKey;
    restartRef.current = restartKey;

    // Standbild oder Scrubbing
    if (seek !== null || !playing) {
      const at = seek ?? design.duration;
      draw(at);
      if (!video) return;
      video.pause();
      let cancelled = false;
      void seekVideo(video, at).then(() => !cancelled && draw(at));
      return () => {
        cancelled = true;
      };
    }

    let raf = 0;
    let lastReport = 0;
    const report = (now: number, t: number, force = false) => {
      if (force || now - lastReport > 80) {
        lastReport = now;
        onTimeRef.current?.(t);
      }
    };

    // Eigenes Video: seine Abspielposition ist die Zeitleiste
    if (video) {
      if (restarted || video.currentTime >= design.duration - 0.05 || video.ended) video.currentTime = 0;
      void video.play().catch(() => undefined);
      let endedAt: number | null = null;
      const frame = (now: number) => {
        const t = Math.min(video.currentTime, design.duration);
        draw(t);
        report(now, t);
        if (video.currentTime >= design.duration || video.ended) {
          video.pause();
          endedAt ??= now;
          if (!loop) return report(now, design.duration, true);
          if (now - endedAt > BOOT_HOLD * 1000) {
            endedAt = null;
            video.currentTime = 0;
            void video.play().catch(() => undefined);
          }
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(raf);
        video.pause();
      };
    }

    const cycle = design.duration + BOOT_HOLD;
    const frame = (now: number) => {
      let t = (now - startRef.current) / 1000;
      if (loop && t > cycle) {
        startRef.current = now;
        t = 0;
      }
      const shown = Math.min(t, design.duration);
      draw(shown);
      report(now, shown);
      if (loop || t < design.duration) raf = requestAnimationFrame(frame);
      else onTimeRef.current?.(design.duration);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [design, assets, size, playing, loop, seek, fontsReady, restartKey]);

  // Das Boot-Logo hat dasselbe Seitenverhältnis wie das Display des Modells.
  const canvas = (
    <div
      ref={wrapRef}
      className={cn('relative overflow-hidden bg-black', portrait ? 'aspect-[3/4]' : 'aspect-[4/3]', tile && portrait ? 'h-full' : 'w-full', !tile && className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" role="img" aria-label={label} />
    </div>
  );
  if (!tile || !portrait) return canvas;
  return <div className={cn('grid aspect-[4/3] w-full place-items-center bg-black', className)}>{canvas}</div>;
}
