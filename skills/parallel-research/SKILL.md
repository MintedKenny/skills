---
name: parallel-research
description: Run public-safe Parallel.ai research from the terminal and write a cited Markdown report for dev, architecture, standards, and prior-art questions.
metadata:
  source: "MintedKenny/skills"
  homepage: "https://github.com/MintedKenny/skills"
---

# Parallel Research

Run external research with Parallel.ai and write back a cited report. Use this when a coding or product question needs public-source research: prior art, standards, architecture choices, implementation techniques, thresholds, or trade-offs.

The bundled runner is `scripts/run.mjs`. It submits an already-framed query to Parallel, polls to completion, and writes a Markdown report. The skill owns the workflow and safety checks; the runner owns the API call.

## Before You Call Out

External research is a paid call to a third party, and the submitted query is committed verbatim into the report. Never send client data, secrets, credentials, private customer material, nonpublic business plans, or unpublished case facts to Parallel. Research public methods and public facts in the abstract; apply them to private data locally.

When another workflow or indirect request would trigger research, confirm before making the call unless the user explicitly asked for research this turn.

## Frame The Question

State the question precisely and ask for specific, cited findings. Name the figures, thresholds, standards, tools, papers, or implementation approaches you want back. Frame it neutrally: ask for evidence across the field, not confirmation of a conclusion you already hold. The recommendation is yours to draw from the findings afterward, not the engine's to hand you.

Good research prompts include:

- The decision or question being investigated.
- The exact output shape needed, such as a comparison table, risk list, implementation guide, or cited recommendation.
- The public-source boundaries, especially what not to include.
- Any freshness requirement.

## Choose Depth

Depth is a property of the question. A quick prior-art scan can use `lite`, `base`, or `core`; a broad architecture or standards question often needs `pro`; a novel or high-stakes methodology question may justify an `ultra*` tier.

The runner defaults to `pro`. Top tiers (`ultra2x`, `ultra4x`, `ultra8x`, and `-fast` variants) can cost materially more per task, so confirm before using them unless the user explicitly asked for a top-tier run.

## Run It

1. Compose one public-safe prompt.
2. Write it to a scratch file if it is long.
3. Run the bundled script:

```bash
node <skill-dir>/scripts/run.mjs \
  --query @/tmp/research-query.txt \
  --processor pro \
  --profile-label architecture \
  --out research-reports/YYYY-MM-DD-<slug>.md
```

`PARALLEL_API_KEY` must be set in the environment and must never be committed. `--profile-label` is optional provenance recorded in the report frontmatter. Default output is Markdown with inline citations. Pass `--output-schema auto` or `--output-schema json:<schema-path>` when a structured result is useful.

If `--out` is omitted, the runner writes under `research-reports/` in the current working directory. Deep tiers can take minutes; keep the process running until it prints the report path.

## Use The Report

Treat the report as an input, not a final answer. Read it, verify the important citations, and distill the findings into the decision, spec, implementation plan, or issue you are working on.
