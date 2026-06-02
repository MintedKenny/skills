# Repository conventions

Agent Skills for coding agents (Claude Code, Codex, and other [Agent Skills](https://agentskills.io/specification)–compatible hosts). One skill per folder.

- Installable skills live at `skills/<name>/SKILL.md`; frontmatter `name` must equal the folder name.
- `description` is the trigger surface — what the skill does and when to use it — in 200 characters or fewer (the Claude.ai limit).
- Keep each skill self-contained. Reference only files inside its own folder (`references/`, `scripts/`, `assets/`); never a sibling skill or a `../` path. Skills install individually, so anything outside the folder won't come along.
- `agents/openai.yaml` carries the Codex display block (`interface:`) and invocation `policy:`.
- Run `npm run validate` before committing. To add a skill, copy an existing one and edit it.
