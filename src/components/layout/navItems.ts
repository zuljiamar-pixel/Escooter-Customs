import {
  AudioWaveform,
  Bluetooth,
  Gauge,
  Images,
  Info,
  LayoutDashboard,
  LayoutTemplate,
  Palette,
  Power,
  Settings,
  Store,
  type LucideIcon,
} from 'lucide-react';
import type { RouteId } from '../../hooks/useHashRoute';
import type { TKey } from '../../i18n';

export interface NavItem {
  id: Exclude<RouteId, 'select'>;
  icon: LucideIcon;
  label: TKey;
  short: TKey;
}

export const NAV_ITEMS: Record<NavItem['id'], NavItem> = {
  dashboard: { id: 'dashboard', icon: LayoutDashboard, label: 'nav.dashboard', short: 'nav.dashboard.short' },
  display: { id: 'display', icon: Gauge, label: 'nav.display', short: 'nav.display.short' },
  boot: { id: 'boot', icon: Power, label: 'nav.boot', short: 'nav.boot.short' },
  layout: { id: 'layout', icon: LayoutTemplate, label: 'nav.layout', short: 'nav.layout.short' },
  rgb: { id: 'rgb', icon: Palette, label: 'nav.rgb', short: 'nav.rgb.short' },
  store: { id: 'store', icon: Store, label: 'nav.store', short: 'nav.store.short' },
  gallery: { id: 'gallery', icon: Images, label: 'nav.gallery', short: 'nav.gallery.short' },
  sound: { id: 'sound', icon: AudioWaveform, label: 'nav.sound', short: 'nav.sound.short' },
  info: { id: 'info', icon: Info, label: 'nav.info', short: 'nav.info.short' },
  connect: { id: 'connect', icon: Bluetooth, label: 'nav.connect', short: 'nav.connect.short' },
  settings: { id: 'settings', icon: Settings, label: 'nav.settings', short: 'nav.settings.short' },
};

export const NAV_GROUPS: { label: TKey; items: NavItem['id'][] }[] = [
  { label: 'nav.group.studio', items: ['dashboard', 'display', 'boot', 'layout', 'rgb'] },
  { label: 'nav.group.library', items: ['store', 'gallery'] },
  { label: 'nav.group.scooter', items: ['info', 'connect'] },
  { label: 'nav.group.app', items: ['sound', 'settings'] },
];

export const BOTTOM_ITEMS: NavItem['id'][] = ['dashboard', 'display', 'boot', 'rgb'];
