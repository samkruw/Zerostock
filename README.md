# ZeroStock

> **Packing Material Control · LIVE**  
> QR-basierte Bestandsverwaltung und Packing-Planung als installierbare PWA für Desktop und Android.

![Version](https://img.shields.io/badge/version-2.7_LIVE-008e86)
![PWA](https://img.shields.io/badge/PWA-Desktop_%2B_Android-00a99d)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_Database-1eb980)
![Status](https://img.shields.io/badge/status-Production-118a84)

---

## Überblick

**ZeroStock** verwaltet Kartonbestände, Packing Instructions und Materialbewegungen zentral über Firebase.

Die Oberfläche orientiert sich am **Container-FotoTrack-Design**:

- helle, ruhige Corporate-Oberfläche
- Weiss als Hauptfläche
- Türkis / Grün als Akzent
- klare Statusanzeigen
- optimiert für schnelle Bedienung im Lager
- responsive für Desktop, Tablet und Android-Smartphone

---

## App-Start

```text
ZeroStock öffnen
        ↓
Login mit E-Mail + Passwort
        ↓
Firebase Authentication
        ↓
Benutzerrolle prüfen
        ↓
Realtime Database verbinden
        ↓
Dashboard
```

> Die Realtime Database ist fest in ZeroStock eingebaut.  
> Benutzer müssen **keine Firebase- oder Database-Einstellungen** eingeben.

---

## Produktive Firebase-Verbindung

| Einstellung | Wert |
|---|---|
| Projekt | `zerostock-c5f5f` |
| Authentication | Firebase Email / Password |
| Realtime Database | `europe-west1` |
| Datenbank | `https://zerostock-c5f5f-default-rtdb.europe-west1.firebasedatabase.app` |
| Modus | LIVE / Multiuser |

---

## Hauptfunktionen

### QR & Lager

- Kartons direkt in ZeroStock anlegen
- Artikelnummer
- Bezeichnung
- Lagerplatz
- Anfangsbestand
- Warnbestand
- Mindestbestand
- automatisches QR-Regalschild
- QR jederzeit erneut drucken
- QR direkt mit Android-Smartphone scannen

### Buchungen

Nach dem Scan stehen drei Buchungsarten zur Verfügung:

| Buchung | Verwendung |
|---|---|
| **Eingang** | neuer Bestand wird eingebucht |
| **Abgang** | Kartons werden entnommen |
| **Schwund** | Verlust, Beschädigung oder Differenz |

Jede Bewegung enthält:

- Benutzer
- Datum / Uhrzeit
- Artikel
- Buchungsart
- Menge
- Bestand nach Buchung
- optionaler Grund / Kommentar

---

## Packing Instructions · TINST

Packing Instructions werden direkt in ZeroStock erstellt.

Pro Instruction können bestehende Kartons ausgewählt und die benötigte Menge pro Packing definiert werden.

Beispiel:

```text
TINST 4711
├── Karton A     × 2
├── Karton B     × 1
└── Karton C     × 4
```

Der Planner berechnet daraus automatisch:

- maximal mögliche Packings
- verfügbares Material
- benötigtes Material
- Fehlmengen
- Engpass-Karton
- Erfüllbarkeit eines geplanten Auftrags

---

## Benutzerrollen

### Admin

Vollzugriff auf ZeroStock.

- Kartons verwalten
- TINST verwalten
- Bestände korrigieren
- QR-Labels drucken
- Buchungen durchführen
- Benutzer / Rollen verwalten
- Planner verwenden
- Systemstatus prüfen

### Mitarbeiter

Für den operativen Lagerbetrieb.

- QR scannen
- Eingang buchen
- Abgang buchen
- Schwund buchen
- Bestände sehen
- Instructions sehen
- Planner verwenden

### Kunde

Reduzierte Ansicht.

- freigegebene Packing Instructions
- freigegebene Kapazitätsinformationen
- keine internen Bewegungen
- keine internen Lagerbestände

---

## Desktop

Auf Desktop liegt der Fokus auf Verwaltung und Planung:

```text
┌─────────────────────────────────────────┐
│ ZeroStock · Packing Material Control    │
├──────────────┬──────────────────────────┤
│ Dashboard    │ Bestand / Status         │
│ QR Scan      │ Packing Planner          │
│ Kartons      │ TINST                    │
│ Bewegungen   │ Benutzer                 │
│ Einstellungen│ Firebase LIVE            │
└──────────────┴──────────────────────────┘
```

Ideal für:

- Disposition
- Administration
- Packing-Planung
- Bestandskontrolle
- TINST-Pflege

---

## Android Smartphone

Die mobile Ansicht ist für schnelle Lagerbuchungen optimiert.

### Mobile Navigation

**Home · Scan · Kartons · Planner · TINST**

Zusätzlich steht ein grosser QR-Scan-Button zur Verfügung.

Typischer Ablauf:

```text
QR scannen
    ↓
Karton wird geöffnet
    ↓
Eingang / Abgang / Schwund
    ↓
Menge eingeben
    ↓
Bestätigen
    ↓
Bestand sofort für alle Geräte aktualisiert
```

---

## PWA

ZeroStock ist eine installierbare Progressive Web App.

Enthalten:

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

### Desktop installieren

In Chrome oder Edge:

1. ZeroStock über die GitHub-Pages-Adresse öffnen.
2. **Installieren** in der Adressleiste auswählen.
3. ZeroStock startet danach in einem eigenen App-Fenster.

### Android installieren

In Chrome:

1. ZeroStock öffnen.
2. **App installieren** oder **Zum Startbildschirm hinzufügen** auswählen.
3. Kamera-Berechtigung für den QR-Scan erlauben.

---

## Multiuser

Alle angemeldeten Geräte arbeiten mit derselben Realtime Database.

Beispiel:

```text
Android Mitarbeiter
      │
      │  -10 Kartons
      ▼
Firebase Realtime Database
      │
      ├──────── Desktop Admin
      │
      ├──────── Android Mitarbeiter 2
      │
      └──────── Tablet
```

Bestandsänderungen werden über Firebase-Transactions geschrieben, damit parallele Buchungen nicht einfach den Bestand des anderen Benutzers überschreiben.

---

## Neuen Benutzer anlegen

### 1. Firebase Authentication

Firebase Console:

**Authentication → Users → Add user**

E-Mail und Passwort anlegen.

### 2. UID kopieren

Die UID des neuen Benutzers kopieren.

### 3. Rolle in Realtime Database anlegen

Unter:

```text
/users/<UID>
```

Beispiel:

```json
{
  "name": "Marco",
  "role": "employee",
  "language": "de"
}
```

Erlaubte Rollen:

```text
admin
employee
customer
```

---

## Sicherheit

ZeroStock verwendet:

- Firebase Authentication
- rollenbasierte Realtime-Database-Regeln
- keine Selbstregistrierung
- keine anonymen Benutzer
- keine Demo-Benutzer
- keine lokale Ersatzdatenbank im LIVE-Betrieb
- Firebase Transactions für Bestandsbuchungen

> Bei fehlender Live-Verbindung werden Bestandsbuchungen nicht lokal zwischengespeichert.  
> Dadurch werden widersprüchliche Lagerbestände zwischen mehreren Smartphones vermieden.

---

## GitHub Pages

ZeroStock benötigt keinen eigenen Server und keinen Build-Prozess.

Repository-Dateien hochladen und danach:

**Settings → Pages → Deploy from a branch → `main` / root**

Nach dem Deployment kann dieselbe URL auf Desktop, Android und Tablet verwendet werden.

---

## Design System

| Bereich | ZeroStock V2.7 |
|---|---|
| Hintergrund | Hellgrau / Weiss |
| Primärfarbe | Türkis |
| Sekundärfarbe | Grün |
| Text | Dunkelgrau |
| Status OK | Grün |
| Warnung | Gelb |
| Kritisch | Rot |
| Karten | Weiss mit dezenter Kontur |
| Stil | Container FotoTrack / Corporate |

---

## Version

### ZeroStock V2.7 LIVE

**FotoTrack Design Edition**

Enthalten:

- feste Firebase Realtime Database
- Firebase Login
- Rollenmodell
- QR-Lagerverwaltung
- Schwund
- TINST
- Packing Planner
- Desktop UI
- Android UI
- installierbare PWA
- DE / EN
- GitHub-Pages-Kompatibilität

---

**ZeroStock**  
*Packing Material Control · LIVE*
