# Subchat Rule — Todo/Test Tool Tracking

Diese Regel gilt nur für das GitHub-Pages-Todo-/Test-Tool im Repository `MikaMcFlurry/todos`.

Wichtig: Diese Regel ersetzt **nicht** den Projektplan, nicht die Masterchat-Dokumente, nicht die technische Architektur, nicht die Finanzlogik und nicht die Claude-Code-Aufgabenbeschreibung. Für das Finanztracker-Projekt gilt weiterhin immer der aktuell bestätigte Projektplan.

## Zweck

`todo-data.json` ist ab sofort die maßgebliche Quelle für Mikas persönliche Todo- und Test-Übersicht im GitHub-Pages-Tool.

Das bedeutet nur:

- Welche Todos Mika im Tool sieht.
- Welche manuellen Tests Mika abhaken soll.
- Welche Todo-/Test-IDs für Fortschritt, Notizen und Screenshots verwendet werden.
- Welche Punkte nach einem Batch als erledigt, offen oder zu testen gelten.

Das bedeutet ausdrücklich **nicht**:

- `todo-data.json` ist keine Produkt-Spezifikation.
- `todo-data.json` ist keine technische Architekturquelle.
- `todo-data.json` ist keine Finanzlogik-Quelle.
- `todo-data.json` ersetzt keine Markdown-Handoffs, keine PR-Beschreibungen, keine Claude-Code-Prompts und keine Masterchat-Entscheidungen.

Live-Tool:
`https://mikamcflurry.github.io/todos/`

Repository:
`MikaMcFlurry/todos`

## Verbindliche Tracking-Regel

1. Für Mikas persönliche Todo-/Test-Ansicht im Tool ist `todo-data.json` die Source of Truth.
2. Normale Listenupdates erfolgen über `todo-data.json`.
3. `todo-data.json` muss immer strikt valides JSON sein. Vor jedem Commit muss der Subchat die Datei gedanklich/technisch gegen `JSON.parse` prüfen. Typische Fehler wie unescaped Anführungszeichen in Texten sind nicht erlaubt.
4. `index.html` darf nur geändert werden, wenn neue Tool-Funktionen nötig sind, nicht für normale Listenupdates.
5. Bestehende Todo-/Test-IDs dürfen nicht umbenannt, gelöscht oder für eine andere Bedeutung wiederverwendet werden.
6. Neue Todos oder Tests bekommen neue stabile IDs.
7. Wenn ein Todo/Test nicht mehr relevant ist, wird es nicht gelöscht, sondern in `todo-data.json` als `deprecated`/`replacedBy` markiert oder inhaltlich als ersetzt erklärt.
8. Fortschritt, Notizen und Screenshots müssen weiterhin über dieselben IDs auffindbar bleiben.
9. Vor größeren Tool-Strukturänderungen muss Mika angewiesen werden, im Tool zuerst `Backup exportieren` zu klicken.
10. Wenn `index.html` geändert werden muss, muss die Änderung rückwärtskompatibel mit vorhandenen localStorage-/IndexedDB-Daten bleiben.
11. Der Subchat muss Mika nach jedem Batch klar sagen:
    - welche Todo-IDs im Tool voraussichtlich abgehakt werden können,
    - welche Test-IDs jetzt manuell geprüft werden müssen,
    - welche IDs bewusst offen bleiben.
12. Keine echten Finanzdaten, Zugangsdaten, API-Keys, Supabase-Secrets oder echten Screenshots mit sensiblen Daten in GitHub committen.

## Datenmodell für `todo-data.json`

Neue Einträge müssen stabile IDs enthalten.

### Todo

```json
{
  "id": "qe-006",
  "batch": "B3",
  "batchTitle": "Quick Entry / Ausgabe erfassen",
  "time": "Do 12:00–17:00",
  "text": "Kurze klare Aufgabe",
  "tag": "UX"
}
```

### Test

```json
{
  "id": "manual-c6-new-test",
  "suite": "T-C",
  "suiteTitle": "P0-3 Quick Entry testen",
  "title": "C6 Neuer manueller Test",
  "relatedTodos": ["qe-006"],
  "when": "Nach P0-3-Fix",
  "steps": ["Schritt 1", "Schritt 2"],
  "expected": ["Erwartung 1", "Erwartung 2"]
}
```

## Update-Ablauf für Subchat

1. Aktuellen Tracking-Stand aus `MikaMcFlurry/todos/todo-data.json` lesen.
2. Neue Todos/Tests ergänzen, wenn sie für Mika als Trackingpunkt relevant sind.
3. Bestehende IDs unverändert lassen.
4. `todo-data.json` als valides JSON prüfen.
5. Nur wenn zwingend nötig `index.html` anfassen.
6. Änderungen ins Repo committen.
7. Mika den Link nennen:
   `https://mikamcflurry.github.io/todos/?v=<kurzer-update-name>`
8. Mika daran erinnern: Bei Gerätewechsel oder vor größeren Tool-Updates Backup exportieren.

## Kurzregel zum Anhängen an Prompts

Todo-Tool-Regel: Für Mikas persönliche Todo- und Testübersicht ist `MikaMcFlurry/todos/todo-data.json` die Source of Truth. Diese Regel gilt nur für das Tracking-Tool und ersetzt nicht den aktuellen Projektplan, die Masterchat-Dokumente, Claude-Code-Prompts, PRs, Architektur oder Finanzlogik. Normale Listenupdates erfolgen über `todo-data.json`. `todo-data.json` muss vor jedem Commit strikt als valides JSON geprüft werden. Bestehende Todo-/Test-IDs niemals ändern, löschen oder wiederverwenden. Neue Punkte bekommen neue stabile IDs. Mika muss nach jedem Batch die abhakebaren Todo-IDs, die jetzt nötigen Test-IDs und bewusst offene IDs genannt bekommen. Vor größeren Tool-Änderungen: Backup exportieren lassen.
