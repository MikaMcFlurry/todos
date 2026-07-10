# Static limitations and private-repository guide

Stand: 2026-07-10  
Version: Project Management Tool V1.1 follow-up

## Recommended operating mode

For real projects, use a **private repository** or another access-controlled deployment. The static application can still run through GitHub Pages or a simple static server, but repository visibility and page visibility must be assessed separately.

A private repository is an access boundary, not a secrets vault. API keys, passwords, tokens and unreviewed credential files must remain outside the repository even when it is private.

The following data may be committed only after an explicit public-safety review:

- project names and sanitized descriptions,
- public-safe phases, gates and workflow metadata,
- generic model-routing rules,
- file names and paths that reveal no confidential information,
- sanitized status and timeline entries,
- sanitized handoff metadata without private chat contents.

The following data stays local or in protected backup files:

- personal notes,
- raw test notes and actual results,
- screenshots,
- chat transcripts and detailed private chat summaries,
- local Mika tasks,
- local gate approvals, checklist state and blocker notes,
- imported project-metadata conflict snapshots,
- private backup and handoff files,
- secrets, API keys, tokens and credentials.

## Static-tool limitations

The application has no backend, login or server-side authorization. Therefore it cannot safely provide:

- automatic synchronization between devices,
- automatic background ingestion of ChatGPT, Claude, Gemini or Suno chats,
- automatic repository or pull-request updates,
- automatic encrypted backup storage,
- reliable concurrent editing by multiple users,
- access control independent from the hosting platform,
- automatic verification that a referenced handoff or chat backup still exists.

V1.1 represents these workflows with statuses, reminders, metadata and file references. A human or explicitly invoked AI workflow must create and attach the real backup or handoff. The UI must never describe this process as automatic background ingestion.

## Backup workflow

1. Export a project-specific backup before a major project change.
2. Export a global backup before schema or workspace changes.
3. Store backup files outside a public repository.
4. Prefer encrypted storage for backups containing screenshots, financial information or private notes.
5. Document a chat backup after major decisions, before and after implementation batches, before context resets and at latest after approximately 15 meaningful messages.
6. Link a completed subchat to its masterchat handoff and record the resulting project-status update.
7. Test restoration in a fresh browser profile periodically.
8. Review sanitized project metadata before every repository commit.

## Import scopes

The import controls are intentionally separated:

- **Global import** accepts global V1.1 workspace backups and compatible legacy backups.
- **Project import** accepts project-scoped V1.1 backups and compatible legacy backups.
- A global V1.1 backup is rejected by project import so unrelated projects cannot be pulled into the selected project by mistake.
- A project-scoped V1.1 backup is rejected by global import so a partial backup is not mistaken for a complete workspace restoration.
- Legacy backups without a V1.1 scope remain compatible and are assigned to the Finanztracker compatibility project.

## Non-destructive merge behavior

Imports remain non-destructive:

- existing local values win where overwriting would lose user input,
- different imported local content with the same ID is kept as a conflict copy,
- screenshot ID conflicts receive a new ID,
- unknown legacy task and test IDs remain in the backup state,
- new project IDs are added as imported projects,
- same-ID project metadata contributes previously unknown items, AI contexts, chats and handoffs without replacing current local/static values,
- conflicting same-ID project snapshots remain locally recorded for later review.

## Standard AI workflow boundary

The static tool visualizes and tracks:

- project lifecycle phases 0–10,
- Mika approval gates 1–6,
- gate checklists, blockers and local approval state,
- ChatGPT project, masterchat and specialist subchat hierarchy,
- Claude Code/Codex implementation batches,
- Gemini review and Suno-specific routing,
- handoffs, tests, review and backup status,
- standard repository and workflow-file readiness.

It does not autonomously decide that a gate is approved, create a real chat backup or authorize an implementation batch. Those actions require Mika or an explicitly invoked, reviewable AI workflow.

## Future backend boundary

A future authenticated backend may add encrypted synchronization, roles and automatic reminder delivery. It must not replace the deterministic migration rules or silently upload local private content. Such a backend requires a separate security, privacy, data-retention and deletion-policy decision before implementation.
