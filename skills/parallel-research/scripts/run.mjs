#!/usr/bin/env node
// Parallel research substrate — launch a Parallel.ai deep-research task and write a cited report.
//
// Dependency-free dev tooling (Node 18+ global `fetch`, zero npm deps). It is a DUMB
// cross-tool substrate: it submits an ALREADY-FRAMED query, polls to completion, and
// writes a markdown report. The caller owns framing and picks the tier per question.
// Callable from Claude Code, Codex, or a plain terminal.
//
// Consent boundary (enforced by the calling skill, restated here): never send client or
// engagement data, secrets, credentials, or nonpublic case facts to Parallel. The
// submitted query is committed verbatim into the report, so it must be public-safe.
//
// Env:
//   PARALLEL_API_KEY   required; read from the environment, never written to any file.
//
// Usage:
//   node <skill-dir>/scripts/run.mjs --query <text|@file|-> [flags]
//
//   --query           inline string, `@<path>` to read a file, or `-` to read stdin (required)
//   --processor       parallel processor tier (default: pro)
//   --output-schema   text (default) | auto | json:<path-to-json-schema>
//   --profile-label   report metadata only; recorded in frontmatter `profile:`
//   --out             report path (default: research-reports/<date>-<slug>.md)
//   --yes             silence the top-tier cost notice (never prompts regardless)
//
// Exit codes: 0 success (report path on stdout); 2 usage/validation (no API call,
// no spend); 1 setup/API/runtime failure (may have spent; never leaves a partial report).

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUN_CWD = process.cwd();
const API_BASE = 'https://api.parallel.ai/v1';
const MAX_QUERY_CHARS = 15_000;

const BASE_PROCESSORS = ['lite', 'base', 'core', 'core2x', 'pro', 'ultra', 'ultra2x', 'ultra4x', 'ultra8x'];
const VALID_PROCESSORS = new Set([...BASE_PROCESSORS, ...BASE_PROCESSORS.map((p) => `${p}-fast`)]);
// Top tiers (~$0.60–$2.40/task) get a courtesy stderr notice unless --yes is passed.
const TOP_TIERS = new Set(['ultra2x', 'ultra4x', 'ultra8x'].flatMap((p) => [p, `${p}-fast`]));

const REQUEST_TIMEOUT_MS = 30_000;
const POLL_DELAYS_MS = [3_000, 5_000, 8_000, 13_000]; // then steady POLL_STEADY_MS
const POLL_STEADY_MS = 20_000;
const MAX_TRANSIENT_RETRIES = 5;

const USAGE = `parallel-research — launch a Parallel.ai deep-research task and write a cited report

  node <skill-dir>/scripts/run.mjs --query <text|@file|-> [flags]

  --query <v>          inline string, @<path>, or - (stdin)   (required, ≤${MAX_QUERY_CHARS} chars)
  --processor <p>      ${BASE_PROCESSORS.join(', ')} (+ each -fast)   (default: pro)
  --output-schema <s>  text | auto | json:<path>              (default: text)
  --profile-label <l>  report metadata only (frontmatter profile:)
  --out <path>         report path   (default: research-reports/<date>-<slug>.md)
  --yes                silence the top-tier cost notice

  Requires PARALLEL_API_KEY in the environment.`;

// --- typed errors → exit codes -------------------------------------------------

class UsageError extends Error {} // exit 2 — caller/validation, no API call made
class RunError extends Error {} // exit 1 — setup/API/runtime, may have spent

// --- arg parsing ---------------------------------------------------------------

const KNOWN_VALUE_FLAGS = new Set(['--query', '--processor', '--output-schema', '--profile-label', '--out']);

function parseArgs(argv) {
  const args = { yes: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    }
    if (token === '--yes') {
      args.yes = true;
      continue;
    }
    const eq = token.indexOf('=');
    const flag = eq === -1 ? token : token.slice(0, eq);
    if (!KNOWN_VALUE_FLAGS.has(flag)) {
      throw new UsageError(`unknown or misused flag '${token}'`);
    }
    let value;
    if (eq !== -1) {
      value = token.slice(eq + 1);
    } else {
      value = argv[++i];
      if (value === undefined) throw new UsageError(`flag '${flag}' requires a value`);
    }
    args[flag.slice(2).replace(/-/g, '_')] = value; // --output-schema → output_schema
  }
  return args;
}

