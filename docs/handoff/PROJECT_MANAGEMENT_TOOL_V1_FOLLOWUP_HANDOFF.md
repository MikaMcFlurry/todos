# Project Management Tool V1 Follow-up Handoff

Status: READY FOR CODEX FOLLOW-UP  
Repository: `MikaMcFlurry/todos`  
Current V1 branch: `codex/project-management-tool-v1`  
Follow-up branch: `codex/project-management-tool-v1-followup`  
Base commit of V1 branch reported by Codex: `aa0dde813b060e37bcd2e8479526d80c71977de7`  
Goal: turn the current single-project static V1 into a stronger multi-project AI workflow cockpit.

---

## 1. Short Codex start prompt

```text
Work in repository `MikaMcFlurry/todos` on branch `codex/project-management-tool-v1-followup`.

Read first:
`docs/handoff/PROJECT_MANAGEMENT_TOOL_V1_FOLLOWUP_HANDOFF.md`

Goal: improve the Project Management Tool V1 based on Mika's latest review.

Do not merge. Do not open a PR. Do not modify `todo-data.json` except if explicitly instructed later. Keep all import/export and legacy data protections intact.

Before editing, inspect the existing implementation from `codex/project-management-tool-v1`, then produce a short plan.

Implement a follow-up V1.1 focused on:
1. Multi-project dashboard as the first screen.
2. Project-specific pages after selecting a project.
3. Better visual/UX structure; the current side menu is too cluttered.
4. AI workflow model: KI area containing models and all related chats, including ChatGPT projects, masterchat and subchats.
5. Project-specific and global export/import.
6. Backup/workflow rules prepared for private-repo usage.
7. Clear integration of the standardized AI project workflow phases, gates, files, handoffs, backups and model-routing logic.

If a requirement cannot be implemented safely in the static tool, implement the UI/schema placeholder and document the technical limitation clearly.

Run the same static checks as before and report exact results.
```

---

## 2. Mika's review of current V1

Mika tested the current V1 visually on mobile and does **not** want it merged as-is.

Main feedback:

- Visually and operationally it is not good enough.
- The side menu is too cluttered and not sufficiently structured.
- Timeline is not integrated well.
- The tool should not start directly in a single project dashboard.
- The first screen should be a **tile dashboard with all projects**.
- For the beginning, there are two projects:
  1. `Buchhaltungs Tool / Finanz Tracker`
  2. `Projektmanagement Tool`
- Selecting a project opens that project's project page.
- Export must be possible both project-specific and globally for everything.
- The project overview must be strongly improved and adapted to Mika's real AI workflow.
- The tool must already align with Mika's planned standardized AI project workflow.
- The project management tool should become the central place where relevant project information, tasks, chats, backups, decisions and tests are documented.

---

## 3. Important technical/product clarification

Mika assumes that the tool likely needs to move to a **private repository**.

Treat this as the new target direction.

For V1.1:

- Keep static operation possible.
- Clearly separate public-safe sample/project metadata from private user data.
- Add UI/documentation that recommends private repo usage for real projects.
- Do **not** leak personal notes, screenshots, real backups or sensitive chat summaries into a public `project-data.json`.
- If the repo remains public for now, the UI must make clear what is safe to commit and what stays local/export-only.

Important limitation:

The current static GitHub Pages tool cannot truly auto-capture ChatGPT conversations in the background. ChatGPT can only update the tool/repo when Mika explicitly works with ChatGPT and grants/uses the connected tools. Therefore implement the concept as:

- `planned / manual / ChatGPT-assisted` backups,
- status fields for backup recency,
- import/upload fields or metadata slots for backups,
- rules reminding ChatGPT/Mika to update the project tool after meaningful work,
- not as fake fully automatic background sync.

Do not claim full automatic chat ingestion exists unless it is actually implemented.

---

## 4. New desired information architecture

### 4.1 App start screen: Global Project Dashboard

The first screen should be a global project overview, not the Finanztracker dashboard.

It should show project tiles/cards with:

- project name,
- short description,
- status,
- phase,
- progress,
- open Mika tasks,
- open bugs,
- open decisions/questions,
- last update,
- last backup,
- next recommended action,
- important warning/change badge if relevant.

Initial projects:

```text
project-finanztracker
Name: Buchhaltungs Tool / Finanz Tracker
Status: Active development / Private Beta planning+implementation

project-management-tool
Name: Projektmanagement Tool
Status: V1.1 design/follow-up
```

### 4.2 Project page

After opening a project, the user lands on a project-specific page with a clear project cockpit.

