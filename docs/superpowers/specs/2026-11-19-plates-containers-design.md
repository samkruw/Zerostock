# Plates und Container: Mengenverwaltung und Konfigurationsberechnung

Stand: 19.11.2026. Vom Benutzer mit „Ja passt so“ zur Umsetzung bestätigt; noch keine veröffentlichte Funktion.

## Ziel und vereinbarter Umfang

ZeroStock verwaltet zusätzlich zu Kartons die Artikelarten **Plate** und **Container**. Eine Container-Konfiguration beschreibt, welche Plate-Artikel und Stückzahlen für einen Container benötigt werden. Für die gewünschte Containerzahl berechnet die App den Bedarf und die Verfügbarkeit.

Der Benutzer hat ausdrücklich **Mengenverwaltung je Containertyp** gewählt. Eine spätere Einzelverfolgung kann eventuell über eine Schnittstelle zu **Container Track** erfolgen. Diese Schnittstelle ist nicht Teil dieses Ausbauschritts; es liegt weder eine API-Beschreibung noch eine ausgewählte externe Installation vor.

Die Erweiterung gilt gemeinsam für Website und Android. Vorhandene Kartonartikel, Packing Instructions, Bestände und die bestehende Synchronisierung bleiben verwendbar. Der Benutzer hat den bisherigen Live-Sync einer Abgangsbuchung von 20 Stück zwischen Web und Android mit Screenshots bestätigt.

## Gewählter Ansatz

1. **Mengenverwaltung in ZeroStock – vom Benutzer gewählt.** Artikelarten, Konfigurationen und Mengenbuchungen erweitern die vorhandene Verwaltung. Bestehende Bestände werden weiterverwendet; keine Container-Seriennummern sind erforderlich.
2. **Einzelverfolgung jedes Containers mit eigener QR-ID – zunächst nicht gewählt.** Dafür wären eigene Instanzzustände und andere Buchungsregeln erforderlich. Der Benutzer möchte diese Aufgabe eventuell mit Container Track verbinden.

Technischer Vorschlag: die vorhandenen Artikel-, Instruction- und Bewegungsdatensätze erweitern. Der bestehende SQLite-Cache speichert zusätzliche Felder bereits als JSON. Eine zweite Bestandsverwaltung mit eigenen, parallel geführten Mengen wäre hierfür unnötig und wird nicht angelegt.

## Buchungswirkung: offener Punkt mit vorgeschlagenem Standard

**Bestätigte Buchungswirkung:** Die Konfiguration ist eine Bedarfsplanung. Berechnen und Speichern einer Konfiguration verändern keine Bestände. Ein Container-Ausgang bucht die eingegebene Menge dieses Containerartikels; Plates werden über eigene Eingangs-/Abgangsbuchungen geführt.

Der Benutzer hat diesen Entwurf einschliesslich separater Bestandsbuchung bestätigt. Gemeinsame Mehrartikelbuchungen sind kein Teil dieser Umsetzung.

## Artikel und bestehende Daten

- Gemeinsamer Bestand mit Filtern **Alle**, **Kartons**, **Plates**, **Container**.
- Artikelnummer, Bezeichnung, Lagerplatz, Bestand, Warn- und Mindestbestand bleiben erhalten.
- Neues Feld `kind`: `carton`, `plate` oder `container`.
- Datensätze ohne `kind` werden weiterhin als Karton angezeigt. Das Lesen führt keine Datenmigration und keine Bestandsänderung aus.
- Administratoren können neue Artikel aller drei Arten anlegen. Bei alten Artikeln ohne ausdrückliche Kategorie kann die Kategorie beim Bearbeiten einmalig gesetzt werden. Eine ausdrücklich gesetzte Art bleibt danach stabil, damit Konfigurationen und Bewegungen ihre Bedeutung behalten.
- Neue Mengen und Komponentenstückzahlen sind endliche, sichere ganze Zahlen. Bestände und Schwellen dürfen nicht negativ sein; Warnbestand darf nicht kleiner als Mindestbestand sein. Bestandskorrekturen bestehender Kartonartikel bleiben innerhalb der bisherigen Berechtigungen möglich.
- Artikelnummern/IDs bleiben global eindeutig. Dasselbe Teil wird nicht zusätzlich als zweiter Schattenbestand angelegt.
- Optionales Feld `externalRef` für eine spätere Zuordnung zu einer externen Artikelkennung. Dieses Feld ist eine Zuordnungshilfe; es stellt keine Verbindung her.
- Schreiben von Stammdaten muss bestehende unbekannte Metadaten und ausstehende Sync-Markierungen erhalten. Das bisherige vollständige Ersetzen eines Artikeldatensatzes wird entsprechend abgesichert.

