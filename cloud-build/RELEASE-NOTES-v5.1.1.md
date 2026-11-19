# ZeroStock V5.1.1 – Plates und Container

- Artikelverwaltung mit Kartons, Plates und Containern, Kategorie-Filtern und optionaler externer Artikelreferenz.
- Container-Konfigurationen legen den benötigten Plate-Bedarf je Container fest. Der Planner zeigt mögliche Stückzahl, Gesamtbedarf und Fehlmengen.
- Berechnungen verändern und reservieren keinen Bestand. Container und Plates werden getrennt über Eingang, Abgang oder Schwund gebucht.
- Container-Buchungen können Partner und Referenz enthalten; diese Angaben bleiben auch in der lokalen Android-Warteschlange erhalten.
- Neutraler CSV-Export der geladenen Container-Bewegungen als Grundlage für eine spätere Container-Track-Anbindung. Eine Container-Track-API ist noch nicht verbunden.
- Kontowechsel während einer laufenden Synchronisierung lassen die Buchung für den ursprünglichen Benutzer wiederholbar, ohne eine zweite Bestandsänderung.
- Bestehende Karton-Daten und ausstehende Buchungen bleiben kompatibel. Artikelbearbeitungen schützen zwischenzeitlich gebuchte Bestände.
- Website und Android verwenden dieselben Anwendungsdateien. Android-Updates verwenden weiterhin das bestehende Paket und Signierzertifikat.

Validierung: Domain- und echte SQLite-Tests, Firebase-Regeltests im isolierten Emulator sowie Browser-Flows und Lesbarkeitsprüfungen für Mobilgerät und Desktop. Ein Test der neuen Funktionen auf einem physischen Android-Gerät und mit produktiven Lagerbuchungen ist nicht Bestandteil dieser Prüfungen. Die beiliegenden Firebase-Regeln müssen über einen autorisierten Projektzugang bereitgestellt werden.
