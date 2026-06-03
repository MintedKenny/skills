---
name: linear-issues
description: Decompose findings into well-scoped Linear issue drafts (one issue = one PR), preview them, and ask before filing. Never files without explicit confirmation.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Draft Linear issue proposals

Decompose the findings just provided into well-scoped Linear issue drafts. Do not create issues when this skill runs. Stop after presenting the drafts and ask the user whether to file them.

## Decomposition (one issue = one PR)

Each issue should correspond to one PR's worth of work. **Always prefer fewer, larger PRs over many related smaller ones** — splitting related work across PRs creates churn, review overhead, and merge ordering pain.

- **Default: group aggressively.** Combine findings into one issue whenever they touch the same area, share context, or would be easier to land together than separately.
- **Only split when the work genuinely cannot share a PR** — e.g., distinct subsystems with no overlap, different reviewers required, or one piece truly blocks the rest and needs to land first.
- Before creating multiple issues, ask: "Would landing these as one PR be simpler than coordinating two?" If yes, merge them.
- A larger issue is fine. Scope is bounded by *one cohesive PR*, not by issue size.

## Per issue

- **Describe the problem and its impact, not the solution.** Investigation happens when the issue is picked up.
- **Provide all relevant background** so a fresh workspace can execute without re-discovering context.
- **No implementation prescriptions** — describe desired behavior, not the path to it.
- **For triage-derived issues**, preserve uncertainty: frame the task as investigation plus desired behavior unless the root cause is already proven.

## Body template

```markdown
## Context
What problem this solves or why this change is needed. Include symptoms, reproduction, or motivation — not implementation details.

## Task
What needs to change, at the level of desired behavior.

## Expected Outcome
What success looks like from the user's or system's perspective. Describe the end state, not the steps to get there.

## Notes
Constraints, things to avoid, or related context.
```

## Defaults

Set sensible defaults for your Linear workspace:

- **Team / project**: your team (issue IDs look like `TEAM-123`)
- **Assignee**: as appropriate — often yourself, or unassigned for the backlog
- **Status**: `Todo` (use `Backlog` only if explicitly speculative or deferred)
- **Label**: exactly one that fits your label set (e.g. `bug` / `feature` / `docs` / `infra`)
- **Priority**: Normal unless warranted — Urgent / High / Low
- **Title**: imperative voice, <70 chars (e.g., "Fix X", "Add Y")
- Link `blocks` / `blockedBy` when dependencies exist

## Skip (do not file)

A tracker is for work intended to be done now. Redirect elsewhere:
- Speculative product ideas → your ideas/backlog doc
- Deferred work with a known trigger → your future-considerations doc
- Nice-to-haves without a clear phase or trigger → your ideas/backlog doc

## Confirmation gate

The first response must end after the draft review prompt. Even if the user asks to file issues in the same message that invokes the skill, prepare the issue drafts first and wait for a separate confirmation response before using Linear write tools.

## Flow

1. **Group first.** List the candidate findings/items, then propose the minimum number of PR-shaped issues that cover them. Call out which findings rolled into which issue.
2. Draft each issue per the template. Include all fields needed to create it: title, team, assignee, status, label, priority, dependency links, and complete body.
3. Show a numbered preview for each issue: title + label + priority + 1-line problem + which findings it absorbs, followed by the complete issue body.
4. Stop and ask: "Do you want me to file these Linear issues now?" Do not call Linear write tools while preparing the preview.
5. File with the host's Linear issue-create capability only after the user explicitly confirms in a follow-up response. If the user requests changes, revise the drafts and ask again.
6. After confirmed filing, report the created issue IDs.

GitHub auto-links PRs/commits that include the Linear issue ID (e.g. `TEAM-123`). A common branch-naming convention when work begins is `team-123-short-description`.