## Container-Konfigurationen

Eine Konfiguration besitzt Name, Beschreibung, Version, Aktivstatus, einen Containerartikel und mindestens eine Plate-Komponente.

- Der Zielartikel muss ein vorhandener Containerartikel sein.
- Jede Komponente muss auf einen vorhandenen Plate-Artikel verweisen und eine positive ganze Stückzahl besitzen.
- Doppelte Plate-Zeilen werden vor dem Speichern verständlich zurückgewiesen; keine unbemerkte doppelte Berechnung.
- Container dürfen nicht als Plate-Komponente ausgewählt werden. Konfigurationen sind nicht rekursiv verschachtelt.
- Mehrere Konfigurationen je Containertyp sind möglich, zum Beispiel für unterschiedliche Bestückungen.
- Nur Administratoren erstellen, bearbeiten oder duplizieren Konfigurationen, entsprechend den bisherigen Packing Instructions.
- Vorhandene Packing Instructions bleiben normale Packing Instructions. Ihre Materialien werden nicht nachträglich auf Plates eingeschränkt.
- Löschung eines Artikelstamms wird weiterhin verhindert, solange eine Instruction oder Container-Konfiguration ihn verwendet. Zu- und Abgänge entfernen keine Artikelstammdaten.

### Kompatible Speicherung

Weiterhin `instructions/<id>`, ergänzt um `kind: 'container'` und `containerId`. Ein Datensatz ohne diesen Typ ist eine normale Packing Instruction.

Die gespeicherte Materialliste enthält genau eine Einheit des Ziel-Containerartikels und die Plate-Komponenten je Container:

```text
materials = [
  { cartonId: <Containerartikel-ID>, qty: 1 },
  { cartonId: <Plate-Artikel-ID>, qty: <Stück je Container> },
  ...
]
```

`cartonId` und der bestehende Datenbankpfad `cartons` bleiben interne Kompatibilitätsnamen. Die Produktoberfläche bezeichnet alle drei Arten als Artikel. Ältere Clients können die erweiterte Materialliste weiterhin mit der bisherigen Bedarfsmathematik auswerten.

Die Konfigurationsmaske zeigt den Container separat an und bearbeitet nur die Plate-Zeilen. Beim erneuten Speichern darf keine zweite Container-Komponente entstehen. Duplizieren erhält Art und Zielartikel und erzeugt eine neue Konfigurations-ID.

## Berechnung

Der Planner unterscheidet Packing Instructions und Container-Konfigurationen. Bei einer Container-Konfiguration heisst die gewünschte Menge **Anzahl Container**.

Für eine angefragte Menge N:

- Containerbedarf: N Stück des konfigurierten Containerartikels.
- Plate-Bedarf je Artikel: N × Stückzahl pro Container.
- Fehlmenge: `max(0, Bedarf - verfügbarer Bestand)`.
- Maximal bestückbare Container: Minimum aus Containerbestand und `floor(Plate-Bestand / Plate-Stückzahl)` über alle Komponenten.
- Ergebnis zeigt die Mengen je Artikel sowie Engpass und verfügbare Containerzahl.
- Die Planung reserviert keinen Bestand. Offene native Buchungen wirken wie bisher auf den angezeigten lokalen Bestand. Das Ergebnis ist ein Stand zum Berechnungszeitpunkt.
- Fehlende, ungültige oder nicht verfügbare Komponenten ergeben eine klare Meldung und keine optimistische Kapazität. Leere Konfigurationen werden nicht gespeichert. Aktive Konfigurationen sind auswählbar; inaktive bleiben zur Verwaltung erhalten.
- Null, negative Zahlen, Bruchteile, NaN und arithmetische Überläufe werden für die angefragte Containerzahl zurückgewiesen.

