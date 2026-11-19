# ZeroStock V5.0.2 — Lesbare Oberfläche für Web und Android

V5.0.2 behebt die widersprüchlichen hellen und dunklen Styles aus V5.0.0.

- Überschriften, Artikelnummern und Bestandswerte sind auf dunklen Flächen lesbar.
- Menüeinträge zeigen Titel und Beschreibung in getrennten Zeilen.
- Bestandskarten und Aufgaben haben grössere Schrift und bedienbare Schaltflächen.
- Der Installationshinweis steht im Seitenfluss und verdeckt keine Lagerkarten.
- Android berücksichtigt die von Capacitor gelieferten Abstände zu Statusleiste und Systemnavigation.
- Die Symbole der eingeklappten Desktop-Navigation bleiben sichtbar.

Die Android-App verwendet dieselbe Paket-ID und denselben Signaturschlüssel wie V5.0.0. Die APK ist als Update vorgesehen. Bestehende Releases werden nicht ersetzt.

Die gemeinsame Oberfläche wird mit lokalen Beispieldaten und blockierten externen Verbindungen in sechs Browser-Konfigurationen geprüft. Das bestätigt Darstellung und Bedienung; ein Test auf einem physischen Android-Gerät und echte Login-/Buchungs-/Synchronisierungstests sind weiterhin nicht durchgeführt.

Firebase-Regeln und Produktionsbestände werden durch dieses Update nicht verändert.

Der Release-Build verwendet Ubuntu 24.04, passend zur festgelegten Playwright-Version. Der fehlgeschlagene V5.0.1-Build hat keine APK veröffentlicht; dessen Tag bleibt unverändert.
