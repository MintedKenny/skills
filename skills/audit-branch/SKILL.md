---
name: audit-branch
description: Critically audit the changes on a branch — verdict, design audit, strategic implications, and ranked recommendations. Use before merging or when reviewing a diff.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Audit the branch

Critically review what's been changed and decide: **are these changes good, and is anything missing?**

Before evaluating, read `references/audit-posture.md`.

## Scope
- Get the diff with the host's diff tool. If none is available, use `git diff --stat origin/main...` first, then inspect focused file diffs with `git diff origin/main... -- <path>`.
- Audit **uncommitted (or branch-local) changes only** unless told otherwise. Don't re-audit work already on the base branch.
- Match the project's compatibility stance — don't flag backwards-incompatibility the project doesn't require (e.g. a pre-release schema that resets freely).

## Evaluate (the diff as a whole, and each change)

1. **Root cause vs bandaid** — fix or papering over? Shortcuts taken?
2. **Design direction** — does the branch move the codebase toward the product and architecture direction you want, and would you build it this way from scratch today?
3. **Architectural economy** — first identify the best greenfield long-term shape, then ask whether any layer, branch, API, helper, or defensive check can be deleted, inlined, moved, narrowed, or reused without making that design worse. Simplicity is subordinate to correctness and greenfield fit; never choose a smaller shape that is less right.
4. **Code placement & ownership** — does each change live at the right layer/module, or does it smear responsibility across routes, hooks, libraries, schemas, or UI?
5. **Complexity & blast radius** — overcomplicated? unintended downstream effects?
6. **Duplication & abstraction** — redundant code, unnecessary layers, premature generalization?
7. **Pattern coherence** — fighting existing patterns, introducing competing ones, leaving stale ones in place?
8. **Surface area & defense calibration** — attack surface bloat, expanded public API, missing guardrails, or defense-in-depth that adds ceremony without a real threat model?
9. **Gaps** — tests, DI consistency, portability assumptions (don't over-index on tests).
10. **Missing pieces** — what *should* be in this change but isn't?

## Discipline
- Be specific: name files, functions, lines.
- Don't speculate ("might break X") — identify provable issues.
- Don't flag intentional design choices or pre-existing issues.
- Don't demand more rigor than the surrounding codebase maintains.
- Necessary, not noise. Drop recommendations whose long-term overcomplication, excess depth, or noise outweighs the payoff. Small ≠ noise: real polish and naming still hold.
- Ignore migration effort, implementation time, and churn. Do not keep bad design because fixing it is expensive or disruptive.
- Prefer simplification only when it preserves or improves the product/architecture goal. A good recommendation can be "remove this", "move this to the existing owner", "collapse this layer", or "make the narrow case explicit" when that is the best long-term shape, not just the smaller one.

## Output

**Verdict:** `keep` / `discard` / `right-direction-but-needs-work`

1–2 sentences on trajectory — does this set of changes pull the codebase toward a better long-term state, or accumulate drag? Don't anchor on work already done; if the right answer is revert everything, say so. Be direct.

**Design audit** — audit the design of the branch itself, not just code quality:
- *Bigger-picture fit:* does this move the codebase toward the product/architecture direction you want?
- *Greenfield shape:* would you choose this design if starting the relevant subsystem today?
- *Change quality:* is the branch solving the right problem at the right abstraction level, or is it a local patch/workaround that makes the future design harder?
- *Architectural economy:* is the branch carrying unnecessary layers, broad APIs, verbose plumbing, or defensive checks that should be deleted or narrowed before merge because doing so moves it closer to the best greenfield design?

If the branch is already the greenfield/bigger-picture version, say so plainly. If not, name the design delta and whether it is acceptable.

**Strategic implications** — what merging this locks you into:
- *Commits you to:* invariants you now have to maintain
- *Forecloses:* optionality cut off, migration paths closed
- *Maintenance burden:* abstractions you'll extend, surface area you now own

Omit any axis that's N/A. Only call out what changes the codebase's future shape — skip generic considerations. If nothing material, say "no strategic implications beyond the change itself."

**Recommendations** — numbered, ranked by impact:

1. **<headline>**
   - *Location:* `file:line` or function
   - *Why:* brief reason

If nothing material, say "no recommendations." **Do not implement.**

**Next:** pressure-test the resulting list of recommendations with a findings cross-audit (the `audit-findings` skill).
