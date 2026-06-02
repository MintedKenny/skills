---
name: audit-findings
description: Cross-audit an existing list of findings or recommendations — pressure-test each, stabilize modified/new ones, surface what was missed. Use after a review produces findings.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Audit findings

Pressure-test the list of findings or recommendations already in scope. Decide which hold up, stabilize modified or new recommendations when feasible, then surface anything that was missed.

Before evaluating, read `references/audit-posture.md`.

## Scope

Use this for findings, recommendations, or candidate ideas that are already concrete enough to audit: output from a branch/diff audit, a spec review, an implementation review, an adversarial challenge, or a conversation list. This is not concept exploration; if the input is still vague, scope it down to concrete findings first.

## Cross-check (per finding)

1. **Read the cited code** — don't trust the finding's framing. Verify the issue is real where it claims to be.
2. **Run tests if applicable** — does behavior actually match the claim?
3. **Think greenfield, first principles** — not "is this fix reasonable given the current state?" but "is this what we'd build from scratch?"
4. **Best durable shape, then simplify** — first decide the best greenfield long-term recommendation. Then ask whether a smaller fix, deletion, move to the right owner, explicit narrow path, or reuse of an existing primitive reaches that same or better architecture. Do not shrink a recommendation if the larger design is the correct one.
5. **Check placement & ownership** — does the recommendation put code in the right layer/module, or would it scatter responsibility and make the architecture harder to reason about?
6. **Calibrate defense-in-depth** — does the recommendation add guardrails for a real threat or failure mode, or pile on checks, indirection, and ceremony that the codebase will have to maintain?
7. **Ignore migration / effort objections** — don't drop or weaken a recommendation because applying it is annoying, time-consuming, disruptive, or large. Effort is never a reason to keep bad code.
8. **Edge cases & downstream effects** — does the proposed fix miss cases? What breaks when it's applied?
9. **Could you go further?** — is the finding right but the fix shallow, too broad, or too complex? Is there a deeper root cause or a simpler long-term design?

## Stabilization pass

After the first pass, run one fresh-context stabilization pass for:

- findings marked **modify**, because the corrected recommendation is now a new claim;
- **new findings**, because they did not receive the original cross-audit.

Classify each stabilized item as:

- **validated** — survives the fresh pass as decision-ready.
- **revised** — still real, but the recommendation changed again.
- **rejected** — does not hold after the fresh pass.
- **unresolved** — needs a separate adversarial challenge, a broader exploration, a focused follow-up audit, or human judgment.

Stop there by default. Do not recursively audit every issue discovered during stabilization. If stabilization surfaces additional issues, mention them as follow-up only — unless they directly invalidate or materially change the stabilized recommendation.

## Optional subagents

For large or high-stakes audits, use bounded subagents as validation surfaces, then synthesize locally:

- **Evidence verifier:** checks cited files, lines, tests, and claims.
- **Greenfield reviewer:** asks whether the corrected recommendation is the durable architecture.
- **Adversarial reviewer:** applies a devil's-advocate posture to contentious or strategic modified/new findings.

Give subagents only the minimal task-local context they need. Do not pass your intended verdict. The main agent owns the final classification and wording.

## Discipline

- No issue is too small. Don't defer polish, inconsistencies, or naming.
- Necessary, not noise. Drop findings (or fixes) whose long-term overcomplication, excess depth, or noise outweighs the payoff. Small ≠ noise: real polish and naming still hold.
- Be specific: file, line, function — verify claims at the source.
- Distinguish three failure modes: **finding-wrong** / **finding-right-fix-wrong** / **finding-right-fix-incomplete**.
- Don't rubber-stamp — if every finding holds, say why explicitly.
- When modifying a recommendation, name the correct target shape directly, regardless of effort. Simplify only when simplification preserves or improves that target shape.
- Treat anything still **unresolved** after stabilization as provisional. Route it through an adversarial challenge, a broader exploration, or a focused follow-up audit before implementation or spec edits.

## Output

**First pass:** `N hold · M modify · K drop · Q new`

**Second pass:** `V validated · R revised · X rejected · U unresolved`

Use the first line for the first-pass decision across the original findings plus any newly discovered findings. Use the second line only for the second-pass review of first-pass `modify` and `new` items, so its total should equal `modify + new`. If no findings needed a second pass, write:

> **Second pass:** not needed

**Per existing finding** (in original order):
- `#N: <headline>` → **hold** / **modify** / **drop**
  - *Why:* one short reason
  - *Corrected recommendation:* (only if `modify`; prefer the best durable fix, with no unnecessary machinery)

**Second pass detail** — only modified and new findings:

- `#N: <headline>` → **validated** / **revised** / **rejected** / **unresolved**
  - *Why:* one short reason
  - *Final recommendation:* required for `validated` / `revised`
  - *Next lens:* required for `unresolved` — adversarial challenge, broader exploration, or focused follow-up audit

**Validated new findings** — numbered, ranked by impact:

1. **<headline>**
   - *Location:* `file:line` or function
   - *Why:* the issue
   - *Fix:* recommended change

**Unresolved / follow-up only** — not decision-ready:

1. **<headline>**
   - *Why unresolved:* what still needs a separate lens
   - *Next:* adversarial challenge, broader exploration, or focused follow-up audit

**Revised recommendation:**
- **Survived:** which findings held and the through-line across them
- **Changed:** modifications + drops, one clause each
- **New:** validated new findings only
- **Unresolved:** provisional items and the required next lens
- **Bottom line:** 1–2 sentences on the recommended direction now

**Do not implement.**

**Next action**
- Continue the workflow that produced the findings: implement the survived and modified findings, update the spec, or file follow-up work — in a separate pass.
- Treat unresolved findings as parked follow-up until a challenge, exploration, or focused re-audit validates them. Don't fold them into the implementation or spec set yet.
