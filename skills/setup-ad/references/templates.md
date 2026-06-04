# Architecture-decision setup templates

Concrete skeletons for the architecture-decision setup system. Copy these, then adapt the wording to the target repo. Read this file at step 2 (creating the archive) and keep it open through step 6.

## The shape, in one picture

- **Archive** (`docs/architectural-decisions.md`, or the repo's docs home): one numbered entry per decision, full rationale, append-only. The territory.
- **Index** (in the agent-context file): one table row per decision, one sentence each. The map the agent reads every session.
- **Hard rules** (in the agent-context file): the subset of decisions that carry an active "always / never" constraint, condensed to one line plus its reason.

AD = the rationale read *before changing* a decision. Hard rule = a constraint obeyed *without re-reading*. Most ADs are not hard rules.

## Archive document header

```markdown
# <Project>: Architectural Decisions Archive

**Purpose**: Rationale for architectural choices. See <agent-context file> for compact, active guardrails; read an entry here before changing the decision it records.

**Lifecycle**: Add new decisions under the next number with one index row. When a decision changes, supersede, retire, or correct in place; numbers are permanent. Keep the archive entry, index row, and any Hard Rule in sync.

---
```

## AD entry

Start light; add the optional blocks only when a decision earns them. A small decision is fine with Decision / Why / Revisit when. Use additional short bold labels when they make the rationale clearer; do not force empty fields.

```markdown
## AD-<N>: <Short descriptive title>

**Decision**: <What was chosen, in one or two sentences.>

**Why**: <The reasoning. What problem this solves; what it trades away.>

**Invariants**: <Optional. The properties that must stay true for this decision to hold.>

**Relationship**: <Optional. Which ADs this extends, supersedes, or depends on; the durable files that implement it.>

**Revisit when**: <The condition under which this should be reopened.>

---
```

Lifecycle: numbers are permanent and never reused. When an existing decision later changes, is dropped, or only needs a correction, see *Changing a decision later* below.

### Worked example (generic)

```markdown
## AD-<N>: Store local state in SQLite, not flat files

**Decision**: The CLI persists per-project state in a single SQLite file under the project's config directory.

**Why**: State outgrew flat JSON once concurrent commands began writing it; SQLite gives atomic writes and queryable history without a server. A managed database was rejected as too heavy for a local tool.

**Revisit when**: State must be shared across machines, at which point a sync backend changes the storage assumptions.
```

## Index section (agent-context file)

```markdown
## Architecture Decisions

Use this as an index; read `docs/architectural-decisions.md` before changing a decision.

| AD | Decision |
|----|----------|
| 1 | <one sentence> |
| 2 | <one sentence> |
| 3 | Store local state in SQLite, not flat files. |
```

Keep each row to a single sentence. The row points to the full entry; it does not summarize it.

## Hard Rules table (agent-context file)

```markdown
## Hard Rules

| Rule | Reason |
|------|--------|
| <The one-line constraint: always X / never Y.> | <Why it exists — usually a pointer to the AD or the failure it prevents.> |
```

### Promotion test

For each seeded AD, ask: *does this create an instruction the agent must follow on every relevant edit, without re-reading the rationale?* If yes, add a Hard Rule. If it is only context for a future judgment call, leave it as an AD. A short, high-signal table beats an exhaustive one.

## Changing a decision later

A decision archive is append-only — revise it by adding, not erasing. Four cases:

- **Correct / clarify** (the decision still holds): edit the entry in place — fix a fact, add an invariant, tighten wording. Touch the index row only if its one-liner is now wrong.
- **Change the decision** (it is replaced): write a new entry under the next number for the new decision. Tag the old title `## AD-<N>: <Title> [SUPERSEDED by AD-<M>]`, collapse its body to a one-line pointer to AD-<M>, and reword its index row to note the supersession — keep the row; the number is permanent history.
- **Drop the decision** (no replacement): tag the old title `[RETIRED]` with a one-line note on where the rationale went and why. Keep its number permanent. Keep an index row only if the retired history still matters to active agent behavior; otherwise remove the index row and remove or revise any Hard Rule it created.
- **Partial change**: when only part of an entry is overtaken, supersede that part inline ("the <X> clause is superseded by AD-<M>") instead of the whole entry.

The drift trap: a decision can live on three surfaces — its archive entry, its index row, and a Hard Rule. Every lifecycle change must reconcile all three it touches. A superseded decision whose Hard Rule still reads as active is the most common failure.

## Going-forward checklist (after setup; no skill needed)

**A new decision:**

1. Next sequential AD number (never reuse one).
2. An entry in the archive, in the format above.
3. One row in the index table.
4. A Hard Rule row only if it carries an active guardrail.

**A decision that changes:** follow *Changing a decision later* — supersede, retire, or edit in place — and reconcile every surface it touches (archive entry, index row, Hard Rule).