Recommended sections:

- Overview / Dashboard
- Goals & Scope
- Phases & Gates
- Batches
- Mika Tasks
- Tests / QA
- Bugs
- Ideas
- Open Questions
- Decisions
- AI / Chats
- Files & Backups
- GitHub / PRs
- Timeline
- Risks
- Data & Validation
- Local Notes

But the side menu must be less overwhelming.

Suggested UX:

- Show a compact project dashboard first.
- Group navigation into categories instead of one long list.
- Use tabs/accordion groups, e.g.:
  - `Steuerung`: Overview, Next Steps, Phases/Gates, Decisions
  - `Umsetzung`: Batches, GitHub/PRs, Files
  - `Qualität`: Tests, Bugs, Risks
  - `Wissen`: AI/Chats, Backups, Notes
  - `Ideen`: Ideas, Open Questions
- On mobile, avoid a huge side drawer list as the primary navigation. Prefer bottom tabs for the 4-5 most common areas and a grouped `More` panel.

### 4.3 Timeline

Timeline must be more integrated.

It should not feel like a separate unconnected menu item.

Possible solution:

- Show a mini timeline on project dashboard.
- Full timeline page groups events by type/date:
  - project created,
  - chat backup created,
  - handoff created,
  - Codex/Claude batch started/finished,
  - PR opened/merged,
  - Mika decision,
  - test pass/fail,
  - bug created/resolved.
- Link timeline items to related project section where possible.

---

## 5. AI workflow model to implement in the tool

The `Masterchat` and `Subchats` areas should be merged into a broader **AI / Chats** model.

### 5.1 AI model hierarchy

Each project should have a structured `aiModels` or `aiUsage` area.

Example structure:

```json
{
  "aiModels": [
    {
      "id": "ai-chatgpt",
      "name": "ChatGPT",
      "role": "Project steering, masterchat, review, handoffs",
      "status": "active",
      "contexts": [
        {
          "id": "chatgpt-project-finanztracker",
          "type": "chatgpt_project",
          "name": "Finanz Tracker Tool",
          "status": "active",
          "chats": [
            {
              "id": "masterchat-finanztracker",
              "type": "masterchat",
              "name": "Masterchat",
              "status": "active",
              "purpose": "Project steering, PR review, handoffs, decisions",
              "lastBackupAt": null,
              "backupStatus": "needed",
              "latestBackupRef": null
            },
            {
              "id": "subchat-security",
              "type": "subchat",
              "name": "Security / Privacy Subchat",
              "status": "done",
              "purpose": "Security and privacy plan",
              "latestBackupRef": null
            }
          ]
        }
      ]
    },
    {
      "id": "ai-claude-code",
      "name": "Claude Code",
      "role": "Implementation and refactoring",
      "status": "active",
      "chats": []
    },
    {
      "id": "ai-gemini",
      "name": "Gemini",
      "role": "Second opinion and long-context analysis",
      "status": "optional",
      "chats": []
    },
    {
      "id": "ai-suno",
      "name": "Suno",
      "role": "Music/audio only",
      "status": "optional",
      "chats": []
    }
  ]
}
```

### 5.2 Chat fields

Every chat entry should support:

- clear name,
- model/tool,
- type: masterchat, subchat, codex, claude-code, gemini-review, suno, other,
- purpose,
- scope,
- status: planned, active, paused, done, archived,
- current summary,
- last backup timestamp,
- backup status,
- latest backup reference/file,
- related handoffs,
- related PRs/commits,
- next action.

### 5.3 Backup concept for chats

The tool should support tracking and storing references to chat backups.

Mika's target rule:

- Masterchat and subchats should create backups regularly, at latest after about 15 messages, earlier after major decisions or before/after Claude batches.

V1.1 should implement this as a visible process:

- backup reminder/status per chat,
- field/list for backup entries,
- manual add/import backup entry,
- link backup to project/chats/files,
- dashboard warning if backup is overdue.

Do not fake automatic background chat capture.

---

## 6. Standard AI project workflow to include

The tool should include or visualize the following workflow logic.

### 6.1 Roles

- Mika: owner, decision-maker, product owner.
- ChatGPT Project: organizational center.
- Masterchat: project steering, quality control, handoffs, PR review, decision log.
- Subchats: specialized work areas created by masterchat.
- Claude Code: implementation only after clear handoff.
- Gemini: second opinion / long context / alternative assessment.
- Suno: music/audio tasks.

### 6.2 Lifecycle phases

Each project should support phases:

