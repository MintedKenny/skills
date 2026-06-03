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

- [`audit-branch`](./skills/audit-branch/SKILL.md): critically audit the changes on a branch — verdict, design audit, strategic implications, and ranked recommendations.
- [`audit-findings`](./skills/audit-findings/SKILL.md): cross-audit an existing list of findings or recommendations — pressure-test each, stabilize, and surface what was missed.
- [`evaluate-source`](./skills/evaluate-source/SKILL.md): evaluate external content (article, repo, tweet, docs) for ideas worth borrowing — a ranked verdict per idea.
- [`investigate`](./skills/investigate/SKILL.md): PR-grade investigation of an issue or request — deep dive, options, and a ranked recommendation, no code.
- [`linear-issues`](./skills/linear-issues/SKILL.md): decompose findings into well-scoped Linear issue drafts (one issue = one PR) and ask before filing.

## License

MIT
