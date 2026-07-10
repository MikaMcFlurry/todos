# KI-Projektmanagement-Tool V1.1

Statisches Multi-Projekt-Cockpit für standardisierte KI-Projektworkflows. Die Anwendung startet mit einer globalen Projektübersicht und öffnet anschließend projektbezogene Cockpits.

## V1.1 highlights

- Multi-project dashboard with Finanztracker and Project Management Tool seed projects.
- Project-specific dashboards and grouped navigation instead of one long side menu.
- Standard workflow phases 0–10 and approval gates 1–6.
- AI / Chats hierarchy for ChatGPT projects, masterchat, subchats, Claude Code, Gemini and Suno.
- Model-routing rules, workflow-file checklist, handoffs and chat-backup states.
- Global and project-specific backup export/import.
- Non-destructive migration from V1 and `finanztracker-todo-tool-v2` backups.
- Existing `todo-data.json` remains an unchanged legacy source for Finanztracker IDs and tests.

## Files

- `index.html`, `styles.css`, `app-core.js`, `app-views.js`, `app.js`: static application without build tooling.
- `project-data.json`: sanitized V1.1 workspace and project metadata.
- `todo-data.json`: unchanged legacy source.
- `service-worker.js`: offline app-shell cache.
- `docs/STATIC_LIMITATIONS_AND_PRIVATE_REPO_GUIDE.md`: security and hosting boundary.
- `docs/MANUAL_TEST_CHECKLIST_V1_1.md`: browser and migration acceptance checklist.

## Data separation

Committed project metadata must remain sanitized. These values stay local and are included only in protected exports:

- Mika tasks and private notes,
- test results and actual-result text,
- screenshots,
- local bugs, questions, ideas and decisions,
- chat backup references that are not safe to publish,
- unknown legacy IDs and conflict copies.

## Repository mode

A private repository is recommended for real project use. The static app does not implement authentication or automatic chat ingestion. It tracks manual or explicitly ChatGPT-assisted backup status only.

See `docs/STATIC_LIMITATIONS_AND_PRIVATE_REPO_GUIDE.md`.

## Local test

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use the original legacy backup for migration testing and repeat global/project exports in a fresh browser profile.

## Compatibility

Supported imports:

- `finanztracker-todo-tool-v2`
- `ai-project-management-tool-v1`
- `mika-ai-project-management-backup-v1.1` global scope
- `mika-ai-project-management-backup-v1.1` project scope
- older payloads containing `done`, `todoState`, `testState`, `notes` or `generalNotes`

Imports merge by stable IDs. Local user values are not silently overwritten; conflicts are retained.
