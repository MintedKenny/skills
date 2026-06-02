# `MintedKenny/skills`

[![skills.sh](https://skills.sh/b/MintedKenny/skills)](https://skills.sh/MintedKenny/skills)

A set of useful skills for coding agents (Claude Code, Codex, and other [Agent Skills](https://agentskills.io/specification)–compatible hosts).

## Quickstart

Select and install skills:

```bash
npx skills add MintedKenny/skills
```

Install one skill for one agent:

```bash
npx skills add MintedKenny/skills --skill investigate --agent claude-code
npx skills add MintedKenny/skills --skill investigate --agent codex
```

## Available Skills

- [`investigate`](./skills/investigate/SKILL.md): PR-grade investigation of an issue or request — deep dive, options, and a ranked recommendation, no code.
- [`audit-findings`](./skills/audit-findings/SKILL.md): cross-audit an existing list of findings or recommendations — pressure-test each, stabilize, and surface what was missed.

## License

MIT
