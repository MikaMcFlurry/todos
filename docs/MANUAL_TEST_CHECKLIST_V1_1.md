# Project Management Tool V1.1 — manual test checklist

## Workspace and projects

- App opens on the all-project tile dashboard.
- Two initial projects are visible: Finanztracker and Projektmanagement Tool.
- Each tile shows status, phase, progress, open items, backup state and next action.
- Opening a project shows its project cockpit.
- “Alle Projekte” returns to the workspace without losing local state.

## Navigation and mobile

- Desktop project navigation is grouped into Steuerung, Umsetzung, Qualität and KI & Wissen.
- Mobile bottom navigation contains Overview, Work, Quality, AI and More.
- The More drawer contains grouped project navigation, search and backup actions.
- On an iPhone-sized viewport, `document.documentElement.scrollWidth <= window.innerWidth`.
- Long tests and long German labels do not force horizontal scrolling.

## AI workflow

- ChatGPT, Claude Code, Gemini and Suno are visible in AI / Chats.
- ChatGPT project, masterchat and subchats are represented hierarchically.
- Chat backup state can be changed and manually documented.
- The UI clearly states that automatic background chat ingestion is not implemented.
- Model-routing rules are visible.

## Workflow phases and gates

- Lifecycle phases 0–10 are visible.
- Gates 1–6 show status, checklist and Mika-approval requirement.
- Standard repository/file checklist is visible.
- The 15 reusable workflow documents are visible.
- `CHATGPT_PROJECT_INSTRUCTIONS_TEMPLATE.md` is marked as the next important milestone for the PM Tool project.

## Export and import

- Global export contains all project local states and all screenshots.
- Project export contains only the selected project and its screenshots.
- Original `finanztracker-todo-tool-v2` backup imports into the Finanztracker project.
- V1 `ai-project-management-tool-v1` backup imports without losing notes or screenshots.
- V1.1 global export imports into a fresh browser profile.
- V1.1 project export imports into a fresh browser profile.
- Existing local test status wins over conflicting imported status.
- Conflicting records remain as conflict copies.
- Unknown legacy IDs remain visible in Data & Validation.

## Data safety

- `project-data.json` contains no base64 screenshots, raw private test notes, API keys or tokens.
- `todo-data.json` is byte-for-byte unchanged from V1.
- Private-repository recommendation and static limitations are visible.
- No UI text claims automatic chat capture or automatic GitHub updates.