0. Project idea
1. Project briefing
2. Workflow setup
3. Requirements and scope
4. Architecture and implementation planning
5. Claude-Code preparation
6. Implementation
7. Test and review
8. Rework
9. Beta/release
10. Maintenance/archive

### 6.3 Gates

Each project should support gates:

1. Idea understood
2. Scope defined
3. Implementation ready
4. Batch ready
5. Batch reviewed
6. Beta ready

Each gate should support status, checklist items, blockers, and Mika approval where required.

### 6.4 Standard repository/file structure

The tool should include awareness/checklist for a standard project repository structure:

```text
README.md
CHANGELOG.md
CURRENT_STATE.md
docs/00_PROJECT_IDEA.md
docs/01_PROJECT_BRIEFING.md
docs/02_REQUIREMENTS.md
docs/03_SCOPE.md
docs/04_FEATURE_LIST.md
docs/05_NON_GOALS.md
docs/06_ARCHITECTURE.md
docs/07_DATA_MODEL.md
docs/08_UI_UX_STRUCTURE.md
docs/09_TEST_STRATEGY.md
docs/10_SECURITY_PRIVACY.md
docs/decisions/DECISION_LOG.md
ai-workflow/GLOBAL_PROJECT_RULES.md
ai-workflow/MASTERCHAT_RULES.md
ai-workflow/SUBCHAT_RULES.md
ai-workflow/BACKUP_RULES.md
ai-workflow/MODEL_ROUTING_RULES.md
ai-workflow/CLAUDE_CODE_RULES.md
handoffs/claude/
handoffs/subchats/
handoffs/archive/
backups/masterchat/
backups/subchats/
backups/project-status/
project-tool/
tests/
archive/
```

This should be visible as guidance/checklist, not necessarily enforced physically by the static tool.

---

## 7. Required reusable workflow files to track

The tool should represent or track the creation status of these future workflow documents:

1. `GLOBAL_AI_WORKFLOW_RULES.md`
2. `CHATGPT_PROJECT_INSTRUCTIONS_TEMPLATE.md`
3. `MASTERCHAT_RULES.md`
4. `SUBCHAT_STARTPROMPT_TEMPLATE.md`
5. `SUBCHAT_BACKUP_TEMPLATE.md`
6. `PROJECT_REPOSITORY_STRUCTURE.md`
7. `PROJECT_MANAGEMENT_TOOL_SPEC.md`
8. `CLAUDE_CODE_HANDOFF_TEMPLATE.md`
9. `CLAUDE_BATCH_PROMPT_TEMPLATE.md`
10. `MODEL_ROUTING_RULES.md`
11. `PROJECT_STATUS_TEMPLATE.md`
12. `DECISION_LOG_TEMPLATE.md`
13. `TEST_AND_ACCEPTANCE_RULES.md`
14. `BACKUP_AND_ARCHIVE_RULES.md`
15. `MIKA_APPROVAL_GATES.md`

The most important next workflow document is:

```text
CHATGPT_PROJECT_INSTRUCTIONS_TEMPLATE.md
```

The tool should make this visible as a next milestone for the Projectmanagement Tool project.

---

## 8. Data model changes requested

Extend `project-data.json` conceptually from one project to many projects.

Recommended top-level structure:

```json
{
  "schema": "mika-ai-project-management-tool-v1.1",
  "updatedAt": "YYYY-MM-DD",
  "global": {
    "toolName": "KI-Projektmanagement",
    "privacyMode": "private_repo_recommended",
    "backupPolicy": {}
  },
  "projects": [
    {
      "id": "project-finanztracker",
      "name": "Buchhaltungs Tool / Finanz Tracker",
      "shortName": "Finanztracker",
      "status": "active",
      "phase": "Implementation / Private Beta stabilization",
      "progress": {},
      "nextAction": "Continue P1-4 Daily UX Stabilization after Claude report",
      "warning": null,
      "sections": {},
      "aiModels": [],
      "chats": [],
      "backups": [],
      "files": [],
      "github": {},
      "timeline": [],
      "risks": []
    },
    {
      "id": "project-management-tool",
      "name": "Projektmanagement Tool",
      "shortName": "PM Tool",
      "status": "active",
      "phase": "V1.1 follow-up design/implementation",
      "nextAction": "Implement multi-project dashboard and AI workflow structure"
    }
  ],
  "workflowTemplates": {},
  "legacySources": {}
}
```

Important:

- Preserve import of existing V1 `project-data.json`.
- Preserve import of legacy `todo-data.json`.
- Preserve import of old backup exports.
- Do not overwrite local private content.
- Unknown legacy IDs must still be retained/displayed.

