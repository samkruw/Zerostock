# ZeroStock V3.5 – Benutzerverwaltung

## Direkt in ZeroStock
Admin → Benutzer → + Benutzer

Eingeben:
- Name
- E-Mail
- Rolle (Admin / Mitarbeiter / Kunde)
- Sprache

ZeroStock erstellt Auth-Konto, UID und Benutzerprofil automatisch und löst eine Passwort-Einrichtungs-Mail aus.

## Benutzer verwalten
- Rollen ändern
- Zugriff deaktivieren / aktivieren
- Passwort-Mail erneut senden

Hinweis: Eine statische PWA kann fremde Firebase-Auth-Konten nicht serverseitig endgültig löschen. Deaktivieren sperrt deshalb den ZeroStock-Zugriff über `/users/<UID>/active=false`.

## WICHTIG
Die `database.rules.json` wurde für die Benutzerliste erweitert.
In Firebase → Realtime Database → Rules einfügen und veröffentlichen.
Nur auf GitHub hochladen reicht für Rules nicht.
