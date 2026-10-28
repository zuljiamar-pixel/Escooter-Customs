# ESCOOTER CUSTOMIZER PRO ⚡

Moderne Web-App zur **Display-Personalisierung** für den **Segway-Ninebot MAX G3** und **Segway-Ninebot F3 Pro**:
Display-Designer mit Live-Vorschau, Boot-Logo-Editor, Theme Store, Layout-Editor, RGB Studio und mehr –
im futuristischen Neon-Dark-UI, mobile-first für Android und Desktop.

> **Ehrlich vorweg:** Alle Designs sind eine hochwertige, interaktive **Vorschau in der App**. Für MAX G3 und F3 Pro
> ist keine dokumentierte Schnittstelle bekannt, mit der sich Displayfarben, Themes oder Boot-Logos auf das echte
> Scooter-Display übertragen lassen. Die App behauptet das nirgends und kennzeichnet es überall sichtbar.

## Hardware-Kompatibilität

| Kategorie | Funktionen |
| --- | --- |
| **1. Nur in der App** (funktioniert vollständig) | Display-Designer & Live-Vorschau, Theme Store, Galerie, eigene Themes, Boot-Logo-Editor inkl. PNG/Video/JSON-Export, Custom Dashboard, RGB Studio, UI-Sounds, Startanimationen, Backup/Import |
| **2. Offiziell dokumentierte Schnittstelle** | Gerätesuche & Verbindung über die [Web Bluetooth API (W3C)](https://webbluetoothcg.github.io/web-bluetooth/); **nur lesend** Akkustand (Bluetooth SIG *Battery Service* `0x180F`) und Geräteinfos (*Device Information* `0x180A`) – nur wenn das Gerät sie bereitstellt. Fahrzeugeinstellungen & Firmware ausschließlich über die offizielle Segway-App. |
| **3. Keine bestätigte Unterstützung** | Displayfarben/Themes, Boot-Logos, eigene Layouts oder Sounds auf den Scooter übertragen → nur Vorschau |
| **Bewusst ausgeschlossen** | Tempolimits, Firmware, Motorsteuerung, Sicherheitsfunktionen – die App schreibt **keine** Werte auf den Scooter und erfindet **keine** Bluetooth-Befehle |

Recherche-Grundlage (10/2026):

- Segway stellt kein öffentliches Entwickler-API für Display-Anpassungen bereit. Das offizielle
  [NBIoTBleKit (iOS)](https://github.com/NinebotMobileTeam/NBIoTBleKit-iOS) dokumentiert u. a. Helmschloss-Funktionen und
  benötigt Plattform-Zugangsdaten – es ist für eine Web-App nicht nutzbar.
- Ein [Community-Protokoll](https://nootnooot.codeberg.page/segway-ninebot-ble/) wurde per Reverse Engineering ermittelt.
  Es ist **nicht offiziell** und wird deshalb bewusst **nicht** verwendet.
- Ob MAX G3 / F3 Pro die Standard-GATT-Dienste anbieten, ist nicht dokumentiert. Die App prüft es beim Verbinden und
  zeigt das Ergebnis ehrlich an.

## Funktionen

- **Scooter-Auswahl** beim ersten Start, jederzeit wechselbar; je Modell eigenes Display-Gehäuse-Mockup, eigene Vorlagen und eigener Design-Stand.
- **Dashboard:** Live-Display, Akkustand (Vorschauwert oder – falls verfügbar – vom Gerät gelesen, klar gekennzeichnet), Verbindungsstatus, aktives Design, Schnellzugriff.
- **Display-Customizer:** Neon-Blau, Rot, Grün, Lila, Orange und eigene RGB-Farben; Hintergrund- und Akzentfarbe; Leuchtintensität mit Kontrastprüfung (WCAG); 6 Schriftstile inkl. Siebensegment-LCD; 5 Layouts; 4 Hintergrundstile; Geschwindigkeit/Akku/Fahrmodus als Vorschau; Themes speichern, bearbeiten, löschen; Undo/Redo; Zufallsdesign; Originaldesign wiederherstellen.
- **Boot-Logo-Editor:** Logo-Upload (Drag & Drop, PNG/JPG/WEBP/SVG/GIF, lokal auf 512 px verkleinert), Titel & Name, Farben, 7 Neon-Animationen, 4 Embleme, Vorlagen für MAX G3 und F3 Pro, Zeitleiste zum Scrubben, Export als **PNG** (4:3, HD, Handy-Wallpaper, Desktop), **Video** (WebM/MP4) und **JSON**. Vorschau und Export nutzen denselben Canvas-Renderer.
- **Theme Store:** 15 kostenlose Themes mit Suche, Kategorien, Sortierung, Favoriten, Vorher/Nachher-Vergleich.
- **Custom Dashboard:** Elemente per Maus/Touch ziehen, Raster & Einrasten, Größe/Position, Ein-/Ausblenden, Tastatursteuerung, Vorlagen, Undo/Redo.
- **RGB Studio:** Farbkreis (Pointer & Pfeiltasten), Helligkeit, HEX/RGB-Eingabe, HEX/RGB/HSL kopieren, Farbharmonien, eigene Palette, Verlauf, direkt anwenden auf Display, App-Akzent oder Boot-Logo.
- **Design-Galerie:** alle eigenen Themes und Boot-Logos mit Vorschau; anwenden, bearbeiten, umbenennen, duplizieren, exportieren, löschen; Import.
- **Sound & Animation:** 4 App-Startanimationen mit Vorschau, optionale synthetische UI-Sounds (Web Audio, 3 Pakete, Lautstärke), Bewegung reduzieren.
- **Scooter-Info:** technische Daten (als regional abweichend gekennzeichnet), Display-Infos, Modellvergleich, Kompatibilitätsmatrix.
- **Bluetooth:** Gerätesuche, Statusanzeige, Fehlerbehandlung (abgebrochen, verweigert, Bluetooth aus, Timeout, Verbindungsabbruch …), Ereignisprotokoll, periodisches Neu-Lesen – ausschließlich lesend.
- **Einstellungen:** Deutsch/Englisch, Dunkel/Hell/System, km/h ↔ mph, 24-h-Uhr, App-Akzentfarbe, Backup-Export/-Import, Speicherbelegung, alle Daten löschen.

Alle Daten (Themes, Logos, Layouts, Einstellungen) werden **lokal im Browser** gespeichert und bleiben nach einem Neustart erhalten. Keine Konten, keine Server, kein Tracking.

## Tech-Stack

React 19 · TypeScript 5.9 (strict) · Tailwind CSS 4 · Vite 7 · lucide-react · Vitest · lokal gebündelte Schriften (Fontsource) – keine externen Laufzeit-Abhängigkeiten.

## Starten

```bash
npm ci            # Abhängigkeiten installieren
npm run dev       # Entwicklungsserver auf http://localhost:5173
npm run build     # Typprüfung + Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
npm test          # Unit-Tests
```

**Web Bluetooth** benötigt einen sicheren Kontext (HTTPS oder `localhost`) und wird von Chrome/Edge auf Android, Windows,
macOS und ChromeOS unterstützt – nicht von Safari und Firefox. Alle übrigen Funktionen laufen in jedem modernen Browser.
Über das Web-App-Manifest lässt sich die App auf Android zum Startbildschirm hinzufügen.

## Projektstruktur

```
src/
  components/   UI-Bausteine, Layout (Seitenleiste/Bottom-Navigation), Display-Mockups, Farbrad, Boot-Canvas
  pages/        Dashboard, Display, Boot-Logo, Theme Store, Layout, RGB, Galerie, Sound, Info, Bluetooth, Einstellungen
  store/        App-State mit localStorage-Persistenz, Validierung (sanitize), Import/Export, Bluetooth-Kontext
  data/         Modelldaten, Themes, Layouts, Boot-Vorlagen, Kompatibilitätsmatrix
  lib/          Farben, Boot-Renderer (Canvas/Video), Bluetooth (nur lesend), Sounds, Bilder, Speicher
  i18n/         Deutsch & Englisch (Vollständigkeit per TypeScript geprüft)
  test/         Vitest-Unit-Tests
```

## Hinweis

Unabhängiges Fan-Projekt, nicht mit Segway-Ninebot verbunden oder von Segway-Ninebot unterstützt. Marken- und
Modellnamen gehören ihren Inhabern. Scooter-Grafiken und Display-Gehäuse sind stilisierte Illustrationen.
Technische Daten stammen aus Hersteller- und Händlerangaben und variieren je nach Region und Variante.
