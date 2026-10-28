import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  AudioWaveform,
  Clock,
  Database,
  Download,
  Info,
  Languages,
  Laptop,
  Moon,
  Palette,
  Ruler,
  Settings as SettingsIcon,
  Sun,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ImportButton } from '../components/ImportButton';
import { ColorField } from '../components/color/ColorPicker';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Segmented, Switch } from '../components/ui/Form';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { SCOOTERS } from '../data/scooters';
import { useNav } from '../hooks/useNav';
import { useI18n } from '../i18n';
import { downloadJson } from '../lib/download';
import { storageUsage } from '../lib/storage';
import { DEFAULT_ACCENT } from '../store/defaults';
import { useModel, useStore } from '../store/AppStore';
import type { Lang, UiTheme, Units } from '../store/types';

const APP_VERSION = '1.0.0';

export function Settings() {
  const model = useModel();
  const store = useStore();
  const { settings, updateSettings, savedThemes, bootDesigns } = store;
  const { t } = useI18n();
  const { navigate } = useNav();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setUsage(storageUsage()), 400);
    return () => window.clearTimeout(id);
  }, [savedThemes, bootDesigns, settings]);

  return (
    <div className="animate-page-in">
      <PageHeader icon={SettingsIcon} eyebrow={t('settings.eyebrow')} title={t('nav.settings')} subtitle={t('settings.subtitle')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t('settings.general')} icon={Languages}>
          <div className="space-y-4">
            <Segmented<Lang>
              label={t('settings.language')}
              value={settings.language}
              onChange={(language) => updateSettings({ language })}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'English' },
              ]}
            />
            <Segmented<UiTheme>
              label={t('settings.theme')}
              value={settings.uiTheme}
              onChange={(uiTheme) => updateSettings({ uiTheme })}
              options={[
                { value: 'dark', label: t('settings.theme.dark'), icon: Moon },
                { value: 'light', label: t('settings.theme.light'), icon: Sun },
                { value: 'system', label: t('settings.theme.system'), icon: Laptop },
              ]}
            />
          </div>
        </Card>

        <Card title={t('settings.units')} icon={Ruler}>
          <Segmented<Units>
            label={t('settings.units.label')}
            value={settings.units}
            onChange={(units) => updateSettings({ units })}
            options={[
              { value: 'metric', label: t('settings.units.metric') },
              { value: 'imperial', label: t('settings.units.imperial') },
            ]}
          />
          <div className="mt-3">
            <Switch icon={Clock} label={t('settings.clock24')} description={t('settings.clock24.text')} checked={settings.clock24h} onChange={(clock24h) => updateSettings({ clock24h })} />
          </div>
        </Card>

        <Card
          title={t('settings.accent')}
          subtitle={t('settings.accent.text')}
          icon={Palette}
          actions={
            settings.uiAccent !== DEFAULT_ACCENT && (
              <Button size="sm" variant="ghost" onClick={() => updateSettings({ uiAccent: DEFAULT_ACCENT })}>
                {t('common.reset')}
              </Button>
            )
          }
        >
          <ColorField label={t('settings.accent.label')} value={settings.uiAccent} onChange={(uiAccent) => updateSettings({ uiAccent })} />
        </Card>

        <Card title={t('settings.app')} icon={AudioWaveform}>
          <Switch label={t('sound.enable')} description={t('sound.enable.text')} checked={settings.sounds} onChange={(sounds) => updateSettings({ sounds })} />
          <Switch label={t('settings.splash')} description={t('settings.splash.text')} checked={settings.splash !== 'none'} onChange={(on) => updateSettings({ splash: on ? 'neon-scan' : 'none' })} />
          <Switch label={t('sound.motion.reduce')} description={t('sound.motion.reduceText')} checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
          <Button className="mt-3" size="sm" iconRight={ArrowRight} onClick={() => navigate('sound')}>
            {t('settings.moreSound')}
          </Button>
        </Card>

        <Card title={t('settings.scooter')} icon={ArrowLeftRight}>
          <p className="text-sm text-muted">
            {t('settings.scooter.current')} <span className="font-semibold text-fg">{SCOOTERS[model].name}</span>
          </p>
          <Button className="mt-3" icon={ArrowLeftRight} onClick={() => navigate('select')}>
            {t('shell.switchModel')}
          </Button>
        </Card>

        <Card title={t('settings.data')} subtitle={t('settings.data.text')} icon={Database}>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: t('gallery.tab.themes'), value: savedThemes.length },
              { label: t('gallery.tab.boot'), value: bootDesigns.length },
              { label: t('settings.data.storage'), value: `${(usage / 1024).toFixed(0)} KB` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line/80 bg-base-2/60 px-2 py-2.5">
                <p className="font-display text-base font-bold text-fg">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-subtle">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              icon={Download}
              onClick={() => {
                downloadJson(store.exportBackup(), `escooter-customizer-backup-${new Date().toISOString().slice(0, 10)}.json`);
                toast(t('toast.exported'));
              }}
            >
              {t('settings.backup.export')}
            </Button>
            <ImportButton label={t('settings.backup.import')} />
            <Button variant="danger" icon={Trash2} className="sm:col-span-2" onClick={() => setResetOpen(true)}>
              {t('settings.resetAll')}
            </Button>
          </div>
        </Card>

        <Card title={t('settings.about')} icon={Info} className="lg:col-span-2">
          <div className="grid gap-4 text-sm text-muted md:grid-cols-3">
            <div>
              <p className="font-display text-sm font-bold tracking-wider text-fg">ESCOOTER CUSTOMIZER PRO</p>
              <p className="mt-1 text-xs">
                {t('settings.version')} {APP_VERSION}
              </p>
            </div>
            <p className="text-xs leading-relaxed">{t('settings.privacy')}</p>
            <p className="text-xs leading-relaxed">{t('legal.disclaimer')}</p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('settings.resetAll')}
        message={t('settings.resetConfirm')}
        confirmLabel={t('settings.resetAll')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          store.resetAll();
          navigate('dashboard');
        }}
      />
    </div>
  );
}