// --- offline validation (runs fully before any API call) -----------------------

function resolveQuery(raw) {
  if (raw === undefined) throw new UsageError('--query is required');
  let text;
  if (raw === '-') {
    if (process.stdin.isTTY) {
      throw new UsageError('--query - reads stdin; pipe the query in or use --query @<file>');
    }
    text = readFileSync(0, 'utf8');
  } else if (raw.startsWith('@')) {
    const file = raw.slice(1);
    try {
      text = readFileSync(file, 'utf8');
    } catch (err) {
      throw new UsageError(`cannot read --query file '${file}': ${err.message}`);
    }
  } else {
    text = raw;
  }
  text = text.trim();
  if (text === '') throw new UsageError('--query resolved to empty text');
  if (text.length > MAX_QUERY_CHARS) {
    throw new UsageError(`--query is ${text.length} chars; Parallel accepts at most ${MAX_QUERY_CHARS}`);
  }
  return text;
}

function validateProcessor(raw) {
  const processor = raw ?? 'pro';
  if (!VALID_PROCESSORS.has(processor)) {
    throw new UsageError(
      `invalid --processor '${processor}'. Valid: ${BASE_PROCESSORS.join(', ')} (and each with a -fast suffix)`,
    );
  }
  return processor;
}

// Returns { mode, schema } where schema is the Parallel output_schema object.
function resolveOutputSchema(raw) {
  const spec = raw ?? 'text';
  if (spec === 'text') {
    return {
      mode: 'text',
      schema: {
        type: 'text',
        description:
          'A thorough, well-organized research report in GitHub-flavored Markdown. Use clear ' +
          'headings and bullet lists. Make claims specific — name figures, thresholds, standards, ' +
          'and approaches — and attach an inline citation to each claim.',
      },
    };
  }
  if (spec === 'auto') {
    return { mode: 'auto', schema: { type: 'auto' } };
  }
  if (spec.startsWith('json:')) {
    const file = spec.slice('json:'.length);
    if (!file) throw new UsageError('--output-schema json: requires a path (json:<path>)');
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      throw new UsageError(`cannot read JSON schema '${file}': ${err.message}`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new UsageError(`JSON schema '${file}' must be a JSON object`);
    }
    return { mode: 'json', schema: { type: 'json', json_schema: parsed } };
  }
  throw new UsageError(`invalid --output-schema '${spec}'. Use: text | auto | json:<path>`);
}

function requireParallelToken() {
  const key = process.env.PARALLEL_API_KEY;
  if (!key || key.trim() === '') {
    throw new RunError(
      'PARALLEL_API_KEY is not set. Get a key at https://platform.parallel.ai and export it:\n' +
        '  export PARALLEL_API_KEY=...\n' +
        'It is read from the environment only and never written to a file.',
    );
  }
  return key;
}

// --- Parallel API --------------------------------------------------------------

