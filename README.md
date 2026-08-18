# ZeroStock V2.9 – Role Recovery

## Rollen-Fix
ZeroStock liest `/users/<UID>/role` zuerst über Firebase SDK.
Falls dort kein Wert zurückkommt, erfolgt automatisch ein zweiter Abruf über die
authentifizierte Realtime-Database-REST-API mit dem Firebase ID Token.

Die Fehleransicht zeigt:
- gelesenen Rollenwert
- Quelle (SDK / REST)
- konkrete Database URL
- Firebase/REST-Fehler

## Produktive Database
https://zerostock-c5f5f-default-rtdb.europe-west1.firebasedatabase.app

## Neues PWA Logo
Das professionelle ZeroStock-Symbol ist jetzt als:
- icon-192.png
- icon-512.png
- Login-Logo
- Sidebar-Logo
integriert.

## Wichtig
`database.rules.json` ist aktualisiert. Bitte diese Regeln in
Firebase → Realtime Database → Rules veröffentlichen.
