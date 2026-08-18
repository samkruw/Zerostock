<div align="center">

# ZeroStock

### PACKING MATERIAL CONTROL · LIVE

**QR-basierte Kartonverwaltung, Packing Instructions und Multiuser-Planung als PWA für Desktop und Android.**

`V3.5 LIVE` · `FIREBASE` · `DESKTOP + ANDROID` · `DE / EN`

</div>

---

<table>
<tr>
<td align="center" width="25%"><b>📦 KARTONS</b><br><sub>Bestand · Lagerplatz · Warnung</sub></td>
<td align="center" width="25%"><b>▣ QR SCAN</b><br><sub>Eingang · Abgang · Schwund</sub></td>
<td align="center" width="25%"><b>◆ PLANNER</b><br><sub>Kapazität · Fehlmengen</sub></td>
<td align="center" width="25%"><b>♙ MULTIUSER</b><br><sub>Admin · Mitarbeiter · Kunde</sub></td>
</tr>
</table>

---

## 🟢 Systemstatus

| Bereich | Status |
|---|---|
| **Firebase Authentication** | 🟢 LIVE |
| **Realtime Database** | 🟢 LIVE |
| **Desktop PWA** | 🟢 READY |
| **Android PWA** | 🟢 READY |
| **QR Buchungen** | 🟢 READY |
| **Packing Planner** | 🟢 READY |

---

## Dashboard

```text
┌──────────────────────────────────────────────────────────────┐
│ ZEROSTOCK · PACKING MATERIAL CONTROL             FIREBASE ● │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Kartons        Bestand OK        Warnung        Kritisch    │
│      24              18               4              2        │
│                                                              │
├──────────────────────────────────┬───────────────────────────┤
│ BESTÄNDE                         │ PACKING-KAPAZITÄT         │
│                                  │                           │
│ TINST282-A   A-02-04   46   OK   │ TINST 282          15    │
│ TINST111-B   B-01-03   12   WARN │ TINST 111           6    │
│ KT-430       C-03-01    3   KRIT │                           │
│                                  │ Firebase            LIVE  │
└──────────────────────────────────┴───────────────────────────┘
```

---

## Workflow

```text
┌────────────┐
│ QR SCANNEN │
└─────┬──────┘
      ↓
┌────────────┐
│   BUCHEN   │
│ IN/OUT/LOSS│
└─────┬──────┘
      ↓
┌────────────┐
│ FIREBASE   │
│    LIVE    │
└─────┬──────┘
      ↓
┌────────────┐
│   TINST    │
└─────┬──────┘
      ↓
┌────────────┐
│  PLANNER   │
└────────────┘
```

---

# Funktionen

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

- Name
- Beschreibung
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

# 📦 Kartonverwaltung

| Feld | Bedeutung |
|---|---|
| **Artikel** | Artikelnummer |
| **Bezeichnung** | Kartonbeschreibung |
| **Lagerplatz** | Regal / Position |
| **Bestand** | aktueller Bestand |
| **Warnbestand** | Warnschwelle |
| **Mindestbestand** | kritische Schwelle |

### Statuslogik

| Status | Darstellung |
|---|---|
| Bestand über Warnschwelle | 🟢 **OK** |
| Bestand erreicht Warnbestand | 🟡 **WARNUNG** |
| Bestand erreicht Mindestbestand | 🔴 **KRITISCH** |

---

# ▣ QR-Regalschilder

```text
Karton anlegen
      ↓
QR-Code erzeugen
      ↓
Regalschild drucken
      ↓
am Lagerplatz befestigen
      ↓
Smartphone scannen
      ↓
Eingang / Abgang / Schwund
```

Das Regalschild enthält:

`ARTIKEL` · `BEZEICHNUNG` · `LAGERPLATZ` · `QR-CODE`

---

# Lagerbuchungen

| Buchung | Funktion |
|---|---|
| 🟢 **Eingang** | Bestand erhöhen |
| 🔵 **Abgang** | Bestand reduzieren |
| 🟠 **Schwund** | Verlust / Schaden / Differenz |

