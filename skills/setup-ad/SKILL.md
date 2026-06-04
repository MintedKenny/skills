---
name: setup-ad
description: Set up an architecture-decision archive, agent-context index, and hard-rules table in a repo that lacks them, seeded from choices the code already embodies.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Set up architecture decisions

Install the "running decision archive + agent-context index" system into a repo, and seed it from the decisions the repo already embodies. The pattern has three parts: one append-only archive of full rationale, a one-line-per-decision index in the file the coding agent reads every session, and a short table of the active constraints that index implies. The payoff is an agent that understands the system's bigger-picture choices, and a team with a written record of *why*, not just *what*.

This is **one-time setup**, not per-decision capture. Adding a single architecture decision later is an ordinary edit — next number, same format, one index row — and needs no skill. Use this only to stand the system up the first time, or to adopt it in a repo that lacks it.

## Before you start

- **Confirm it is setup.** If the repo already has a decision archive and an index in its agent-context file, stop: the user wants to *add* a decision, which is a direct edit (see the going-forward checklist in `references/templates.md`), not this skill.
- **Confirm the shape.** This skill installs an opinionated default — a single running archive plus an index and hard-rules table in the agent-context file. If the repo already keeps one-file-per-decision ADRs, adapt to that convention instead of overwriting it.
- **Learn the repo first.** You can only seed *real* decisions. Read the README and any design docs, the build and dependency setup, the top-level module boundaries, and the storage and auth choices. Ask the user what they consider settled. Seeded entries must describe choices the code already embodies, never aspirations.
- Read `references/templates.md` now — it holds every skeleton the steps below refer to.

## 1. Choose the agent-context file

This is the file the coding agent loads each session. `AGENTS.md` is the cross-agent default; tools also read `CLAUDE.md`, `.cursorrules`, or `.github/copilot-instructions.md`. Pick one canonical AD index. Symlink duplicate or empty context files to it when that is safe; if another context file carries scoped instructions, leave it in place and add a pointer to the canonical index. If the repo already has one, extend it rather than adding a competing file.

## 2. Create the archive

Create the archive document (`docs/architectural-decisions.md` is a good home) using the header and entry templates in `references/templates.md`. The header states the archive's purpose and points back to the agent-context file for active guardrails. Number entries sequentially, starting at 1. If the repo already uses one-file-per-decision ADRs, do not create a consolidated archive; refresh the agent-context index over the existing ADRs and put compact lifecycle guidance in the ADR README or index.

## 3. Seed the decisions

This is the work. For each settled choice that genuinely shapes the codebase — language and runtime, storage, service boundaries, the security model, key build and deploy choices — write one archive entry: what was decided, why, and when to revisit. Give weightier decisions their invariants and relationships. Aim for the handful that matter; an exhaustive list of trivia buries the signal. Confirm the set with the user before writing them all.

## 4. Wire the index into the agent-context file

Add an `Architecture Decisions` section to the agent-context file: a one-line intro that says to read the archive before changing a decision, then a table with one single-sentence row per AD. The row is a pointer; the archive holds the detail. Keep each row to one sentence.

## 5. Promote active constraints to Hard Rules

Create or update a `Hard Rules` table (rule plus reason) for the decisions that carry an ongoing "always X / never Y" the agent must honor on every relevant edit. Walk each seeded AD against the promotion test in `references/templates.md`: a rule is something obeyed *without* re-reading the rationale; an AD is the rationale read *before changing* a decision. Most ADs are not rules — keep the table short and high-signal.

## 6. Establish the going-forward convention

So the system runs without this skill again, record a compact add-or-change convention in the archive header: next number for new decisions; supersede, retire, or edit in place for existing ones; never delete or renumber; keep the archive entry, index row, and any Hard Rule in sync. `references/templates.md` spells out the full lifecycle in *Changing a decision later* and the going-forward checklist; keep that detail there instead of copying it into the header.

## Finish

Summarize the files you created and edited. Writing these into the repo is this skill's purpose, so do it — but committing, pushing, or opening a PR is a separate durable action: do that only if the user asks.
