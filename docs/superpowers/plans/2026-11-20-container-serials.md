# Seriennummern vom Containeretikett

**Ziel.** Eine physische Einheit anhand ihres vorhandenen Etiketts erfassen, ausbuchen und bei der Rückkehr wiedererkennen. Der bestätigte Entwurf steht in ../specs/2026-11-20-container-serials-design.md.

## Global Constraints

Web und Android teilen die Fachlogik und Oberfläche. Eine Seriennummer ist Text und innerhalb des Containertyps eindeutig. Bestehende Mengen, frühere Journaleinträge, Rollen, Paketsignatur und die Plate-Bedarfsplanung bleiben kompatibel. Tests verwenden eigene Daten.

### Task 1. Bestand, Serienzustand und lokales Journal

In src/articles.mjs die Etiketteingabe, Zuordnung zum vorhandenen Bestand und Zustandsübergänge kapseln. Artikel und unveränderlicher Bewegungssnapshot bilden die Schnittstelle zu Firebase und SQLite. In src/offline-core.js den Artikel, die Bewegung und die Warteschlange gemeinsam schreiben und auf Server-Snapshots ausstehende Buchungen geordnet anwenden.

Mit test-articles.mjs und test-offline-articles.mjs zuerst den Fehler reproduzieren. Führende Nullen, Sonderzeichen, Herkunft, Rückkehr, Verlust, Doppelbuchung, Altbestand und Neustart prüfen. Erwartet wird eine Bestandsänderung pro akzeptierter physischer Bewegung.

### Task 2. Bedienung und Onlineabgleich

In overrides/index.html Eingabe und Scan an Bestand, Artikelanlage und Buchung anbinden. Die Artikeltransaktion muss den aktuellen Zustand prüfen. Das Journal und der Containerexport übernehmen die unveränderten Nummern der Buchung. Datenschutz und Datentypen mit den mitgelieferten Firebase-Regeln und dem lokalen Emulator prüfen.

Die Browserabläufe über articles-ui.py und articles-regressions.py auf kleinem Handy, Handy und Desktop ausführen. Erwartet werden eindeutige Auswahl bei gleichen Etiketten, keine doppelte Ausbuchung, verständliche Fehlermeldungen und ein unveränderter Plate-Bestand.

### Task 3. Auslieferung

Die geprüfte Quelle als V5.2.0 durch den vorhandenen Android-Build und die APK-Signaturprüfung führen. Das Webpaket aus derselben APK entnehmen und mit öffentlichem Pages-Smoke-Test prüfen. Hinweise zur Bedienung in README und Release Notes aufnehmen.

## Review Focus

Mehrdeutige Scans, konkurrierende Buchungen, Wiederanlauf zwischen Bestands- und Journalschreibvorgang, verzögerte Offline-Bewegungen, Änderungen an Stammdaten und die Sichtbarkeit nach einem Rollenwechsel besonders prüfen.
