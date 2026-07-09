# Finanztracker 48h Todo & Test Tool

Statisches GitHub-Pages-Tool für das Finanztracker-Projekt.

Live:

`https://mikamcflurry.github.io/todos/`

## Funktionen

- Todos nach Batches abhaken
- manuelle Tests nach Testgruppen abhaken
- pro Test Notizen speichern
- pro Test Screenshots lokal anhängen
- Gesamtfortschritt für Todos und Tests sehen
- Backup exportieren/importieren
- Listen über `todo-data.json` aktualisieren, ohne Fortschritt zu löschen

## Speicherung

- Todo-Haken und Testnotizen: `localStorage`
- Screenshots: `IndexedDB`
- Alles bleibt lokal im jeweiligen Browser.
- GitHub Pages kann Screenshots nicht serverseitig speichern.
- Für Gerätewechsel oder größere Updates immer `Backup exportieren` nutzen.

## Update-sichere Listenpflege

Normale Listenupdates erfolgen nur über:

`todo-data.json`

Die App `index.html` lädt diese Datei dynamisch. Dadurch kann der Subchat Todos und Tests erweitern, ohne Mikas lokalen Fortschritt zu löschen.

Wichtig:

- IDs niemals umbenennen.
- IDs niemals wiederverwenden.
- Neue Todos/Tests immer mit neuer stabiler ID ergänzen.
- Alte Punkte nicht löschen, sondern als ersetzt/veraltet markieren, falls nötig.

Die verbindliche Regel steht in:

`SUBCHAT_TODO_TOOL_UPDATE_RULE.md`

## GitHub Pages aktivieren

Falls die Seite nicht erreichbar ist:

1. GitHub Repo öffnen: `MikaMcFlurry/todos`
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main`
5. Folder: `/ (root)`
6. Save

Danach einige Minuten warten.
