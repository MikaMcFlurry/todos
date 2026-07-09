# Subchat Rule — Todo/Test Tool Updates

Diese Regel gilt ab sofort für jeden weiteren Subchat im Finanztracker-Projekt, der Todos, Tests, Batches oder Handoff-Listen für Mika aktualisiert.

## Ziel

Das GitHub-Pages-Tool im Repository `MikaMcFlurry/todos` muss aktualisierbar bleiben, ohne dass Mikas Fortschritt, Testnotizen oder Screenshot-Anhänge verloren gehen.

Live-Tool:
`https://mikamcflurry.github.io/todos/`

Repository:
`MikaMcFlurry/todos`

## Verbindliche Regel

1. Der Subchat darf für normale Todo-/Testlisten-Updates grundsätzlich nur `todo-data.json` im Repository `MikaMcFlurry/todos` ändern.
2. `index.html` darf nur geändert werden, wenn neue Tool-Funktionen nötig sind, nicht für normale Listenupdates.
3. Bestehende IDs dürfen niemals umbenannt, gelöscht oder für eine andere Bedeutung wiederverwendet werden.
4. Neue Todos oder Tests müssen neue stabile IDs bekommen.
5. Wenn ein Todo/Test nicht mehr relevant ist, wird es nicht gelöscht, sondern in `todo-data.json` als `deprecated`/`replacedBy` markiert oder inhaltlich als erledigt/ersetzt erklärt.
6. Fortschritt, Notizen und Screenshots müssen weiterhin über dieselben IDs auffindbar bleiben.
7. Vor größeren Strukturänderungen muss Mika angewiesen werden, im Tool zuerst `Backup exportieren` zu klicken.
8. Wenn `index.html` geändert werden muss, muss die Änderung rückwärtskompatibel mit vorhandenen localStorage-/IndexedDB-Daten bleiben.
9. Der Subchat muss Mika nach jedem Batch klar sagen:
   - welche Todo-IDs voraussichtlich abgehakt werden können,
   - welche Test-IDs jetzt manuell geprüft werden müssen,
   - welche IDs bewusst offen bleiben.
10. Keine echten Finanzdaten, Zugangsdaten, API-Keys, Supabase-Secrets oder echten Screenshots mit sensiblen Daten in GitHub committen.

## Datenmodell für `todo-data.json`

Neue Einträge müssen stabile IDs enthalten:

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

1. Aktuellen Stand aus `MikaMcFlurry/todos/todo-data.json` lesen.
2. Neue Todos/Tests ergänzen.
3. Bestehende IDs unverändert lassen.
4. Nur wenn zwingend nötig `index.html` anfassen.
5. Änderungen ins Repo committen.
6. Mika den Link nennen:
   `https://mikamcflurry.github.io/todos/?v=<kurzer-update-name>`
7. Mika daran erinnern: Bei Gerätewechsel oder vor größeren Updates Backup exportieren.

## Kurzregel zum Anhängen an Prompts

Todo-Tool-Regel: Aktualisiere für Mika das GitHub-Pages-Todo-Tool ausschließlich update-sicher. Normale Listenupdates erfolgen nur über `MikaMcFlurry/todos/todo-data.json`. Bestehende Todo-/Test-IDs niemals ändern, löschen oder wiederverwenden. Neue Punkte bekommen neue stabile IDs. Wenn `index.html` geändert werden muss, muss es rückwärtskompatibel bleiben. Mika muss nach jedem Batch die abhakebaren Todo-IDs und die jetzt nötigen Test-IDs genannt bekommen. Vor größeren Änderungen: Backup exportieren lassen.
