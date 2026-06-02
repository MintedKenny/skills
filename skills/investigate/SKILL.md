---
name: investigate
description: PR-grade investigation of an issue or request — deep dive, options, and a ranked recommendation, no implementation. Use to scope a bug or feature before writing code.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Investigate

Investigate the issue or request just described. PR-grade — return a recommendation, not code.

If the input references an issue-tracker ID (Linear, Jira, a GitHub issue, etc.), fetch that issue first for full context using whatever tracker tool the host provides. Don't change the issue's status during the investigation unless the user explicitly asks you to take ownership.

## Evidence first

No recommendations without evidence. If a claim relies on an assumption, label it.

- Read the code at the relevant files.
- If it's runtime behavior, check what's running and pull logs from the relevant services (e.g. `docker compose ps`, then service logs). Skip if nothing is up.
- `git log` — recently changed code is often the culprit.
- Any project log of known issues or recurring patterns, if the problem is behavioral.
- Related architecture docs / ADRs as needed.

**Confirm the load-bearing claim.** The `Read` (below) is whatever the report stands on — a root cause, a mechanism, a fact about the codebase. Verify it against the actual code or system before it anchors the options; don't let an assertion carry the recommendation. Where it's runtime behavior, observe it (logs, a probe); where it's structural, cite the code. Every option and the recommendation inherit the `Read`'s confidence.

## Approach

- **First principles** — what's actually going on beneath the surface framing? Root cause for a bug; the real mechanism or fact for a concept.
- **Challenge the premise** — the greenfield lens applies to the issue itself, not just the fix. Tracked issues can be stale, mis-scoped, or wrong-direction. If the problem wouldn't exist in a clean rebuild — or pursuing it would add long-term noise or overcomplication — **Drop** is the right recommendation. Don't manufacture work to look productive.
- **Architecturally superior > expedient** — ignore migration effort as an objection. Effort is not a design constraint.
- **Edge cases & downstream effects** — what breaks, what surprises?
- **Stay in scope; expand only if the scope itself is wrong.**
- Use available host skills or plugins when they materially improve the investigation. If UI is relevant, apply the host's frontend/design capability when present; otherwise read the repo's design docs and evaluate against them directly.

## Output

**Deep dive**
- *Read:* the one-line core finding the report stands on — what's actually going on. Tag it **confirmed** or **hypothesis**.
- *Evidence:* paragraphs or bullets with `file:line` citations

**Greenfield ideal** (only if architecture or design is touched) — one paragraph: built from scratch today, what would this look like? Anchors the options below against the ideal, not the current state. Skip for narrow bugs (typos, isolated logic errors).

**Options & trade-offs** — for each viable approach:

**Option A: <name>**
- *Approach:* one-line description
- *Pros:* what this gets right
- *Cons:* what this costs
- *Greenfield score:* (only for non-narrow cases — how close to the ideal)

**Option B: <name>** … same shape.

**Recommendation:** Option <X> — or **Drop** if the premise doesn't hold (the issue is stale, mis-scoped, or net-negative to pursue), or **Inconclusive** if the central question can't be resolved from available evidence
- *Why:* the decisive reason
- *Trade-off accepted:* what this gives up vs. the alternatives
- *Watch for:* downstream risks worth tracking (optional)

If **Inconclusive**: name what's ruled out and the specific evidence that would settle it. Don't manufacture a confident recommendation on an unresolved `Read`.

**Do not implement.**

**Next**
- To act on the recommendation, file it in your issue tracker or write it up as a spec, then implement it in a separate pass.
- To keep exploring, treat the leading option as a starting point and widen the investigation.
- If the recommendation is **Drop**, ask the user whether to close the tracked issue as cancelled. Do not close it in the same response as the investigation report.
- If the recommendation is **Inconclusive**, gather the evidence you named before deciding — keep exploring, or hand back to the user. Don't file or commit on an unresolved `Read`.
