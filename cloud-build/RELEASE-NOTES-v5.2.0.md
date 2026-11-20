# ZeroStock V5.2.0

- Container werden mit der Seriennummer ihres vorhandenen Etiketts geführt. Scanne das Etikett oder gib die aufgedruckte Nummer ein. Führende Nullen, Groß- und Kleinschreibung sowie Satzzeichen bleiben erhalten.
- Unter **Bestand → Containerartikel → Seriennummern** lassen sich Etiketten dem vorhandenen Bestand zuordnen. Die Zuordnung benötigt eine Live-Verbindung und ändert die Stückzahl nicht.
- Bei Eingang, Abgang und Schwund ergibt sich die Menge aus den erfassten Etiketten. Beim Wiedereingang wird derselbe Container wieder im Lager geführt. Das Register zeigt je Nummer den letzten Zustand und die zuletzt gebuchte Gegenstelle.
- Journal und Container-CSV enthalten die Seriennummern der Buchung. Der Planner berechnet den Plate-Bedarf weiterhin anhand der Containermenge.
- Android verwendet die bisherige Paketsignatur und speichert Offlinebuchungen samt Seriennummern in SQLite. Die Website und die Android-App verwenden dieselbe Oberfläche.