Reines Rechenbeispiel, keine Produktionsdaten: Container A benötigt 4 Plate P und 2 Plate Q. Bei Bestand 10 Container A, 30 P und 20 Q sind 7 vollständig bestückbare Container verfügbar. Für 8 Container werden 32 P benötigt; es fehlen 2 P. Alle Bestände bleiben nach der Berechnung unverändert.

Kundenrollen behalten die bisherige Summary-Ansicht auf Kapazitäten. Neue Filter oder Planner-Ergebnisse dürfen ihnen keine internen Artikelbestände, Bewegungen, Empfänger oder externen Kennungen offenlegen.

## Mengenbuchungen und Verlauf

- Eingang, Abgang und die bestehende Schwundbuchung funktionieren für alle drei Artikelarten mit derselben Bestandslogik.
- Für Container können eine Gegenstelle bzw. Herkunft/Ziel und eine Referenz optional erfasst werden. Sie gehören zu einer Mengenbewegung, nicht zu einem einzelnen Container.
- Bewegungen enthalten wie bisher ID, Zeit, Benutzer, Artikel, Richtung, Menge, Bestand danach und Sync-Status.
- Neue optionale Felder: `articleKind`, `partner`, `reference`, gegebenenfalls eine externe Artikelreferenz als Snapshot.
- Mengen, Richtung und Bestandswirkung bleiben in den bisherigen Kernfeldern; externe Zuordnungen ändern keine Artikel-ID.
- Die Metadaten müssen bei direkter Webbuchung, lokalem Speichern, Neustart, Sync-Batch, Retry und Journal-/CSV-Ausgabe erhalten bleiben. Insbesondere die bisherigen expliziten Rückgabeobjekte in `getSyncBatch` und `getMovementsByStatus` müssen diese Felder weitergeben.
- Für alle Artikelarten bleiben die bestehenden Sperren gegen Doppelklicks, fehlenden Bestand und doppelte Synchronisierung erhalten. Eine bestehende Kartonbuchung darf durch zusätzliche optionale Felder nicht anders verrechnet werden.
- Web bleibt wie bisher direkt mit Firebase verbunden; Android behält lokale Buchungen und die bestehende Warteschlange. Es wird kein neues Offline-Versprechen für den Browser eingeführt.

## Spätere Container-Track-Anbindung

Jetzt werden stabile interne Artikel-/Bewegungs-IDs und optionale externe Artikelreferenzen vorgesehen. Ein Container-Bewegungsexport enthält Artikel-ID, Artikelnummer, optionale externe Referenz, Richtung, Menge, Zeit, Benutzer und die optionalen Buchungsreferenzen.

Ein neutraler CSV-Export der Containerbewegungen ist Teil dieser Erweiterung. Er wird nicht als fertiges Container-Track-Importformat bezeichnet, solange dessen Vertrag unbekannt ist. Die bestehende Absicherung gegen Tabellenformeln bleibt auch für neue freie Textfelder aktiv.

Der Export umfasst die aktuell geladenen Containerbewegungen; dieser Umfang wird vor dem Export benannt. Er wird nicht als vollständige historische Übertragung oder als verlustfreie Schnittstellen-Synchronisierung ausgegeben. Eine spätere automatische Schnittstelle benötigt eine eigene Abgleichs-/Nachladevereinbarung.

Keine erfundenen API-Endpunkte, keine Zugangsdatenfelder ohne konkreten Dienst und kein angeblich verbundener Dienst. Authentifizierung, Einzelcontainer-IDs, Statusabgleich, Webhooks, Retry-/Konfliktregeln zwischen den Systemen und die konkrete Feldzuordnung werden mit der tatsächlichen Container-Track-Schnittstelle separat festgelegt.

## Zugriff und Firebase-Regeln

Die bestehenden Pfade `cartons`, `instructions` und `movements` werden weiterverwendet. Es entsteht kein zusätzlich freizugebender Datenbankzweig.

