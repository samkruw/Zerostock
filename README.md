# ZeroStock V3.2 – Form Fix

## Behobene Hauptursache

Die DE/EN-Umschaltung hat bisher bei Elementen wie:

```html
<label data-i18n="article">
  Artikel
  <input id="cArticle">
</label>
```

`textContent` auf das gesamte Label gesetzt.

Dadurch wurde das enthaltene `<input>` aus dem DOM gelöscht.

Das verursachte unter anderem:
- `UI-Feld fehlt: cArticle`
- frühere Planner-Fehler mit `disabled`
- verschwundene Formularfelder nach `applyLang()`

## V3.2

Die Übersetzung ändert jetzt nur noch den direkten Textknoten des Elements.
Enthaltene Inputs, Selects, Textareas und Buttons bleiben vollständig erhalten.

Zusätzlich:
- Karton anlegen bleibt robust aus V3.1
- Planner-Fix bleibt erhalten
- Firebase Login / Rollen bleiben erhalten
- QR, TINST, Schwund und Multiuser bleiben erhalten
- professionelles PWA-Logo bleibt erhalten
- Desktop + Android PWA
