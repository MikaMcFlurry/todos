# Static limitations and private-repository guide

Stand: 2026-07-10  
Version: Project Management Tool V1.1

## Recommended operating mode

For real projects, use a **private repository** or another access-controlled deployment. The static application can still run through GitHub Pages or a simple static server, but repository visibility and page visibility must be assessed separately.

The following data may be committed only after an explicit public-safety review:

- project names and sanitized descriptions,
- public-safe phases, gates and workflow metadata,
- generic model-routing rules,
- file names and paths that reveal no confidential information,
- sanitized status and timeline entries.

The following data stays local or in protected backup files:

- personal notes,
- raw test notes and actual results,
- screenshots,
- chat transcripts and detailed chat summaries,
- local Mika tasks,
- private backup files,
- secrets, API keys, tokens and credentials.

## Static-tool limitations

The application has no backend, login or server-side authorization. Therefore it cannot safely provide:

- automatic synchronization between devices,
- automatic background ingestion of ChatGPT, Claude, Gemini or Suno chats,
- automatic repository or pull-request updates,
- automatic encrypted backup storage,
- reliable concurrent editing by multiple users,
- access control independent from the hosting platform.

V1.1 represents these workflows with statuses, reminders, metadata and file references. A human or explicitly invoked AI workflow must create and attach the real backup or handoff.

## Backup workflow

1. Export a project-specific backup before a major project change.
2. Export a global backup before schema or workspace changes.
3. Store backup files outside a public repository.
4. Prefer encrypted storage for backups containing screenshots or private notes.
5. Document a chat backup after major decisions, before and after implementation batches, and at latest after approximately 15 meaningful messages.
6. Test restoration in a fresh browser profile periodically.

## Import behavior

Imports are non-destructive:

- existing local values win where overwriting would lose user input,
- different imported content with the same ID is kept as a conflict copy,
- screenshot ID conflicts receive a new ID,
- unknown legacy task and test IDs remain in the backup state,
- projects are merged by stable project ID or added as imported projects.

## Future backend boundary

A future authenticated backend may add encrypted synchronization, roles and automatic backup reminders. It must not replace the deterministic migration rules or silently upload local private content. Such a backend requires a separate security, privacy and data-retention decision before implementation.
