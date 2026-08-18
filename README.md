<div align="center">

<img src="./readme-assets/zerostock-hero.svg" alt="ZeroStock Dashboard" width="100%">

<br>

### PACKING MATERIAL CONTROL · LIVE

**QR-basierte Kartonverwaltung, Packing Instructions und Multiuser-Planung als PWA für Desktop und Android.**

`V3.5 LIVE` &nbsp; `FIREBASE` &nbsp; `DESKTOP + ANDROID` &nbsp; `DE / EN`

</div>

---

## ZeroStock

<table>
<tr>
<td width="25%"><b>📦 Kartons</b><br><sub>Bestand, Warnbestand, Mindestbestand und Lagerplatz.</sub></td>
<td width="25%"><b>▣ QR Scan</b><br><sub>Schnelle Buchungen direkt am Regal.</sub></td>
<td width="25%"><b>◆ Planner</b><br><sub>Kapazität, Fehlmengen und Engpässe.</sub></td>
<td width="25%"><b>♙ Multiuser</b><br><sub>Admin, Mitarbeiter und Kundenrollen.</sub></td>
</tr>
</table>

<img src="./readme-assets/zerostock-workflow.svg" alt="ZeroStock Workflow" width="100%">

---

## Dashboard

ZeroStock verbindet **Lagerbestand**, **Packing Instructions** und **Benutzerverwaltung** in einer Oberfläche.

| Status | Bedeutung |
|---|---|
| 🟢 **BESTAND OK** | Bestand oberhalb der Warnschwelle |
| 🟡 **WARNUNG** | Bestand erreicht Warnbestand |
| 🔴 **KRITISCH** | Bestand erreicht Mindestbestand |
| 🟢 **LIVE** | Firebase Realtime Database verbunden |

---

## Funktionen

<table>
<tr>
<td width="50%" valign="top">

### 📦 Kartons / Artikel

- Artikelnummer
- Bezeichnung
- Lagerplatz
- aktueller Bestand
- Warnbestand
- Mindestbestand
- Bearbeiten
- Löschen
- QR-Regalschild

</td>
<td width="50%" valign="top">

### ▣ Lagerbuchungen

- Eingang
- Abgang
- Schwund
- individuelle Mengen
- Gründe & Notizen
- Firebase Transactions
- Bewegungsjournal

</td>
</tr>

<tr>
<td width="50%" valign="top">

### ≡ Packing Instructions / TINST

- Name & Beschreibung
- Version
- Aktiv / Inaktiv
- Kartonbedarf pro Packing
- Bearbeiten
- Duplizieren

</td>
<td width="50%" valign="top">

### ◆ Packing Planner

- maximal mögliche Packings
- benötigte Mengen
- verfügbare Mengen
- Fehlmengen
- Engpass
- Auftragsprüfung

</td>
</tr>
</table>

---

## QR-Regalschilder

```text
Karton anlegen
      ↓
QR-Code erzeugen
      ↓
Regalschild drucken
      ↓
am Lagerplatz befestigen
      ↓
Smartphone scannt
      ↓
Eingang / Abgang / Schwund
```

Das Regalschild enthält **Artikelnummer, Bezeichnung, Lagerplatz und QR-Code**.

---

## Benutzerverwaltung

<div align="center">

| | |
|---|---|
| **+ Benutzer** | Name, E-Mail, Rolle und Sprache direkt in ZeroStock anlegen |
| **Rollen** | Admin · Mitarbeiter · Kunde |
| **Zugriff** | Aktivieren / Deaktivieren |
| **Passwort** | Einrichtungs- oder Reset-Mail senden |

</div>

### Automatischer Ablauf

```text
Admin → + Benutzer
        ↓
Firebase Auth Account
        ↓
UID automatisch
        ↓
/users/<UID>
        ↓
Rolle + Sprache
        ↓
Passwort-E-Mail
```

Der Admin bleibt dabei angemeldet.

---

## Rollen

| Funktion | Admin | Mitarbeiter | Kunde |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | reduziert |
| QR Scan | ✅ | ✅ | — |
| Eingang / Abgang | ✅ | ✅ | — |
| Schwund | ✅ | ✅ | — |
| Kartons sehen | ✅ | ✅ | — |
| Kartons anlegen | ✅ | — | — |
| Kartons bearbeiten | ✅ | — | — |
| Kartons löschen | ✅ | — | — |
| TINST sehen | ✅ | ✅ | ✅ |
| TINST bearbeiten | ✅ | — | — |
| Planner | ✅ | ✅ | ✅ |
| Bewegungen | ✅ | ✅ | — |
| Benutzerverwaltung | ✅ | — | — |

---

## Kartons löschen

> **Sicherheitslogik:** Ein Karton kann nicht gelöscht werden, solange er noch in einer Packing Instruction / TINST verwendet wird.

Bestehende Bewegungen bleiben als Historie erhalten.

---

## Desktop & Android

<table>
<tr>
<td width="50%" valign="top">

### 🖥️ Desktop

Optimiert für:

- Administration
- Bestandskontrolle
- TINST-Pflege
- Planner
- Benutzerverwaltung

</td>
<td width="50%" valign="top">

### 📱 Android

Optimiert für:

- QR Scan
- Eingang
- Abgang
- Schwund
- schnelle Bestandskontrolle
- Planner

</td>
</tr>
</table>

Beide Formfaktoren verwenden **dieselbe PWA und dieselbe LIVE-Datenbank**.

---

## PWA

```text
ZeroStock/
├── index.html
├── manifest.webmanifest
├── sw.js
├── icon-192.png
├── icon-512.png
├── database.rules.json
├── readme-assets/
│   ├── zerostock-hero.svg
│   └── zerostock-workflow.svg
└── README.md
```

ZeroStock benötigt **keinen Build-Prozess, kein Framework und keinen eigenen Server**.

---

## Firebase

| Bereich | Konfiguration |
|---|---|
| **Project ID** | `zerostock-c5f5f` |
| **Authentication** | E-Mail / Passwort |
| **Database** | Firebase Realtime Database |
| **Sync** | LIVE / Multiuser |

```text
https://zerostock-c5f5f-default-rtdb.europe-west1.firebasedatabase.app
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
│
├── cartons
│   └── <ARTICLE>
│
├── instructions
│   └── <TINST>
│
├── movements
│   └── <MOVEMENT-ID>
│
└── customerSummary
```

---

## Firebase Rules

`database.rules.json` gehört in:

**Firebase → Realtime Database → Rules → Veröffentlichen**

> Das Hochladen der Datei auf GitHub dient nur als Versions-Backup und aktiviert die Regeln nicht.

---

## GitHub Pages

```text
GitHub Repository
      ↓
Settings
      ↓
Pages
      ↓
Deploy from a branch
      ↓
main / root
```

---

<div align="center">

### ZeroStock V3.5 LIVE

**Packing Material Control**

`WHITE` · `TURQUOISE` · `GREEN` · `CORPORATE`

</div>
