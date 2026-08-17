# ZeroStock V2.4 – Desktop + Android PWA

## Ziel
Eine einzige installierbare ZeroStock-PWA für:
- Desktop / Notebook
- Android Smartphone / Tablet

## Desktop
- Dashboard
- Karton-Stammdaten
- Packing Instructions / TINST
- Packing Planner
- Bewegungsjournal
- Benutzer / Rollen
- Firebase-Multiuser-Setup

## Android
- Mobile Bottom Navigation
- grosser QR-Scan-Button
- schnelle Buchung von Eingang / Abgang / Schwund
- responsive Modals
- installierbar auf Homescreen
- Kamera-QR-Scan auf unterstützten Chrome/Android-Geräten

## PWA-Dateien
- index.html
- manifest.webmanifest
- sw.js
- icon-192.png
- icon-512.png

## Offline
Die App-Shell wird lokal gecacht. Im Local-Modus funktioniert ZeroStock ohne Internet.
Im Firebase-Multiuser-Betrieb werden Bestandsbuchungen bei fehlender Live-Verbindung absichtlich blockiert, damit keine widersprüchlichen Bestände entstehen.

## GitHub Pages
Alle Dateien in den Repository-Root hochladen.
Dann:
Settings → Pages → Deploy from a branch → main / root.

## Installieren
Desktop Chrome/Edge:
- ZeroStock öffnen
- Installationssymbol in der Adresszeile oder ZeroStock Installieren-Banner verwenden

Android Chrome:
- ZeroStock öffnen
- Installieren / Zum Startbildschirm hinzufügen
- Kamera-Berechtigung für QR-Scan erlauben

## Firebase
Die bestehende Firebase-Realtime-Database/Auth-Integration bleibt erhalten.