Jede Buchung speichert:

- Benutzer
- Zeitpunkt
- Artikel
- Buchungsart
- Menge
- Bestand danach
- Grund
- Notiz

---

# Kartons löschen

Admins können Kartons bzw. Artikel löschen.

```text
KARTON LÖSCHEN
      ↓
TINST-PRÜFUNG
      ↓
┌───────────────────┬────────────────────┐
│ NICHT VERWENDET   │ NOCH VERWENDET     │
│        ↓          │        ↓           │
│     LÖSCHEN       │ LÖSCHEN BLOCKIERT  │
└───────────────────┴────────────────────┘
```

Die Bewegungs-Historie bleibt erhalten.

---

# ≡ Packing Instructions / TINST

Beispiel:

```text
TINST 4711

├── Karton A × 2
├── Karton B × 1
└── Karton C × 4
```

Pro TINST können definiert werden:

- Name
- Beschreibung
- Version
- Status
- benötigte Kartons
- Menge pro Packing

---

# ◆ Packing Planner

```text
AKTUELLER BESTAND
        +
PACKING INSTRUCTION
        +
GEPLANTE MENGE
        ↓
┌─────────────────────┐
│   PACKING PLANNER   │
└─────────────────────┘
        ↓
MÖGLICH / FEHLMENGE
```

Berechnet werden:

- maximal mögliche Packings
- benötigte Kartons
- verfügbare Kartons
- Fehlmengen
- Engpass
- Auftrags-Erfüllbarkeit

---

# ♙ Benutzerverwaltung

## Benutzer anlegen

**Admin → Benutzer → + Benutzer**

```text
NAME
E-MAIL
ROLLE
SPRACHE
   ↓
FIREBASE AUTH
   ↓
UID
   ↓
ZEROSTOCK-PROFIL
   ↓
PASSWORT-E-MAIL
```

Der bestehende Admin bleibt angemeldet.

## Benutzer verwalten

- Rolle ändern
- Benutzer deaktivieren
- Benutzer aktivieren
- Passwort-Mail senden

---

# Rollen

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

# 🖥️ Desktop

Optimiert für:

`Administration` · `Bestandskontrolle` · `TINST` · `Planner` · `Benutzerverwaltung`

```text
┌──────────────┬──────────────────────────────┐
│ Dashboard    │                              │
│ QR Scan      │       ZERO STOCK             │
│ Kartons      │       DASHBOARD              │
│ Planner      │                              │
│ TINST        │       FIREBASE LIVE          │
│ Bewegungen   │                              │
│ Benutzer     │                              │
└──────────────┴──────────────────────────────┘
```

---

# 📱 Android

Optimiert für:

`QR Scan` · `Eingang` · `Abgang` · `Schwund` · `Bestandskontrolle`

Mobile Navigation:

```text
HOME   SCAN   KARTONS   PLANNER   TINST
```

---

# PWA

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

ZeroStock benötigt:

- keinen Build-Prozess
- kein Framework
- keinen eigenen Server
- keine Cloud Functions

---

# Firebase

| Bereich | Wert |
|---|---|
| **Project ID** | `zerostock-c5f5f` |
| **Authentication** | E-Mail / Passwort |
| **Database** | Firebase Realtime Database |
| **Modus** | LIVE / Multiuser |

```text
https://zerostock-c5f5f-default-rtdb.europe-west1.firebasedatabase.app
```

---

# Datenstruktur

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

# Firebase Rules

`database.rules.json` muss unter:

**Firebase → Realtime Database → Rules**

eingefügt und veröffentlicht werden.

Das Hochladen auf GitHub alleine aktiviert die Rules nicht.

---

# GitHub Pages

```text
GitHub
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

## ZeroStock V3.5 LIVE

**PACKING MATERIAL CONTROL**

`WHITE` · `TURQUOISE` · `GREEN` · `CORPORATE`

</div>
