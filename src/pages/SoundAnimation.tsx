import { ArrowRight, AudioWaveform, Clapperboard, Gauge, Music, Play, Power, Volume2, VolumeX, Zap } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { BootCanvas } from '../components/boot/BootCanvas';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { Badge, Card, SectionLabel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatBadge } from '../components/ui/Compat';
import { Segmented, Slider, Switch } from '../components/ui/Form';
import { useNav } from '../hooks/useNav';
import { useSound } from '../hooks/useSound';
import { useSplash } from '../hooks/useSplash';
import { useI18n } from '../i18n';
import { soundEngine, type SoundName } from '../lib/sound';
import { cn } from '../lib/cn';
import { useModel, useStore } from '../store/AppStore';
import type { SoundPack, SplashAnimation } from '../store/types';

const SPLASHES: SplashAnimation[] = ['neon-scan', 'pulse', 'hyperdrive', 'glitch', 'none'];
const SOUNDS: SoundName[] = ['tap', 'toggle', 'success', 'error', 'whoosh', 'startup'];

export function SoundAnimation() {
  const model = useModel();
  const { settings, updateSettings, bootDrafts } = useStore();
  const { t } = useI18n();
  const { navigate } = useNav();
  const play = useSound();
  const playSplash = useSplash();
  const systemReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="animate-page-in">
      <PageHeader icon={AudioWaveform} eyebrow={t('sound.eyebrow')} title={t('nav.sound')} subtitle={t('sound.subtitle')} badge={<CompatBadge level="app" />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t('sound.splash.title')} subtitle={t('sound.splash.subtitle')} icon={Clapperboard}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SPLASHES.map((s) => {
              const active = settings.splash === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    updateSettings({ splash: s });
                    play('toggle');
                  }}
                  aria-pressed={active}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition-all',
                    active ? 'border-accent/70 bg-accent/10 shadow-[0_0_20px_-8px_var(--ui-accent)]' : 'border-line bg-base-2/50 hover:border-accent/40',
                  )}
                >
                  <Zap className={cn('mb-2 size-5', active ? 'text-accent' : 'text-subtle')} aria-hidden />
                  <p className={cn('text-sm font-semibold', active ? 'text-accent' : 'text-fg')}>{t(`splash.${s}`)}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">{t(`splash.${s}.text`)}</p>
                </button>
              );
            })}
          </div>
          <Button className="mt-4" variant="primary" icon={Play} disabled={settings.splash === 'none'} onClick={() => settings.splash !== 'none' && playSplash(settings.splash)}>
            {t('sound.splash.preview')}
          </Button>
          {(settings.reducedMotion || systemReduced) && <p className="mt-3 text-xs text-warn">{t('sound.splash.reducedHint')}</p>}
        </Card>

        <Card
          title={t('sound.ui.title')}
          subtitle={t('sound.ui.subtitle')}
          icon={Music}
          actions={<Badge tone={settings.sounds ? 'ok' : 'muted'}>{settings.sounds ? t('common.on') : t('common.off')}</Badge>}
        >
          {!soundEngine.supported && <p className="mb-3 text-xs text-warn">{t('sound.unsupported')}</p>}
          <Switch
            icon={settings.sounds ? Volume2 : VolumeX}
            label={t('sound.enable')}
            description={t('sound.enable.text')}
            checked={settings.sounds}
            onChange={(sounds) => {
              updateSettings({ sounds });
              if (sounds) soundEngine.play('success', settings.soundPack, settings.volume);
            }}
          />
          <Segmented<SoundPack>
            className="mt-3"
            label={t('sound.pack')}
            value={settings.soundPack}
            onChange={(soundPack) => {
              updateSettings({ soundPack });
              soundEngine.play('toggle', soundPack, settings.volume);
            }}
            options={(['neon', 'soft', 'retro'] as SoundPack[]).map((p) => ({ value: p, label: t(`sound.pack.${p}`) }))}
          />
          <Slider
            className="mt-4"
            label={t('sound.volume')}
            value={Math.round(settings.volume * 100)}
            min={0}
            max={100}
            onChange={(v) => updateSettings({ volume: v / 100 })}
            format={(v) => `${v}%`}
          />
          <SectionLabel className="mt-5">{t('sound.test')}</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {SOUNDS.map((s) => (
              <Button key={s} size="sm" icon={Volume2} onClick={() => play(s, true)}>
                {t(`sound.name.${s}`)}
              </Button>
            ))}
          </div>
        </Card>

        <Card title={t('sound.motion.title')} icon={Gauge}>
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4">
            <LiveDisplay model={model} housing={false} className="ring-1 ring-fg/15" />
            <p className="text-xs leading-relaxed text-muted">{t('sound.motion.text')}</p>
          </div>
          <Switch label={t('sound.motion.display')} description={t('sound.motion.displayText')} checked={settings.displayAnimations} onChange={(displayAnimations) => updateSettings({ displayAnimations })} />
          <Switch label={t('sound.motion.reduce')} description={systemReduced ? t('sound.motion.systemOn') : t('sound.motion.reduceText')} checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
        </Card>

        <Card title={t('sound.boot.title')} subtitle={t('sound.boot.subtitle')} icon={Power}>
          <div className="overflow-hidden rounded-2xl ring-1 ring-fg/15">
            <BootCanvas design={bootDrafts[model].design} playing={!settings.reducedMotion} label={bootDrafts[model].design.name} />
          </div>
          <p className="mt-3 text-xs text-muted">
            {t('sound.boot.current', { name: bootDrafts[model].design.name, effect: t(`boot.effect.${bootDrafts[model].design.effect}`) })}
          </p>
          <Button className="mt-3" iconRight={ArrowRight} onClick={() => navigate('boot')}>
            {t('sound.boot.edit')}
          </Button>
        </Card>
      </div>
    </div>
  );
}
