---
name: evaluate-source
description: Evaluate external content (article, repo, tweet, docs) for ideas worth borrowing into your system — verdict per idea, ranked. Exploratory, no commitments.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Evaluate a source

You've been pointed at external content (article, repo, talk, tweet, other-system docs). The question: **what idea is in here that could make your system better, and does it map to you?** Not "should we adopt their stack."

## Get the content

The source is the argument (URL/path), or whatever the user pasted. One source per invocation — run twice to compare two.

- **URL / public docs** — use the host's web retrieval capability. **Local file / PDF** — use the host's file reader; for large PDFs, read only the pages needed.
- **GitHub** — use `gh repo view`, `gh api repos/<owner>/<repo>/contents/<path>`, raw URLs through the host's web retrieval capability, or a shallow local checkout for a deep code dive.
- **Tweet / X** — see *Fetching reference* below.

If retrieval returns nothing useful, **stop and ask the user** for the content — don't speculate about what the source says.

## Frame

- **Strip the implementation, keep the idea.** Their stack, tools, and library names don't matter. What's the underlying principle?
- **Anchor against your system.** Read the project's AGENTS.md / README, architecture docs, decision records (ADRs), and guardrails. The lens: "would we be different if we'd known this two months ago?"
- **Durable, not trendy.** An honest "nothing here for us" is a valid result — most external content has nothing for you. Don't manufacture relevance.

## Evaluate — per idea, not per source

A source may hold 0, 1, or several distinct ideas. For each:

1. **Abstract principle** — strip the brand/tool name; state it in your vocabulary.
2. **Real for us?** — does it map to a tension you actually have? Cite the decision record / doc / `file:line`.
3. **Already addressed?** — do you have an equivalent under another name? Common — say so plainly.
4. **Coherence** — does it align with your current direction or fight a decision/invariant?
5. **What we'd give up** — lock-in, complexity, surface area, current guarantees.
6. **Substance vs. fashion** — would a rigorous engineer still want this in two years?

Cite both sides: the source (URL / quoted line) for the idea, your system (`file:line`, decision record, doc) for the relevance claim. If a key claim is unclear, flag it — don't guess.

## Output

**Source:** title + author/repo, link.

**Read:** one paragraph — what the source actually argues, in their framing.

**Ideas worth considering** — numbered, ranked by relevance. Per idea:

1. **<headline of the abstract idea>** → **borrow** / **adapt** / **park** / **ignore**
   - *Idea:* the principle, decoupled from their implementation
   - *Maps to:* your tension/area (decision record, file, doc)
   - *Already addressed?* yes/no — if yes, what you have and how it differs
   - *What we'd give up:* lock-in, complexity, invariants
   - *Verdict reasoning:* one or two sentences
   - *Trigger:* (`park` only) what would make this worth revisiting

- **borrow** — adopt the principle as-is; maps cleanly to a real tension
- **adapt** — real kernel, but your context reshapes it
- **park** — credible, no current pull; record a trigger
- **ignore** — doesn't apply, already handled, or wrong

If nothing is worth considering, say so with a one-line reason. Don't pad.

**Bottom line:** 1–2 sentences on whether anything material came out of this.

**Do not implement, file, or draft.**

**Next:** if a `borrow`/`adapt` idea is worth capturing, write it up as a draft or note before acting on it. Otherwise drop the source.

---

## Fetching reference

**Tweet / X.** Direct web retrieval on an `x.com` URL often returns HTTP 402 or an unusable shell page. Use a proxy:

1. **fxtwitter (best)** — retrieve `https://api.fxtwitter.com/<user>/status/<id>`. Clean JSON: `tweet.text`, `.author`, `.created_at`, `.quote`, `.media`, `.replying_to`. The `<user>` segment isn't load-bearing — only the numeric ID matters.
2. **vxtwitter** — `https://api.vxtwitter.com/<user>/status/<id>`. Fallback if fxtwitter is down.
3. **Jina Reader** — `https://r.jina.ai/https://x.com/<user>/status/<id>`. Slower, but renders the page and follows links inside the tweet.

- *Tweet is just a link?* The APIs return only the link-card preview (~125 chars). The linked page is the real source — fetch and evaluate that. For an X native article (`x.com/i/article/<id>`), use `https://r.jina.ai/<article-URL>`.
- *Thread?* The APIs return one tweet. Fetch the first for the hook, then ask the user to paste the rest — don't evaluate a thread from its first tweet.
- *All else fails?* Ask the user to paste the text or drop a screenshot — you can read images.

**Paywalled / JS-skeleton page.** Retry via `https://r.jina.ai/<URL>`, then `https://web.archive.org/web/<URL>` or `https://archive.ph/<URL>`.

**Reddit / HN.** Reddit: append `.json` to the thread URL for structured JSON. HN: retrieve `https://news.ycombinator.com/item?id=<id>`.

**YouTube talk / podcast.** Retrieving `https://r.jina.ai/<watch-URL>` sometimes pulls captions; otherwise ask the user for a transcript.
