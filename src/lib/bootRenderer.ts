import type { BootDesign, BootEmblem } from '../store/types';
import { withAlpha } from './color';

export const BOOT_FONTS: Record<BootDesign['font'], { family: string; weight: number }> = {
  orbitron: { family: 'Orbitron', weight: 900 },
  rajdhani: { family: 'Rajdhani', weight: 700 },
  mono: { family: 'Share Tech Mono', weight: 400 },
  audiowide: { family: 'Audiowide', weight: 400 },
  clean: { family: 'Space Grotesk Variable', weight: 700 },
};

/** Zeit nach Ende der Animation, bevor die Vorschau neu startet */
export const BOOT_HOLD = 1.1;

export interface BootAssets {
  logo: HTMLImageElement | null;
  /** In Leuchtfarbe eingefärbtes Logo (bei logoTint) */
  tinted: HTMLCanvasElement | null;
}

export const fontSpec = (design: BootDesign, px: number) => {
  const f = BOOT_FONTS[design.font];
  return `${f.weight} ${Math.round(px)}px '${f.family}', sans-serif`;
};

export async function ensureBootFonts(design: BootDesign): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await Promise.all([document.fonts.load(fontSpec(design, 48), design.title || 'A'), document.fonts.load(fontSpec(design, 20), design.subtitle || 'A')]);
  } catch {
    // Fallback-Schrift wird verwendet
  }
}

export function createTintedLogo(img: HTMLImageElement, color: string): HTMLCanvasElement | null {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || 256;
  c.height = img.naturalHeight || 256;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) ** 3;
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
/** Lokaler Fortschritt eines Abschnitts der Zeitleiste */
const segment = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

function drawBackground(ctx: CanvasRenderingContext2D, d: BootDesign, w: number, h: number, t: number, fade: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = fade;
  if (d.backgroundStyle === 'radial') {
    const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.75);
    g.addColorStop(0, d.background2);
    g.addColorStop(1, d.background);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = d.background;
    ctx.fillRect(0, 0, w, h);
  }
  if (d.backgroundStyle === 'grid') {
    // Synthwave-Boden mit Fluchtpunkt
    const horizon = h * 0.64;
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, withAlpha(d.background2, 0));
    g.addColorStop(1, withAlpha(d.background2, 0.9));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.strokeStyle = withAlpha(d.glowColor, 0.35);
    ctx.lineWidth = Math.max(1, w / 640);
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * w * 0.02, horizon);
      ctx.lineTo(w / 2 + i * w * 0.16, h);
      ctx.stroke();
    }
    const offset = (t * 0.6) % 1;
    for (let i = 0; i < 9; i++) {
      const k = (i + offset) / 9;
      const y = horizon + (h - horizon) * k * k;
      ctx.globalAlpha = fade * k;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = fade;
    const glowLine = ctx.createLinearGradient(0, 0, w, 0);
    glowLine.addColorStop(0, withAlpha(d.glowColor, 0));
    glowLine.addColorStop(0.5, withAlpha(d.glowColor, 0.8));
    glowLine.addColorStop(1, withAlpha(d.glowColor, 0));
    ctx.fillStyle = glowLine;
    ctx.fillRect(0, horizon - 1, w, Math.max(2, h / 240));
  }
  ctx.globalAlpha = 1;
}

function emblemPath(ctx: CanvasRenderingContext2D, emblem: BootEmblem, cx: number, cy: number, s: number) {
  const r = s / 2;
  ctx.beginPath();
  switch (emblem) {
    case 'bolt':
      ctx.moveTo(cx + r * 0.18, cy - r);
      ctx.lineTo(cx - r * 0.55, cy + r * 0.12);
      ctx.lineTo(cx - r * 0.02, cy + r * 0.12);
      ctx.lineTo(cx - r * 0.2, cy + r);
      ctx.lineTo(cx + r * 0.58, cy - r * 0.16);
      ctx.lineTo(cx + r * 0.04, cy - r * 0.16);
      ctx.closePath();
      break;
    case 'ring':
      ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
      ctx.moveTo(cx + r * 0.58, cy);
      ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2, true);
      break;
    case 'wing':
      for (const dir of [-1, 1]) {
        ctx.moveTo(cx + dir * r * 0.08, cy - r * 0.35);
        ctx.lineTo(cx + dir * r, cy - r * 0.62);
        ctx.lineTo(cx + dir * r * 0.72, cy - r * 0.18);
        ctx.lineTo(cx + dir * r * 0.86, cy - r * 0.1);
        ctx.lineTo(cx + dir * r * 0.5, cy + r * 0.22);
        ctx.lineTo(cx + dir * r * 0.62, cy + r * 0.28);
        ctx.lineTo(cx + dir * r * 0.08, cy + r * 0.62);
        ctx.closePath();
      }
      break;
    case 'hex':
      for (let i = 0; i <= 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      for (let i = 6; i >= 0; i--) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = cx + Math.cos(a) * r * 0.7;
        const y = cy + Math.sin(a) * r * 0.7;
        if (i === 6) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    case 'none':
      break;
  }
}

