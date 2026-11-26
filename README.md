# ZeroStock V5.3.3

ZeroStock verwaltet Kartons, Plates und Container. Website und Android-App arbeiten mit demselben Firebase-Projekt. Die Website verwendet die 18 Anwendungsdateien aus der signierten Android-APK. [Website](https://samkruw.github.io/Zerostock/) · [Android-Release](https://github.com/samkruw/Zerostock/releases/tag/v5.3.3) · [Dateiprüfsummen](web-release.json)

## Start und Navigation

Beim ersten Öffnen einer Sitzung setzt sich das ZeroStock-Z vor dem ruhenden Lagerbild zusammen. Die Animation dauert 1,6 Sekunden und läuft vollständig durch. Bei reduzierter Bewegung bleibt das fertige Z für dieselbe Dauer sichtbar. Die Anmeldung wird im Hintergrund vorbereitet. Ein Regaletikett führt anschließend zum gescannten Artikel.

## Arbeiten mit der neuen Oberfläche

Unter **Bestand** stehen Artikelnummer, Lagerplatz und verfügbare Menge zusammen. Über **Buchen** und **Seriennummern** gelangst du direkt zum Vorgang. Im Menü mit den drei Punkten findest du das QR-Etikett, die Bestandsgrenzen und deine Verwaltungsaktionen.

Im Seriennummernregister öffnet **Abgang** oder **Rückkehr** die Buchung für das gewählte Etikett. Vor der Bestätigung siehst du die Menge und den Bestand nach der Buchung. Für Container-Konfigurationen zeigt der Planner die erfüllbare Anzahl und jede fehlende Position.

## Containeretiketten verwenden

- **Vorhandene Container zuordnen.** Öffne **Bestand → Containerartikel → Seriennummern**. Erfasse die Nummern der tatsächlich im Lager stehenden Container unter **Vorhandenen Bestand zuordnen**. Jede Zeile entspricht einem Etikett. Die Zuordnung benötigt eine Live-Verbindung und erhält die vorhandene Stückzahl.
- **Neue Container empfangen.** Öffne **Eingang**, wähle den Containertyp und scanne die Seriennummer auf jedem Etikett oder gib sie ein. ZeroStock übernimmt Schreibweise, Satzzeichen und führende Nullen. Die Anzahl der Etiketten bestimmt die Buchungsmenge.
- **Ausgang, Schwund und Rückkehr buchen.** Buche die betroffenen Etiketten auf dem Containertyp. Beim Wiedereingang erkennt die App die vorhandene Einheit. In **Seriennummern** siehst du je Container den aktuellen Zustand sowie die Gegenstelle und Referenz seiner letzten Buchung. Wenn dieselbe Nummer bei mehreren Typen vorkommt, bietet der Scanner eine Auswahl an.
- **Bewegungen nachvollziehen.** Das Journal und der Container-CSV enthalten die Seriennummern der jeweiligen Buchung. Ausstehende Android-Buchungen behalten beim Wiederholen ihre Bewegungs-ID. Ein widersprüchlicher Vorgang wird in der Sync-Warteschlange als Konflikt angezeigt.

## Plates und Container im Lager

1. Öffne auf dem Handy **Bestand → + Artikel**. Wähle als Admin die Artikelart **Plate** oder **Container** und trage Mindestbestand und Warnbestand ein. Bei Plates erfasst du die Menge des Anfangsbestands, bei Containern die Nummern der Anfangsetiketten. Eine externe Artikelreferenz kannst du ergänzen. Bei vorhandenen Artikeln ohne Typ ist die erste Zuordnung möglich.
2. Öffne **Mehr → Konfigurationen → + Konfiguration**. Wähle **Container-Konfiguration**, den Containertyp und die benötigte Stückzahl jedes Plate-Artikels.
3. Gib unter **Mehr → Planner** die gewünschte Anzahl Container ein. Der Planner zeigt den Bedarf, die verfügbaren Mengen, die Fehlmengen je Artikel und die maximal bestückbare Containerzahl. Die Planung lässt die Lagerbestände unverändert.
4. Buche **Eingang**, **Abgang** oder **Schwund** für jeden Artikel separat. Bei Containern kannst du die Gegenstelle und eine Referenz eintragen. Die Bewegung erscheint im Journal.

Im Rechenbeispiel braucht ein Container vier Plates P und zwei Plates Q. Mit zehn Containern, 30 P und 20 Q kannst du sieben Container bestücken. Bei einer Anfrage für acht Container fehlen zwei P.

Unter **Mehr → Export → Container-Bewegungen · CSV** erhältst du die Containerbuchungen aus den aktuell geladenen Bewegungen. Das Journal lädt bis zu 200 Bewegungen über alle Artikelarten. Die Menge bezieht sich auf den Containertyp. Die Etiketten, die Bewegungs-ID und die externe Artikelreferenz stehen für eine spätere Container-Track-Anbindung in der CSV.

## Android, Website und Datenbank

Installiere die neue APK als Update über der vorhandenen ZeroStock-App. Die Paketkennung lautet `ch.zerogen.zerostock`. Android prüft beim Update die bestehende Signatur. Die Android-App speichert ausstehende Buchungen in SQLite. Ein unterbrochener Abgleich setzt dieselbe Buchung mit ihrer ursprünglichen ID fort.

Die Änderungsquellen liegen unter `cloud-build/overrides`. `cloud-build/restore-source.mjs` stellt das geprüfte Originalarchiv, die Lesbarkeitskorrektur und die Änderungen in einem neuen Verzeichnis wieder her. Nach der Signaturprüfung der APK stammen die Website-Dateien direkt aus `assets/public`. GitHub Pages veröffentlicht das Stammverzeichnis von `main`.

Die automatisierten Prüfungen umfassen Lagerberechnung, SQLite, Web- und Android-Ansichten sowie die mitgelieferten Firebase-Regeln im Emulator. Für V5.3.3 steht der Test auf einem physischen Android-Gerät mit einem freigegebenen Konto noch aus. Für die Aktivierung der mitgelieferten Datenbankregeln ist ein Administratorzugang zum Firebase-Projekt erforderlich. [Firebase-Regeln](database.rules.json)

## Bisherige Funktionsdokumentation

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
