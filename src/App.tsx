import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Splash } from './components/Splash';
import { ToastProvider, useToast } from './components/ui/Toast';
import { useHashRoute, type RouteId } from './hooks/useHashRoute';
import { NavContext } from './hooks/useNav';
import { SplashContext } from './hooks/useSplash';
import { useI18n } from './i18n';
import { mix, readableOn } from './lib/color';
import { onStorageError } from './lib/storage';
import { BootLogo } from './pages/BootLogo';
import { Connection } from './pages/Connection';
import { CustomDashboard } from './pages/CustomDashboard';
import { Dashboard } from './pages/Dashboard';
import { DisplayCustomizer } from './pages/DisplayCustomizer';
import { Gallery } from './pages/Gallery';
import { RgbStudio } from './pages/RgbStudio';
import { ScooterInfo } from './pages/ScooterInfo';
import { ScooterSelect } from './pages/ScooterSelect';
import { Settings } from './pages/Settings';
import { SoundAnimation } from './pages/SoundAnimation';
import { ThemeStore } from './pages/ThemeStore';
import { AppStoreProvider, useStore } from './store/AppStore';
import { BluetoothProvider } from './store/BluetoothContext';
import type { SplashAnimation } from './store/types';

const PAGES: Record<Exclude<RouteId, 'select'>, () => ReactNode> = {
  dashboard: () => <Dashboard />,
  display: () => <DisplayCustomizer />,
  boot: () => <BootLogo />,
  store: () => <ThemeStore />,
  layout: () => <CustomDashboard />,
  rgb: () => <RgbStudio />,
  gallery: () => <Gallery />,
  sound: () => <SoundAnimation />,
  info: () => <ScooterInfo />,
  connect: () => <Connection />,
  settings: () => <Settings />,
};

function useSystemPrefers(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Übernimmt Sprache, Hell/Dunkel, Akzentfarbe und Bewegungseinstellungen in das Dokument. */
function useDocumentSettings() {
  const { settings } = useStore();
  const prefersLight = useSystemPrefers('(prefers-color-scheme: light)');
  const theme = settings.uiTheme === 'system' ? (prefersLight ? 'light' : 'dark') : settings.uiTheme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.reducedMotion = String(settings.reducedMotion);
    root.lang = settings.language;
    root.style.setProperty('--ui-accent', settings.uiAccent);
    root.style.setProperty('--ui-accent-2', mix(settings.uiAccent, '#2f6bff', 0.6));
    root.style.setProperty('--ui-on-accent', readableOn(settings.uiAccent));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#eef2f8' : '#05070d');
  }, [theme, settings.reducedMotion, settings.language, settings.uiAccent]);
}

function AppInner() {
  const { model, settings } = useStore();
  const { t } = useI18n();
  const toast = useToast();
  const [route, navigate] = useHashRoute();
  const systemReduced = useSystemPrefers('(prefers-reduced-motion: reduce)');
  const [splash, setSplash] = useState<Exclude<SplashAnimation, 'none'> | null>(() =>
    settings.splash !== 'none' && !settings.reducedMotion && !systemReduced ? settings.splash : null,
  );

  useDocumentSettings();

  useEffect(
    () =>
      onStorageError((kind) => {
        toast(kind === 'quota' ? t('toast.storageFull') : t('toast.storageUnavailable'), 'error');
      }),
    [toast, t],
  );

  const playSplash = useCallback((animation: Exclude<SplashAnimation, 'none'>) => setSplash(animation), []);
  const nav = useMemo(() => ({ route, navigate }), [route, navigate]);

  let content: ReactNode;
  if (model === null || route === 'select') {
    content = <ScooterSelect onDone={() => navigate('dashboard')} />;
  } else {
    content = (
      <AppShell>
        <div key={route}>{PAGES[route]()}</div>
      </AppShell>
    );
  }

  return (
    <NavContext.Provider value={nav}>
      <SplashContext.Provider value={playSplash}>
        <div className="app-backdrop" aria-hidden />
        {content}
        {splash && <Splash animation={splash} onDone={() => setSplash(null)} skipLabel={t('splash.skip')} />}
      </SplashContext.Provider>
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <ToastProvider>
        <BluetoothProvider>
          <AppInner />
        </BluetoothProvider>
      </ToastProvider>
    </AppStoreProvider>
  );
}
