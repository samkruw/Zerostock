# ZeroStock 5.0.0

V5 mit einheitlicher Versionskennung für Android, PWA und GitHub-Updateprüfung.

- App-ID: `ch.zerogen.zerostock`
- Update von RC1 mit demselben Signing-Zertifikat und höherem Android-versionCode
- bestehende SQLite-, Scanner-, Rollen- und Firebase-Funktionen beibehalten
- eigener Service-Worker-Cache für Version 5.0.0
- signierte Release-APK mit SHA-256-Datei

Die automatisierten Prüfungen umfassen 14 Stabilitäts-, 16 Security- und zehn
Versions-Gates sowie sieben Tests der Release-Vorbereitung. Sie ersetzen keine
Geräte- und Live-Firebase-Integrationstests. Vor produktivem Rollout sind insbesondere
Login, Scanner, Offline-Buchung mit Wiederverbindung und das Update einer bestehenden
RC1-Installation auf einem echten Android-Gerät zu prüfen.