/** Zeichnet Logo oder Emblem zentriert in eine quadratische Box der Größe s. */
function drawMark(ctx: CanvasRenderingContext2D, d: BootDesign, assets: BootAssets, cx: number, cy: number, s: number, blur: number, colorOverride?: string) {
  ctx.shadowColor = colorOverride ?? d.glowColor;
  ctx.shadowBlur = blur;
  const source = d.logoTint && assets.tinted ? assets.tinted : assets.logo;
  if (source && d.logo) {
    const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    const k = Math.min(s / (sw || 1), s / (sh || 1));
    const dw = sw * k;
    const dh = sh * k;
    if (colorOverride) {
      // Farbversatz (Glitch): Silhouette in Kanalfarbe
      ctx.globalCompositeOperation = 'lighter';
    }
    ctx.drawImage(source, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
  } else if (d.emblem !== 'none') {
    emblemPath(ctx, d.emblem, cx, cy, s);
    ctx.fillStyle = colorOverride ?? d.glowColor;
    ctx.fill('evenodd');
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1, s / 90);
    ctx.strokeStyle = withAlpha('#ffffff', colorOverride ? 0 : 0.55);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function hasMark(d: BootDesign, assets: BootAssets) {
  return (!!d.logo && !!assets.logo) || d.emblem !== 'none';
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  return total;
}

/**
 * Rendert einen Frame des Startbildschirms.
 * @param time Sekunden seit Start der Animation
 */
export function renderBootFrame(ctx: CanvasRenderingContext2D, d: BootDesign, time: number, w: number, h: number, assets: BootAssets) {
  const p = clamp01(time / d.duration);
  const unit = Math.min(w, h);
  const glow = (d.glow / 100) * unit * 0.09;
  const mark = hasMark(d, assets);
  const portrait = h > w * 1.2;
  const cy = mark ? h * (portrait ? 0.42 : 0.4) : h * 0.48;
  const cx = w / 2;
  const size = unit * 0.72 * d.logoScale;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, d, w, h, time, easeOut(segment(p, 0, 0.14)));

  // Effekt-Intro für Logo/Emblem
  const e = easeOut(segment(p, 0.1, 0.58));
  if (mark) {
    ctx.save();
    switch (d.effect) {
      case 'fade': {
        ctx.globalAlpha = e;
        const k = 0.82 + 0.18 * e;
        drawMark(ctx, d, assets, cx, cy, size * k, glow);
        break;
      }
      case 'pulse': {
        ctx.globalAlpha = e;
        const beat = 0.55 + 0.45 * Math.sin(time * 4.2) ** 2;
        const k = 0.9 + 0.1 * e + (e >= 1 ? 0.025 * Math.sin(time * 4.2) : 0);
        for (let i = 0; i < 3; i++) {
          const rp = ((time * 0.7 + i / 3) % 1) * e;
          ctx.strokeStyle = withAlpha(d.glowColor, (1 - rp) * 0.5);
          ctx.lineWidth = unit * 0.006;
          ctx.beginPath();
          ctx.arc(cx, cy, size * (0.45 + rp * 0.6), 0, Math.PI * 2);
          ctx.stroke();
        }
        drawMark(ctx, d, assets, cx, cy, size * k, glow * (0.6 + beat * 0.8));
        break;
      }
      case 'scan': {
        const top = cy - size / 2 - unit * 0.02;
        const edge = top + (size + unit * 0.04) * e;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, edge);
        ctx.clip();
        drawMark(ctx, d, assets, cx, cy, size, glow);
        ctx.restore();
        if (e < 1) {
          const line = ctx.createLinearGradient(cx - size, 0, cx + size, 0);
          line.addColorStop(0, withAlpha(d.glowColor, 0));
          line.addColorStop(0.5, d.glowColor);
          line.addColorStop(1, withAlpha(d.glowColor, 0));
          ctx.shadowColor = d.glowColor;
          ctx.shadowBlur = glow;
          ctx.fillStyle = line;
          ctx.fillRect(cx - size, edge - unit * 0.004, size * 2, unit * 0.008);
        }
        break;
      }
      case 'glitch': {
        const unstable = 1 - segment(p, 0.35, 0.62);
        const r = rng(Math.floor(time * 18) + 7);
        const jitter = unstable * unit * 0.03;
        ctx.globalAlpha = Math.min(1, e * 1.4) * (unstable > 0 && r() < 0.15 * unstable ? 0.35 : 1);
        if (unstable > 0.02) {
          drawMark(ctx, d, assets, cx - jitter * (r() + 0.3), cy + jitter * (r() - 0.5), size, 0, '#ff2d55');
          drawMark(ctx, d, assets, cx + jitter * (r() + 0.3), cy - jitter * (r() - 0.5), size, 0, '#00e5ff');
        }
        drawMark(ctx, d, assets, cx + jitter * (r() - 0.5), cy, size, glow);
        if (unstable > 0.02) {
          ctx.fillStyle = withAlpha(d.background, 0.9);
          for (let i = 0; i < 4; i++) {
            if (r() < unstable) ctx.fillRect(cx - size, cy - size / 2 + r() * size, size * 2, unit * 0.012 * r());
          }
        }
        break;
      }
      case 'ring': {
        const ringR = size * 0.68;
        ctx.strokeStyle = d.glowColor;
        ctx.lineWidth = unit * 0.008;
        ctx.lineCap = 'round';
        ctx.shadowColor = d.glowColor;
        ctx.shadowBlur = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = unit * 0.003;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR * 1.1, Math.PI / 2, Math.PI / 2 + Math.PI * 2 * e);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = segment(e, 0.45, 1);
        drawMark(ctx, d, assets, cx, cy, size * 0.78, glow);
        break;
      }
      case 'particles': {
        const r = rng(1337);
        const count = 110;
        const gather = easeInOut(segment(p, 0.05, 0.55));
        ctx.fillStyle = d.glowColor;
        ctx.shadowColor = d.glowColor;
        ctx.shadowBlur = glow * 0.5;
        for (let i = 0; i < count; i++) {
          const a0 = r() * Math.PI * 2;
          const d0 = unit * (0.6 + r() * 0.6);
          const a1 = r() * Math.PI * 2;
          const d1 = size * 0.5 * Math.sqrt(r());
          const x = cx + Math.cos(a0) * d0 * (1 - gather) + Math.cos(a1) * d1 * gather;
          const y = cy + Math.sin(a0) * d0 * (1 - gather) + Math.sin(a1) * d1 * gather;
          ctx.globalAlpha = (1 - segment(p, 0.5, 0.7)) * Math.min(1, gather * 3);
          ctx.beginPath();
          ctx.arc(x, y, unit * (0.003 + r() * 0.004), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = segment(p, 0.42, 0.62);
        drawMark(ctx, d, assets, cx, cy, size, glow);
        break;
      }
      case 'hyperdrive': {
        const r = rng(99);
        const burst = segment(p, 0.02, 0.5);
        ctx.lineCap = 'round';
        for (let i = 0; i < 70; i++) {
          const a = r() * Math.PI * 2;
          const speed = 0.4 + r() * 0.8;
          const start = ((burst * speed * 1.6 + r()) % 1) * unit * 0.9;
          const len = unit * 0.12 * speed * (1 - burst * 0.6);
          ctx.strokeStyle = withAlpha(i % 3 ? d.glowColor : '#ffffff', (1 - segment(p, 0.48, 0.66)) * 0.7);
          ctx.lineWidth = unit * 0.002 * (1 + speed);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * start, cy + Math.sin(a) * start);
          ctx.lineTo(cx + Math.cos(a) * (start + len), cy + Math.sin(a) * (start + len));
          ctx.stroke();
        }
        const k = 0.25 + 0.75 * e;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (e < 1 ? 0.18 : 0) * (4 - i) * 0.5;
          drawMark(ctx, d, assets, cx, cy, size * k * (1 - i * 0.08), 0);
        }
        ctx.globalAlpha = e;
        drawMark(ctx, d, assets, cx, cy, size * k, glow);
        break;
      }
    }
    ctx.restore();
  }

  // Text
  const titleP = easeOut(segment(p, 0.42, 0.68));
  const subP = easeOut(segment(p, 0.54, 0.8));
  const titleSize = unit * (portrait ? 0.11 : 0.12);
  const titleY = mark ? cy + size / 2 + unit * 0.13 : cy;
  ctx.textBaseline = 'middle';
  if (d.title) {
    ctx.save();
    ctx.font = fontSpec(d, titleSize);
    const width = Math.min(w * 0.94, ctx.measureText(d.title).width + titleSize * 0.15 * d.title.length);
    ctx.beginPath();
    ctx.rect(cx - (width / 2) * titleP - 2, 0, width * titleP + 4, h);
    ctx.clip();
    ctx.globalAlpha = titleP;
    ctx.fillStyle = d.textColor;
    ctx.shadowColor = d.glowColor;
    ctx.shadowBlur = glow * 0.8;
    drawSpaced(ctx, d.title, cx, titleY, titleSize * 0.12);
    ctx.restore();
  }
  if (d.subtitle) {
    ctx.save();
    ctx.font = fontSpec(d, titleSize * 0.36);
    ctx.globalAlpha = subP * 0.9;
    ctx.fillStyle = d.glowColor;
    ctx.shadowColor = d.glowColor;
    ctx.shadowBlur = glow * 0.5;
    drawSpaced(ctx, d.subtitle.toUpperCase(), cx, titleY + titleSize * 0.78 - (1 - subP) * unit * 0.02, titleSize * 0.36 * 0.42);
    ctx.restore();
  }

  // Fortschrittsbalken
  if (d.showProgress) {
    const bp = segment(p, 0.5, 1);
    const bw = w * (portrait ? 0.5 : 0.34);
    const bh = Math.max(3, unit * 0.011);
    const by = h * (portrait ? 0.84 : 0.88);
    ctx.globalAlpha = Math.min(1, segment(p, 0.45, 0.55) * 1.2);
    ctx.fillStyle = withAlpha(d.glowColor, 0.15);
    roundRect(ctx, cx - bw / 2, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = d.glowColor;
    ctx.shadowColor = d.glowColor;
    ctx.shadowBlur = glow * 0.6;
    roundRect(ctx, cx - bw / 2, by, Math.max(bh, bw * easeInOut(bp)), bh, bh / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Vignette und Display-Rasterlinien
  const v = ctx.createRadialGradient(cx, h / 2, unit * 0.3, cx, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  if (d.effect === 'scan' || d.effect === 'glitch') {
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    const step = Math.max(2, Math.round(h / 160));
    for (let y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function loadBootAssets(design: BootDesign): Promise<BootAssets> {
  if (!design.logo) return { logo: null, tinted: null };
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = design.logo as string;
  });
  return { logo: img, tinted: img ? createTintedLogo(img, design.glowColor) : null };
}

/** Exportiert einen Standbild-Frame (Endzustand) als PNG-Blob. */
export async function exportBootPng(design: BootDesign, width: number, height: number): Promise<Blob> {
  await ensureBootFonts(design);
  const assets = await loadBootAssets(design);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  renderBootFrame(ctx, design, design.duration, width, height, assets);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png'));
}

export function pickVideoMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

/** Nimmt die Animation in Echtzeit als Video auf (WebM bzw. MP4, je nach Browser). */
export async function exportBootVideo(design: BootDesign, width: number, height: number, onProgress?: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const mime = pickVideoMime();
  if (!mime) throw new Error('unsupported');
  await ensureBootFonts(design);
  const assets = await loadBootAssets(design);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) {
    canvas.remove();
    throw new Error('unsupported');
  }
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const total = design.duration + 0.6;

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      canvas.remove();
      resolve({ blob: new Blob(chunks, { type: mime.split(';')[0] }), ext: mime.includes('mp4') ? 'mp4' : 'webm' });
    };
    recorder.onerror = () => {
      canvas.remove();
      reject(new Error('recorder'));
    };
    renderBootFrame(ctx, design, 0, width, height, assets);
    recorder.start(250);
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      renderBootFrame(ctx, design, Math.min(t, design.duration), width, height, assets);
      onProgress?.(Math.min(1, t / total));
      if (t < total) requestAnimationFrame(tick);
      else recorder.stop();
    };
    requestAnimationFrame(tick);
  });
}
