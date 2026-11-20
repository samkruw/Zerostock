# Seriennummern für Container

Der Auftrag ergänzt die veröffentlichte Mengenverwaltung um die Identität der einzelnen Container. Der Containertyp bleibt der Artikel, den der Planner für den Plate-Bedarf zählt. Jede Buchung führt die betroffenen Seriennummern mit. Web und Android verwenden dieselben Oberflächen und Datenfelder.

## Erfassung und Bestand

Vorgesehen ist die Nummer vom Containeretikett. Mitarbeitende können sie eingeben oder scannen. Eine automatische Nummernvergabe ist eine offene Präferenz. Die Zuordnung besteht aus Containertyp und Seriennummer. Führende Nullen, Bindestriche und Groß- und Kleinschreibung bleiben erhalten. Bei einer typenübergreifenden Suche müssen mehrdeutige Treffer unterscheidbar bleiben.

Beim Anlegen eines neuen Containerartikels lassen sich die Seriennummern des Anfangsbestands erfassen. Für bestehende Containerartikel zeigt die App die bereits zugeordneten Stücke und die noch unzugeordnete Menge. Eine Bestandszuordnung erfasst tatsächlich vorhandene Nummern innerhalb dieser Menge. Sie erzeugt keinen Wareneingang. Eine spätere Bearbeitung der Artikelstammdaten darf die erfassten Einheiten nicht aus dem Bestand entfernen.

## Buchung und Rückkehr

Ein Eingang mit einer neuen Nummer legt eine Einheit im Lager an. Ein Ausgang oder Schwund bezieht sich auf eine im Lager vorhandene Einheit. Ein erneuter Eingang derselben ausgelieferten oder als Schwund gebuchten Einheit setzt ihren Zustand wieder auf „Im Lager“. Mehrere physische Container können in einer Buchung erfasst werden. Die Stückzahl ergibt sich aus den unterschiedlichen Nummern. Doppelte Nummern, ein zweiter Eingang im Lager und ein zweiter Ausgang werden vor der Bestandsänderung zurückgewiesen.

Der Bestand zeigt pro Containertyp die Seriennummern und ihren aktuellen Zustand. Ein- und Ausgänge sind mit Seriennummern im bestehenden Bewegungsjournal und im Container-CSV nachvollziehbar. Journal und Export nennen bei einer eingeschränkten Ansicht den Umfang der geladenen Bewegungen. Die Kundensicht erhält weiterhin die freigegebenen Planungsergebnisse. Für eine spätere Verbindung zu Container Track stehen Artikelkennung, Seriennummer und Bewegungs-ID zur Verfügung.

## Technischer Ansatz

Ein einzelnes Textfeld am Artikel reicht für einen Containertyp mit mehreren Exemplaren nicht aus. Eine reine Notiz im Journal könnte zwei Ausgänge desselben Containers zulassen. Deshalb speichert ZeroStock den aktuellen Zustand jeder Einheit beim Containertyp und die betroffenen Nummern als unveränderlichen Snapshot in der Bewegung. Ein Vorgriff auf eine externe Container-Track-API erfordert einen noch ausstehenden Schnittstellenvertrag.

Die vorhandene Firebase-Transaktion am Artikel aktualisiert Serienzustände und Mengen gemeinsam. Sie prüft den aktuellen Serverzustand bei jeder Wiederholung. Der Bewegungsschlüssel bleibt der Idempotenzschlüssel. Die native SQLite-Transaktion schreibt Artikelzustand, Bewegung und Warteschlange zusammen. Nach einem neuen Server-Snapshot werden lokale, noch nicht verrechnete Vorgänge in ihrer Reihenfolge berücksichtigt. Zuordnungen zum vorhandenen Bestand benötigen eine Live-Verbindung. Ältere Buchungen ohne Seriennummern behalten ihre ursprünglichen Daten. Sie dürfen keine bereits identifizierte Einheit stillschweigend ausbuchen.

Die Umsetzung verwendet die bestehenden Rollen, Eingangs-/Ausgangs-/Schwundarten und Signatur. Der Planner zählt Mengen unabhängig von der Seriennummer. Prüffälle umfassen nachträgliche Zuordnung, doppelte und unbekannte Nummern, Aus- und Wiedereingang, getrennte Plate-Bestände, zwei konkurrierende Ausgänge, unterbrochenen Journalabgleich und einen Android-Neustart mit ausstehender Buchung.
