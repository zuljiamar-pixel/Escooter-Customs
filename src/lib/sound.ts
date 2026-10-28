import type { SoundPack } from '../store/types';

export type SoundName = 'tap' | 'toggle' | 'success' | 'error' | 'startup' | 'whoosh';

interface Tone {
  freq: number;
  to?: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

const PACK_WAVE: Record<SoundPack, OscillatorType> = { neon: 'triangle', soft: 'sine', retro: 'square' };
const PACK_GAIN: Record<SoundPack, number> = { neon: 0.22, soft: 0.28, retro: 0.08 };

const SOUNDS: Record<SoundName, Tone[]> = {
  tap: [{ freq: 880, to: 1100, start: 0, dur: 0.05 }],
  toggle: [
    { freq: 620, start: 0, dur: 0.05 },
    { freq: 930, start: 0.05, dur: 0.06 },
  ],
  success: [
    { freq: 660, start: 0, dur: 0.09 },
    { freq: 880, start: 0.08, dur: 0.09 },
    { freq: 1320, start: 0.16, dur: 0.16 },
  ],
  error: [
    { freq: 300, to: 220, start: 0, dur: 0.14 },
    { freq: 220, to: 160, start: 0.13, dur: 0.18 },
  ],
  startup: [
    { freq: 180, to: 720, start: 0, dur: 0.55, type: 'sawtooth', gain: 0.5 },
    { freq: 720, start: 0.5, dur: 0.12 },
    { freq: 1080, start: 0.6, dur: 0.3 },
  ],
  whoosh: [{ freq: 1400, to: 260, start: 0, dur: 0.32, type: 'sine', gain: 0.8 }],
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private failed = false;

  private context(): AudioContext | null {
    if (this.failed) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        this.failed = true;
        return null;
      }
      try {
        this.ctx = new Ctor();
      } catch {
        this.failed = true;
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  play(name: SoundName, pack: SoundPack, volume: number) {
    if (volume <= 0) return;
    const ctx = this.context();
    if (!ctx) return;
    const now = ctx.currentTime + 0.005;
    const master = ctx.createGain();
    master.gain.value = Math.min(1, volume) * PACK_GAIN[pack];
    master.connect(ctx.destination);
    for (const tone of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = tone.type && pack !== 'retro' ? tone.type : PACK_WAVE[pack];
      const t0 = now + tone.start;
      osc.frequency.setValueAtTime(tone.freq, t0);
      if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, t0 + tone.dur);
      const peak = tone.gain ?? 1;
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
      osc.connect(env).connect(master);
      osc.start(t0);
      osc.stop(t0 + tone.dur + 0.03);
    }
    window.setTimeout(() => master.disconnect(), 1500);
  }
}

export const soundEngine = new SoundEngine();
