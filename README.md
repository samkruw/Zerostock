# ZeroStock V3.0 – Startup Fix

## Behobener Fehler
`Cannot set properties of null (setting 'disabled')`

Der Fehler entstand während der UI-Initialisierung des Packing Planners.
Dadurch wurde ein bereits erfolgreicher Firebase-Rollenlogin fälschlich als
Rollenfehler dargestellt.

## Änderungen
- Planner-Start ist null-sicher.
- `renderPlanSelect()` prüft alle DOM-Elemente vor Zugriff.
- `calcPlan()` prüft alle Planner-Elemente.
- Dashboard-Renderfunktionen laufen isoliert, damit ein einzelner UI-Fehler nicht die App blockiert.
- Nach erfolgreich geladener Firebase-Rolle kann ein UI-Fehler nicht mehr den Rollenfehler-Screen auslösen.
- Firebase SDK + REST Rollen-Fallback aus V2.9 bleibt erhalten.
- Professionelles ZeroStock PWA Logo bleibt enthalten.
- Firebase Database URL bleibt fest eingebaut.
- Desktop + Android PWA bleiben unterstützt.

## Erwarteter Ablauf
Login → Firebase Rolle `admin` → Dashboard.

Falls eine einzelne UI-Komponente fehlschlägt, bleibt ZeroStock geöffnet und schreibt den
Fehler nur in die Browser-Konsole, statt den Benutzer aus dem Dashboard zu werfen.