---

## 9. Import/export requirements

### 9.1 Global export

Exports everything the local browser knows:

- all projects,
- all local status,
- all local notes,
- screenshots,
- backups stored locally,
- unknown legacy IDs,
- conflict copies.

### 9.2 Project-specific export

Exports one selected project:

- project metadata,
- tasks/tests/bugs/decisions/questions for that project,
- AI/chats/backups for that project,
- screenshots related to that project,
- local notes related to that project,
- no unrelated project data unless explicitly selected.

### 9.3 Import behavior

Import must remain non-destructive:

- local existing values win where conflict would overwrite user input,
- imported conflicting values are preserved as conflict copies,
- screenshots with ID conflict get new IDs,
- imported project can be merged into existing project by ID or added as new project,
- user should get a clear summary of what was imported/merged/conflicted.

---

## 10. UX requirements

### 10.1 Visual direction

Mika does not like the current mobile layout and side menu.

Direction:

- more cockpit/dashboard-like,
- less giant side menu,
- clearer grouped sections,
- better hierarchy,
- project tiles first,
- project-specific page after selection,
- mobile-first, but not cramped,
- fewer huge always-visible lists,
- clearer next actions.

### 10.2 Mobile navigation

Current issue: long side menu is overwhelming.

Prefer:

- global project switcher / project cards,
- project dashboard,
- 4-5 primary bottom tabs within a project,
- grouped More sheet,
- search as utility, not main navigation,
- persistent way back to project overview.

### 10.3 Timeline integration

- Show important timeline highlights on dashboard.
- Full timeline should be filterable by type.
- Timeline should connect to decisions, batches, tests, backups, chats and PRs.

---

## 11. Acceptance criteria

### Multi-project structure

- App starts with project tile dashboard.
- At least two projects exist: Finanztracker and Projectmanagement Tool.
- Opening a project shows project-specific dashboard.
- User can switch back to all-project dashboard.
- Global progress and project progress are clearly separated.

### Navigation/UX

- Side menu is no longer one overwhelming list.
- Project sections are grouped logically.
- Mobile navigation is usable on iPhone-sized screens.
- Backup import/export remains easily accessible but not visually dominating the menu.

### AI/chats structure

- Masterchat and subchats are integrated into `AI / Chats`.
- AI models are visible: ChatGPT, Claude Code, Gemini, Suno.
- Chats under each model can show purpose, summary, status and backup state.
- ChatGPT project → Masterchat/Subchat hierarchy can be represented.

### Backup/workflow

- Tool can track backup status per chat.
- Tool shows backup reminders/overdue states.
- It does not falsely claim automatic background ingestion.
- Private repo recommendation is visible.

### Import/export

- Existing original backup still imports.
- Existing V1 data still loads.
- Legacy `todo-data.json` still remains usable as fallback/legacy source.
- Project-specific and global export both exist or are clearly staged if one cannot fit in V1.1.
- No local user content is destructively overwritten.

### Data safety

- `project-data.json` contains no private screenshots, no raw personal test notes, no secrets, no access tokens.
- If the repo is public, private content remains local/export-only.
- If private repo mode is enabled/documented, the UI explains the difference.

---

## 12. Tests / verification required

Run at minimum:

- JavaScript syntax check for all JS files.
- JSON parse/validation for `project-data.json`.
- Local static server load test.
- Service worker file list check.
- Manual browser smoke test if possible.
- Import original backup.
- Export global backup.
- Export project-specific backup.
- Import global backup into fresh browser profile.
- Import project-specific backup into fresh browser profile.
- Mobile viewport smoke test.
- Search smoke test.
- Check for obvious secrets/private data in public JSON.

Report exact results.

---

## 13. Hard rules

- Do not merge.
- Do not open a PR unless Mika/ChatGPT explicitly asks.
- Do not delete branches.
- Do not modify `todo-data.json` unless explicitly instructed later.
- Do not discard legacy backup compatibility.
- Do not overwrite local user data on import.
- Do not put private notes/screenshots into public `project-data.json`.
- Do not claim automatic ChatGPT background backups if not implemented.

---

## 14. Final report required

Return:

1. Branch and commit SHA.
2. Summary of changed UX/information architecture.
3. Changed files.
4. Data model changes.
5. Import/export behavior.
6. How AI/chats/backups are represented.
7. What remains manual/limited.
8. Tests/checks run and results.
9. Whether any requirements were not implemented and why.
10. Explicit confirmation that `todo-data.json` and private data were not touched.
