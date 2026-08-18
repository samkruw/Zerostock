# ZeroStock V3.4 – Kartons/Artikel löschen

## Neu
Admins können Kartons/Artikel löschen.

### Löschen möglich über
- Karton-Tabelle → `Löschen`
- Karton bearbeiten → `Löschen`

### Schutz vor kaputten TINSTs
Ein Karton kann nicht gelöscht werden, solange er noch in einer Packing Instruction / TINST verwendet wird.

ZeroStock zeigt dann die betroffenen Instructions an.

### Bewegungs-Historie
Beim Löschen eines Kartons bleiben bestehende Bewegungen erhalten.
Damit bleibt das Buchungsjournal nachvollziehbar.

### Sicherheit
Löschen ist nur für `admin` verfügbar.

Alle bisherigen Funktionen bleiben erhalten:
Firebase LIVE, Login, Rollen, QR-Regalschilder, Eingang, Abgang, Schwund,
Packing Instructions, Planner, Desktop + Android PWA.
