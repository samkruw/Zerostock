# ZeroStock V4.0 — Gesamtprodukt

> **Packing Material Control · LIVE**  
> Eine einzige produktive ZeroStock-PWA für Desktop und Android.

![Version](https://img.shields.io/badge/version-4.0_Gesamtprodukt-008e86)
![PWA](https://img.shields.io/badge/PWA-Desktop_%2B_Android-00a99d)
![Firebase](https://img.shields.io/badge/Firebase-LIVE-1eb980)
![Status](https://img.shields.io/badge/status-Production-118a84)

---

## Was ist V4.0?

V4.0 vereinigt alle bisherigen ZeroStock-Versionen zu **einem Gesamtprodukt**.

Es gibt keine getrennten Demo-, Local-, QR-, Carton-, Role- oder User-Versionen mehr.

Ab jetzt ist **V4.0 die gemeinsame Basis für alle weiteren ZeroStock-Versionen**.

---

## Enthaltene Gesamtfunktionen

### Login & Multiuser

- Firebase Authentication
- E-Mail / Passwort
- Login-Screen vor App-Zugriff
- feste Realtime-Database-Verbindung
- automatische Session-Wiederherstellung
- Rollenprüfung über `/users/<UID>/role`
- REST-Fallback für Rollenprüfung
- Admin / Mitarbeiter / Kunde
- deaktivierbare ZeroStock-Zugänge

### Benutzerverwaltung

Admin → **Benutzer**

- Benutzer direkt in ZeroStock anlegen
- Name
- E-Mail
- Rolle
- Sprache
- automatische Firebase-UID
- sekundäre Auth-Session, damit Admin eingeloggt bleibt
- Passwort-Einrichtungs-Mail
- bestehende Benutzer anzeigen
- Rollen ändern
- Benutzer deaktivieren / reaktivieren
- Passwort-Mail erneut senden
- letzter aktiver Admin ist gegen Deaktivierung/Herabstufung geschützt

### Kartons / Artikel

- Artikelnummer
- Bezeichnung
- Lagerplatz
- Bestand
- Warnbestand
- Mindestbestand
- Karton bearbeiten
- Karton löschen
- Löschen nur, wenn keine TINST den Karton mehr verwendet
- Bewegungs-Historie bleibt bestehen

### QR-Regalschilder

- QR automatisch nach Kartonanlage
- QR jederzeit erneut drucken
- Artikel / Beschreibung / Lagerplatz auf Label
- Deep Link `?box=<ID>`
- Android QR-Scan
- mehrere QR-CDN-Fallbacks
- Runtime-Cache der QR-Bibliothek
- QR-Druck nur wenn QR wirklich erzeugt wurde

### Buchungen

- Eingang
- Abgang
- Schwund
- individuelle Menge
- Schwundgrund
- Notiz
- Firebase Transaction gegen parallele Bestandskonflikte
- Benutzer / Zeit / Bestand danach im Bewegungsjournal

### Packing Instructions / TINST

- TINST direkt in ZeroStock anlegen
- Kartons auswählen
- benötigte Menge pro Packing
- Version
- Beschreibung
- aktiv / inaktiv
- bearbeiten
- duplizieren

### Packing Planner

Berechnet:

- maximal mögliche Packings
- benötigte Mengen
- verfügbare Mengen
- Fehlmengen
- Engpass
- Auftrags-Erfüllbarkeit

### Dashboard

- Anzahl Kartons
- Bestand OK
- Warnungen
- kritische Bestände
- aktueller Lagerbestand
- Packing-Kapazität
- Live-Firebase-Status

### Bewegungsjournal

- Zeitpunkt
- Benutzer
- Artikel
- Buchungsart
- Menge
- Bestand danach
- Grund

Das Firebase-Regelwerk hält neue Bewegungen als **append-only Audit Log**.

---

## Rollen

| Funktion | Admin | Mitarbeiter | Kunde |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | reduziert |
| QR Scan | ✓ | ✓ | — |
| Eingang / Abgang | ✓ | ✓ | — |
| Schwund | ✓ | ✓ | — |
| Kartons sehen | ✓ | ✓ | — |
| Kartons anlegen | ✓ | — | — |
| Kartons bearbeiten | ✓ | — | — |
| Kartons löschen | ✓ | — | — |
| TINST sehen | ✓ | ✓ | ✓ |
| TINST bearbeiten | ✓ | — | — |
| Planner | ✓ | ✓ | ✓ |
| Bewegungen | ✓ | ✓ | — |
| Benutzerverwaltung | ✓ | — | — |

---

## Desktop + Android

### Desktop

Für:

- Administration
- Bestandskontrolle
- TINST-Pflege
- Planner
- Benutzerverwaltung

### Android

Für:

- QR Scan
- Eingang
- Abgang
- Schwund
- schnelle Bestandskontrolle
- Planner

Beide verwenden **dieselbe PWA und dieselbe Datenbank**.

---

## PWA-Dateien

```text
ZeroStock/
├── index.html
├── manifest.webmanifest
├── sw.js
├── icon-192.png
├── icon-512.png
├── database.rules.json
└── README.md
```

---

## Firebase

Projekt:

```text
zerostock-c5f5f
```

Realtime Database:

```text
https://zerostock-c5f5f-default-rtdb.europe-west1.firebasedatabase.app
```

Authentication:

```text
Email / Password
```

---

## Datenstruktur

```text
/
├── users
│   └── <UID>
│       ├── name
│       ├── email
│       ├── role
│       ├── language
│       └── active
├── cartons
│   └── <ARTICLE>
├── instructions
│   └── <TINST>
├── movements
│   └── <MOVEMENT-ID>
└── customerSummary
```

---

## Firebase Rules

Die `database.rules.json` gehört **nicht** in `Realtime Database → Data`.

Sie muss in:

**Firebase → Realtime Database → Rules**

eingefügt und veröffentlicht werden.

Sie darf zusätzlich auf GitHub als Versions-Backup liegen.

---

## GitHub Pages

ZeroStock benötigt:

- keinen Build-Prozess
- keinen eigenen Server
- kein Framework
- keine Cloud Functions

Deployment:

```text
GitHub
→ Settings
→ Pages
→ Deploy from a branch
→ main / root
```

---

## Design

ZeroStock V4.0 nutzt den vereinheitlichten FotoTrack-/Corporate-Look:

- Weiss
- Türkis
- Grün
- dunkle Typografie
- klare Status-Badges
- Desktop- und mobile Navigation
- professionelles ZeroStock-PWA-Icon

---

## Sicherheitsprinzipien

- kein Demo-Zugang
- keine Selbstregistrierung
- rollenbasierte Realtime-Database-Regeln
- Multiuser-Buchungen via Transactions
- Bewegungsjournal append-only
- deaktivierbare ZeroStock-Zugänge
- kein unsicherer Offline-Bestandssync im LIVE-Betrieb
- letzter aktiver Admin geschützt

---

## Release

### ZeroStock V4.0 — Gesamtprodukt

Diese Version ist die neue gemeinsame Grundlage.

Alle weiteren Änderungen sollen **auf V4.0 aufbauen** und keine Funktionen aus früheren Versionen wieder entfernen.

---

**ZeroStock**  
*Packing Material Control · LIVE*


---

## ZeroStock V4.1 – Brand/UI Refresh

Die Oberfläche wurde auf das aktuelle ZeroGen App/UI-Designsystem umgestellt:

- dunkle Navy/Black-Oberfläche mit klaren Karten und reduzierter visueller Tiefe
- ZeroStock Grün/Türkis als Markenakzent
- Blau für primäre Aktionen, Grün für Bestand/Status
- neue ZeroStock Orb-App-Icons in 192, 512 und 1024 px
- neues Branding in Login, Desktop-Sidebar und Mobile-Header
- Inputs, Buttons, Navigation, Badges, Modals und Scanner an das neue Design angepasst
- bestehende Firebase-, QR-, Packing-, Planner- und Benutzerfunktionen unverändert beibehalten
