# KI-Projektmanagement-Tool V1.1

Statisches Multi-Projekt-Cockpit für standardisierte KI-Projektworkflows. Die Anwendung startet mit einer globalen Projektübersicht und öffnet anschließend projektbezogene Cockpits.

## V1.1 highlights

- Multi-project dashboard with Finanztracker and Project Management Tool seed projects.
- Project-specific dashboards with a compact command bar and grouped `More` panel instead of a permanent long side menu.
- Standard workflow phases 0–10 and approval gates 1–6.
- Gate checklists, locally documented Mika approval and local blocker notes.
- AI / Chats hierarchy for ChatGPT projects, masterchat, subchats, Claude Code/Codex, Gemini and Suno.
- Visible workflow chain from ChatGPT project context through handoff, implementation, review and backup.
- Model-routing rules, workflow-file checklist, handoff references and chat-backup states.
- Global and project-specific backup export/import with strict scope guards.
- Non-destructive project-metadata merging: existing values win, new IDs are added, conflicting snapshots remain locally preserved.
- Non-destructive migration from V1 and `finanztracker-todo-tool-v2` backups.
- Existing `todo-data.json` remains an unchanged legacy source for Finanztracker IDs and tests.

## Files

- `index.html` and the `styles*.css` files: responsive application shell and cockpit layouts.
- `app-core*.js`, `app-views*.js`, `app*.js`: data model, migration, views and interaction modules.
- `app-v1-1-polish.js`, `styles-v1-1-polish.css`: follow-up navigation, gate, handoff and import-safety hardening.
- `project-data.json`: sanitized global workspace, workflow and routing templates.
- `projects/*.json`: sanitized project-specific metadata.
- `todo-data.json`: unchanged legacy source.
- `service-worker.js`: offline app-shell cache.
- `tests/v1-1-static-checks.mjs`: repeatable schema, asset, privacy, workflow and legacy-integrity checks.
- `.github/workflows/static-checks.yml`: branch checks for JavaScript syntax, static assets and protected legacy data.
- `docs/STATIC_LIMITATIONS_AND_PRIVATE_REPO_GUIDE.md`: security and hosting boundary.
- `docs/MANUAL_TEST_CHECKLIST_V1_1.md`: browser and migration acceptance checklist.

## Data separation

Committed project metadata must remain sanitized. These values stay local and are included only in protected exports:

- Mika tasks and private notes,
- test results and actual-result text,
- screenshots,
- local bugs, questions, ideas and decisions,
- gate approvals, checklist status and blocker notes,
- chat backup references that are not safe to publish,
- imported metadata conflict snapshots,
- unknown legacy IDs and conflict copies.

## Export and import scopes

`Global export` contains the whole locally known workspace. `Project export` contains only the selected project, its local state and screenshots assigned to that project.

The corresponding import controls are intentionally separated:

- a global V1.1 backup is rejected by project import,
- a project-scoped V1.1 backup is rejected by global import,
- legacy backups without a V1.1 scope remain importable and are assigned to the Finanztracker compatibility project,
- local values win during conflicts and imported alternatives remain recoverable.

## Repository mode

A private repository is recommended for real project use. Private repositories still must not contain API keys, passwords or unreviewed raw exports.

The static app does not implement authentication, background synchronization or automatic chat ingestion. It tracks manual or explicitly ChatGPT-assisted backup status only. Chat contents are included only through an intentional project update or protected import.

See `docs/STATIC_LIMITATIONS_AND_PRIVATE_REPO_GUIDE.md`.

## Local test

```bash
for file in ./*.js; do node --check "$file"; done
node tests/v1-1-static-checks.mjs
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
