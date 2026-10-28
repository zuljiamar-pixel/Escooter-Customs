import type { CompatLevel, Localized } from '../store/types';

export interface CompatItem {
  id: string;
  level: CompatLevel | 'excluded';
  title: Localized;
  detail: Localized;
}

/**
 * Ehrliche Kompatibilitätsübersicht. Grundlage: Es gibt keine öffentlich dokumentierte Segway-Schnittstelle
 * für Displayfarben, Themes oder Boot-Logos. Das offizielle NBIoTBleKit (iOS) dokumentiert u. a. Helmschloss-
 * Funktionen und erfordert Plattform-Zugangsdaten; inoffizielle, per Reverse Engineering ermittelte Protokolle
 * werden bewusst nicht verwendet.
 */
export const COMPAT_ITEMS: CompatItem[] = [
  {
    id: 'designer',
    level: 'app',
    title: { de: 'Display-Designer & Live-Vorschau', en: 'Display designer & live preview' },
    detail: {
      de: 'Farben, Schriften, Layouts und Themes funktionieren vollständig – als Vorschau im Display-Mockup.',
      en: 'Colors, fonts, layouts and themes work fully – as a preview in the display mockup.',
    },
  },
  {
    id: 'library',
    level: 'app',
    title: { de: 'Theme Store, Galerie & eigene Themes', en: 'Theme store, gallery & custom themes' },
    detail: {
      de: 'Speichern, Bearbeiten, Löschen, Import und Export werden lokal im Browser gespeichert.',
      en: 'Saving, editing, deleting, import and export are stored locally in your browser.',
    },
  },
  {
    id: 'boot-editor',
    level: 'app',
    title: { de: 'Boot-Logo-Editor & Export', en: 'Boot logo editor & export' },
    detail: {
      de: 'Startbildschirme gestalten und als PNG, Video (WebM/MP4) oder JSON exportieren – z. B. als Wallpaper oder zum Teilen.',
      en: 'Design boot screens and export them as PNG, video (WebM/MP4) or JSON – e.g. as wallpaper or to share.',
    },
  },
  {
    id: 'layout-editor',
    level: 'app',
    title: { de: 'Custom Dashboard, RGB Studio, Sounds', en: 'Custom dashboard, RGB studio, sounds' },
    detail: {
      de: 'Layout-Editor, Farbwerkzeuge, UI-Sounds und Startanimationen gehören zur App.',
      en: 'Layout editor, color tools, UI sounds and start animations are part of the app.',
    },
  },
  {
    id: 'ble-scan',
    level: 'official',
    title: { de: 'Bluetooth-Gerätesuche & Verbindung', en: 'Bluetooth device search & connection' },
    detail: {
      de: 'Über die Web Bluetooth API (W3C) in Chrome/Edge auf Android und Desktop. Es werden keine Befehle gesendet.',
      en: 'Via the Web Bluetooth API (W3C) in Chrome/Edge on Android and desktop. No commands are sent.',
    },
  },
  {
    id: 'ble-read',
    level: 'official',
    title: { de: 'Akkustand & Geräteinfos lesen', en: 'Read battery level & device info' },
    detail: {
      de: 'Nur lesend über standardisierte Bluetooth-SIG-Dienste (Battery Service 0x180F, Device Information 0x180A) – und nur, wenn das Gerät sie bereitstellt. Das ist für MAX G3 und F3 Pro nicht dokumentiert.',
      en: 'Read-only via standard Bluetooth SIG services (Battery Service 0x180F, Device Information 0x180A) – only if the device exposes them. This is not documented for MAX G3 and F3 Pro.',
    },
  },
  {
    id: 'official-app',
    level: 'official',
    title: { de: 'Fahrzeugeinstellungen & Firmware', en: 'Vehicle settings & firmware' },
    detail: {
      de: 'Ausschließlich über die offizielle Segway-App. Diese App greift darauf nicht zu.',
      en: 'Only through the official Segway app. This app does not access them.',
    },
  },
  {
    id: 'hw-display',
    level: 'unsupported',
    title: { de: 'Displayfarben & Themes auf den Scooter übertragen', en: 'Transfer display colors & themes to the scooter' },
    detail: {
      de: 'Keine dokumentierte Schnittstelle bekannt. Designs bleiben eine Vorschau.',
      en: 'No documented interface known. Designs remain a preview.',
    },
  },
  {
    id: 'hw-boot',
    level: 'unsupported',
    title: { de: 'Boot-Logo auf den Scooter übertragen', en: 'Transfer boot logo to the scooter' },
    detail: {
      de: 'Keine dokumentierte Schnittstelle bekannt. Der Startbildschirm wird nur in der App simuliert.',
      en: 'No documented interface known. The boot screen is only simulated in the app.',
    },
  },
  {
    id: 'hw-layout',
    level: 'unsupported',
    title: { de: 'Eigenes Dashboard-Layout & Sounds am Scooter', en: 'Custom dashboard layout & sounds on the scooter' },
    detail: {
      de: 'Nicht unterstützt. Layouts und Sounds wirken nur innerhalb der App.',
      en: 'Not supported. Layouts and sounds only apply inside the app.',
    },
  },
  {
    id: 'excluded',
    level: 'excluded',
    title: { de: 'Tempolimit, Firmware, Motorsteuerung, Sicherheitsfunktionen', en: 'Speed limits, firmware, motor control, safety features' },
    detail: {
      de: 'Bewusst ausgeschlossen. Die App schreibt keine Werte auf den Scooter und erfindet keine Bluetooth-Befehle.',
      en: 'Deliberately excluded. The app writes no values to the scooter and never invents Bluetooth commands.',
    },
  },
];