function progress(msg) {
  process.stderr.write(`[parallel-research] ${msg}\n`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiFetch(parallelToken, urlPath, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${urlPath}`, {
      ...init,
      signal: controller.signal,
      headers: { 'x-api-key': parallelToken, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

async function submitRun(parallelToken, query, processor, outputSchema) {
  let res;
  try {
    res = await apiFetch(parallelToken, '/tasks/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: query, processor, task_spec: { output_schema: outputSchema } }),
    });
  } catch (err) {
    throw new RunError(`could not reach Parallel to submit the run: ${err.message}`);
  }
  const { json, text } = await readBody(res);
  if (!res.ok) throw new RunError(`Parallel rejected the run (HTTP ${res.status}): ${text.slice(0, 500)}`);
  const runId = json?.run_id ?? json?.id;
  if (!runId) throw new RunError(`Parallel did not return a run id: ${text.slice(0, 500)}`);
  return runId;
}

// Ceilings sit comfortably above Parallel's published per-tier max latency so a
// still-running paid task is never aborted (ultra2x ≤50m, ultra4x ≤90m, ultra8x ≤2h).
function maxWaitMs(processor) {
  switch (processor.replace(/-fast$/, '')) {
    case 'ultra8x':
      return 180 * 60_000;
    case 'ultra4x':
      return 120 * 60_000;
    case 'ultra2x':
      return 75 * 60_000;
    case 'ultra':
      return 45 * 60_000;
    default:
      return 20 * 60_000;
  }
}

async function pollUntilDone(parallelToken, runId, processor) {
  const start = Date.now();
  const ceiling = maxWaitMs(processor);
  let attempt = 0;
  let transient = 0;
  for (;;) {
    if (Date.now() - start > ceiling) {
      throw new RunError(
        `run ${runId} did not complete within the ${Math.round(ceiling / 60_000)}-minute ceiling. ` +
          `Retrieve it later: GET ${API_BASE}/tasks/runs/${runId}/result`,
      );
    }
    await sleep(attempt < POLL_DELAYS_MS.length ? POLL_DELAYS_MS[attempt] : POLL_STEADY_MS);
    attempt++;

    let res;
    try {
      res = await apiFetch(parallelToken, `/tasks/runs/${runId}`);
    } catch (err) {
      if (++transient > MAX_TRANSIENT_RETRIES) {
        throw new RunError(`lost contact with Parallel while polling run ${runId}: ${err.message}`);
      }
      progress(`poll network error (${err.message}); retrying (${transient}/${MAX_TRANSIENT_RETRIES})`);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (++transient > MAX_TRANSIENT_RETRIES) {
        throw new RunError(`Parallel returned HTTP ${res.status} repeatedly while polling run ${runId}`);
      }
      const retryAfter = Number(res.headers.get('retry-after'));
      if (Number.isFinite(retryAfter) && retryAfter > 0) await sleep(retryAfter * 1_000);
      progress(`poll HTTP ${res.status}; retrying (${transient}/${MAX_TRANSIENT_RETRIES})`);
      continue;
    }
    transient = 0;
    const { json, text } = await readBody(res);
    if (!res.ok) throw new RunError(`Parallel poll failed (HTTP ${res.status}): ${text.slice(0, 500)}`);
    const status = json?.status ?? json?.run?.status;
    if (status === 'completed') return;
    if (status === 'failed' || status === 'cancelled') {
      throw new RunError(`run ${runId} ended with status '${status}'`);
    }
    progress(`run ${runId} ${status ?? 'running'} (${Math.round((Date.now() - start) / 1_000)}s elapsed)`);
  }
}

async function fetchResult(parallelToken, runId) {
  let res;
  try {
    res = await apiFetch(parallelToken, `/tasks/runs/${runId}/result`);
  } catch (err) {
    throw new RunError(`could not fetch the result for run ${runId}: ${err.message}`);
  }
  const { json, text } = await readBody(res);
  if (!res.ok) throw new RunError(`result fetch failed for run ${runId} (HTTP ${res.status}): ${text.slice(0, 500)}`);
  const output = json?.output ?? json;
  if (output?.error) throw new RunError(`run ${runId} reported an error: ${output.error}`);
  return output ?? {};
}

// --- report assembly -----------------------------------------------------------

function yamlScalar(value) {
  if (value === null || value === undefined) return 'null';
  const str = String(value);
  return /^[A-Za-z0-9_./:-]+$/.test(str) ? str : JSON.stringify(str);
}

// Wrap body in a code fence longer than any backtick run it contains, so content
// with embedded ``` cannot break out of the block.
function fence(body, lang = '') {
  const longest = (body.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return `${ticks}${lang}\n${body}\n${ticks}`;
}

function renderSources(basis) {
  const seen = new Set();
  const sources = [];
  for (const entry of Array.isArray(basis) ? basis : []) {
    for (const c of Array.isArray(entry?.citations) ? entry.citations : []) {
      if (!c?.url || seen.has(c.url)) continue;
      seen.add(c.url);
      sources.push(c);
    }
  }
  if (sources.length === 0) return '';
  const lines = ['## Sources', ''];
  sources.forEach((c, i) => {
    lines.push(`${i + 1}. [${c.title || c.url}](${c.url})`);
    const excerpt = Array.isArray(c.excerpts) ? c.excerpts[0] : undefined;
    if (excerpt) lines.push(`   > ${String(excerpt).replace(/\s+/g, ' ').trim()}`);
  });
  return `${lines.join('\n')}\n`;
}

function renderReportBody(mode, output) {
  const content = output?.content;
  if (mode === 'text') {
    if (typeof content !== 'string' || content.trim() === '') return null;
    return content.trim();
  }
  if (content === null || content === undefined) return null;
  const note =
    mode === 'auto'
      ? 'Parallel auto-schema (structured) result:'
      : 'Parallel json-schema (structured) result:';
  return `${note}\n\n${fence(JSON.stringify(content, null, 2), 'json')}`;
}

function assembleReport({ date, profileLabel, processor, runId, mode, reportPath, query, output }) {
  const body = renderReportBody(mode, output);
  if (body === null) {
    throw new RunError(`run ${runId} completed but returned no usable content; not writing an empty report`);
  }
  const frontmatter = [
    '---',
    `date: ${date}`,
    `profile: ${yamlScalar(profileLabel)}`,
    `processor: ${yamlScalar(processor)}`,
    `parallel_run_id: ${yamlScalar(runId)}`,
    `output_mode: ${mode}`,
    `report_path: ${yamlScalar(reportPath)}`,
    `query_sha256: ${createHash('sha256').update(query, 'utf8').digest('hex')}`,
    '---',
  ].join('\n');
  const sources = renderSources(output?.basis);
  return (
    `${frontmatter}\n\n` +
    `## Submitted query\n\n${fence(query)}\n\n` +
    `## Research report\n\n${body}\n` +
    (sources ? `\n${sources}` : '')
  );
}

// --- output path + atomic write ------------------------------------------------

function slugify(query) {
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'research';
}

function deriveOutPath(outArg, date, query) {
  if (outArg) return path.resolve(process.cwd(), outArg);
  const dir = path.join(RUN_CWD, 'research-reports');
  const stem = `${date}-${slugify(query)}`;
  let candidate = path.join(dir, `${stem}.md`);
  let n = 2;
  while (existsSync(candidate)) candidate = path.join(dir, `${stem}-${n++}.md`);
  return candidate;
}

function relativeToCwd(outPath) {
  const relative = path.relative(RUN_CWD, outPath);
  return relative.startsWith('..') || path.isAbsolute(relative) ? outPath : relative.split(path.sep).join('/');
}

function writeReportAtomic(outPath, contents) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp-${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(tmp, contents, 'utf8');
    renameSync(tmp, outPath);
  } catch (err) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      /* best effort */
    }
    throw new RunError(`failed to write report to ${outPath}: ${err.message}`);
  }
}

// --- main ----------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Offline validation first — no API call, no spend, until all of this passes.
  const processor = validateProcessor(args.processor);
  const { mode, schema } = resolveOutputSchema(args.output_schema);
  const query = resolveQuery(args.query);
  const parallelToken = requireParallelToken();

  if (TOP_TIERS.has(processor) && !args.yes) {
    progress(`processor '${processor}' is a top tier (~$0.60–$2.40 per task). Proceeding; pass --yes to silence.`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const outPath = deriveOutPath(args.out, date, query);
  const reportPath = relativeToCwd(outPath);

  progress(`submitting ${mode} run on processor '${processor}'…`);
  const runId = await submitRun(parallelToken, query, processor, schema);
  progress(`run ${runId} accepted; polling (ceiling ${Math.round(maxWaitMs(processor) / 60_000)} min)…`);
  await pollUntilDone(parallelToken, runId, processor);
  const output = await fetchResult(parallelToken, runId);

  const report = assembleReport({
    date,
    profileLabel: args.profile_label ?? null,
    processor,
    runId,
    mode,
    reportPath,
    query,
    output,
  });
  writeReportAtomic(outPath, report);
  progress(`report written (run ${runId}).`);
  process.stdout.write(`${reportPath}\n`);
}

main().catch((err) => {
  if (err instanceof UsageError) {
    process.stderr.write(`parallel-research: ${err.message}\n\n${USAGE}\n`);
    process.exit(2);
  }
  process.stderr.write(`parallel-research: ${err.message}\n`);
  process.exit(1);
});
