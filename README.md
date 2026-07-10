# KI-Projektmanagement-Tool

Statische, GitHub-Pages-fähige Projektübersicht für KI-gestützte Projekte. Die erste Datenbasis beschreibt den Finanztracker, die Oberfläche und das Schema sind jedoch projektübergreifend aufgebaut.

## Dateien

- `index.html`, `styles.css`, `app-core.js`, `app-views.js`, `app.js`: statische Anwendung ohne Build-Schritt.
- `project-data.json`: bereinigte öffentliche Projektstruktur.
- `todo-data.json`: unveränderte Legacy-Quelle für bestehende Batch- und Test-IDs.
- `service-worker.js`: Offline-Cache nach dem ersten erfolgreichen Laden.

## Datensicherheit

Persönliche Inhalte werden **nicht** in `project-data.json` geschrieben. Folgende Daten bleiben im Browser und werden nur in lokalen Backup-Dateien exportiert:

- Mika-Aufgaben und deren Status
- Testresultate, Geräte-/Browser-/Umgebungsangaben
- Testnotizen und tatsächliche Ergebnisse
- Screenshots
- private Schnellnotizen und allgemeine Legacy-Notizen
- lokal ergänzte Bugs, Fragen, Ideen und Entscheidungen

Vor größeren Änderungen sollte über die sichtbare Schaltfläche ein Backup exportiert werden.

## Migration

Die App lädt bevorzugt `project-data.json` und ergänzt fehlende historische Batches/Tests aus `todo-data.json`. Bestehende IDs bleiben unverändert.

Unterstützte Importformate:

- `finanztracker-todo-tool-v2`
- `ai-project-management-tool-v1`
- ältere Backups mit `done`, `notes`, `todoState` oder `testState`

Imports werden nicht-destruktiv zusammengeführt. Unbekannte Legacy-IDs bleiben im lokalen Backup erhalten und werden nicht verworfen.

## Lokaler Test

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Für die Abnahme insbesondere das Originalbackup importieren, erneut exportieren und in einem frischen Browserprofil prüfen.
