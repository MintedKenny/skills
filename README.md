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

## How To Use These Skills

Skills are reusable workflows for coding agents. Install the ones you want, then ask your agent to use a skill by name when the shape of the work matches it.

Common patterns:

- Use `investigate` before implementation when you need a deeper read on a bug, feature, or architectural question.
- Use `audit-branch` on a branch or diff before merge to get a structured review of the actual changes.
- Use `audit-findings` after an investigation or review to pressure-test the findings, merge duplicates, and surface anything missed.
- Use `evaluate-source` when you find an article, repo, post, or documentation page and want to know what ideas are worth borrowing.
- Use `parallel-research` when the answer needs cited public research. Do not include secrets, private customer data, or nonpublic project facts.
- Use `linear-issues` when you are ready to turn a set of findings or recommendations into issue drafts.

You can use one skill at a time, or chain them as the work narrows: investigate the problem, audit the proposed branch, cross-check the findings, then draft follow-up issues.

## Available Skills

- [`audit-branch`](./skills/audit-branch/SKILL.md): critically audit the changes on a branch — verdict, design audit, strategic implications, and ranked recommendations.
- [`audit-findings`](./skills/audit-findings/SKILL.md): cross-audit an existing list of findings or recommendations — pressure-test each, stabilize, and surface what was missed.
- [`evaluate-source`](./skills/evaluate-source/SKILL.md): evaluate external content (article, repo, tweet, docs) for ideas worth borrowing — a ranked verdict per idea.
- [`investigate`](./skills/investigate/SKILL.md): PR-grade investigation of an issue or request — deep dive, options, and a ranked recommendation, no code.
- [`linear-issues`](./skills/linear-issues/SKILL.md): decompose findings into well-scoped Linear issue drafts (one issue = one PR) and ask before filing.
- [`parallel-research`](./skills/parallel-research/SKILL.md): run public-safe Parallel.ai research from the terminal and write a cited Markdown report.
- [`setup-ad`](./skills/setup-ad/SKILL.md): set up an architecture-decision archive, agent-context index, and hard-rules table in a repo that lacks them.

## License

MIT