- Administratoren verwalten Artikel/Konfigurationen; Mitarbeiter buchen Bestände; Kunden bleiben bei ihren vorhandenen Summary-Rechten.
- Der mitgelieferte Regelstand validiert optionale neue Felder und verhindert, dass Mitarbeiter Artikelart oder externe Stammdatenreferenzen verändern.
- Der Regelstand bleibt mit alten Artikeln und Bewegungen ohne die neuen Felder kompatibel. Alte Stock-Transaktionen, die bestehende Daten erhalten, bleiben möglich. Alte Clients dürfen neue Stammdatenfelder nicht stillschweigend löschen.
- Die tatsächlichen produktiven Firebase-Regeln wurden in dieser Cloud-Umgebung nicht gelesen oder geändert. Es ist derzeit kein Administrator-Connector oder freigegebener Testbenutzer konfiguriert. Ein Regeltest gegen einen lokalen Emulator ist kein Nachweis über den live bereitgestellten Regelstand.
- Produktive Regeln oder Daten werden nur über tatsächlich verfügbaren und autorisierten Zugriff geändert. Fehlende Rechte werden nicht mit offenen Regeln oder Produktions-Testbuchungen umgangen.

## Prüfumfang

1. Alte Artikel/Instructions ohne Typ bleiben lesbar, berechenbar und buchbar.
2. Neue Artikelarten lassen sich anlegen und filtern; Stammdatenupdates erhalten zusätzliche Felder und Sync-Markierungen.
3. Container-Konfiguration anlegen, bearbeiten, duplizieren; richtige Typen, gültige Mengen, keine doppelten Komponenten.
4. Berechnung mit mehreren Plates, Nullbestand, Engpass Container/Plate, fehlender Komponente und grossen ungültigen Eingaben; nachweislich keine Bestandsänderung.
5. Aus- und Eingang für Karton, Plate, Container; Containerbuchung erhält Gegenstelle/Referenz und verändert nach vorgeschlagenem Standard keinen Plate-Bestand.
6. Tatsächliche SQLite-Abfragen bzw. ein Adapter mit echter Testdatenbank prüfen JSON-Metadaten über Cache, Queue, Batch und Retry. Keine alleinigen Regex- oder Scheintests für die neuen Abläufe.
7. Browserprüfung auf Desktop und Android-Grössen: Artikelanlage, Filter, Konfiguration, Planner und Buchungsdialog; Kontrast-/Safe-Area-Regression bleibt erhalten.
8. Rollen und optionale neue Feldvalidierung werden gegen den bereitgestellten Regelstand geprüft. Keine Produktionsdaten werden für Tests erzeugt.
9. Bestehende Sicherheits-/Stabilitäts-/Releaseprüfungen bleiben aktiv.
10. Dieselben geprüften Anwendungsdateien werden in Website und signierter Android-APK ausgeliefert. Die Signatur bleibt erhalten, Android-versionCode steigt über 29; vorhandene Tags und APKs werden nicht ersetzt.

## Auslieferung und technische Entscheidungen

Vorgesehene Feature-Version: **5.1.0**. Die bestehende Versionsvorbereitung muss diese Version konsistent in App, HTML, Cache und Updater unterstützen. CI bleibt für die vorhandene Browserversion auf Ubuntu 24.04.

Ausgangsstand Web/main: `129ab01530bb81523b49e592cf6a7ab5af4c17df`. Android-Quellstand v5.0.2: `9929c63566e720b85d5605da28bc016bb9d75b58`. Das ursprüngliche Quellarchiv und der bestehende Lesbarkeits-Patch sind nachvollziehbare Build-Eingaben. Der Build muss die neuen Quelldateien ebenfalls nachvollziehbar enthalten; manuelle Änderungen nur am erzeugten Web-Root reichen nicht aus.

Dem Implementierenden überlassen: genaue Aufteilung von Modulen und Formularfeldern, gewählte Quell-Overlay-Struktur, geeignete Testadapter, Reihenfolge kleiner Umsetzungsschritte und die konkrete CSV-Spaltenanordnung. Bestehende lesbare dunkle Gestaltung und die vorstehenden Daten-/Buchungsregeln bleiben verbindlich.

## Entwurfsprüfung

Eine unabhängige technische Prüfung des Entwurfs hat als einzige wesentliche offene Entscheidung die Bestandswirkung der Containerbuchung benannt. Diese Frage ist oben mit dem vorgeschlagenen Standard beschrieben und dem Benutzer bereits gestellt. Mengenverwaltung statt Einzelverfolgung und eine spätere, separat zu spezifizierende Container-Track-Anbindung sind entschieden. Der Benutzer hat danach den Entwurf und die separate Buchungswirkung bestätigt.
