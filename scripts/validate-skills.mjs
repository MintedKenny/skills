#!/usr/bin/env node
// Validate every Agent Skill in this repo. Walks skills/<name>/ and checks
// structure, frontmatter, the Codex display block, and self-containment.
// Run with `npm run validate`. The CI workflow runs this on every push/PR.

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const skillsDir = path.join(root, "skills");
const MAX_DESCRIPTION = 200; // Claude.ai frontmatter limit
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // lowercase, digits, single hyphens

const errors = [];
const seen = new Set();
const rel = (p) => path.relative(root, p);
const exists = async (p) => stat(p).then(() => true).catch(() => false);

function parseFrontmatter(content, file) {
  if (!content.startsWith("---\n")) {
    errors.push(`${rel(file)}: must start with YAML frontmatter.`);
    return null;
  }
  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    errors.push(`${rel(file)}: unterminated frontmatter.`);
    return null;
  }
  try {
    const data = YAML.parse(content.slice(4, end));
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      errors.push(`${rel(file)}: frontmatter must be a mapping.`);
      return null;
    }
    return data;
  } catch (e) {
    errors.push(`${rel(file)}: invalid frontmatter YAML: ${e.message}`);
    return null;
  }
}

async function validateSkill(name) {
  const dir = path.join(skillsDir, name);
  const skillMd = path.join(dir, "SKILL.md");
  if (!(await exists(skillMd))) {
    errors.push(`skills/${name}: missing SKILL.md.`);
    return;
  }
  const content = await readFile(skillMd, "utf8");
  const fm = parseFrontmatter(content, skillMd);
  if (!fm) return;

  // name == folder, well-formed, unique
  if (fm.name !== name) {
    errors.push(`${rel(skillMd)}: name "${fm.name}" must equal folder "${name}".`);
  } else if (!NAME.test(name)) {
    errors.push(`${rel(skillMd)}: name must be lowercase letters, digits, and single hyphens.`);
  } else if (seen.has(name)) {
    errors.push(`${rel(skillMd)}: duplicate skill name.`);
  } else {
    seen.add(name);
  }

  // description present and within the Claude.ai limit
  const d = fm.description;
  if (typeof d !== "string" || d.trim() === "") {
    errors.push(`${rel(skillMd)}: description is required.`);
  } else if (d.length > MAX_DESCRIPTION) {
    errors.push(`${rel(skillMd)}: description is ${d.length} chars (max ${MAX_DESCRIPTION}).`);
  }

  // self-contained: skills install individually, so a support file must live
  // inside the skill folder — never reached through a "../" escape.
  for (const m of content.matchAll(/`(\.\.\/[^`]+)`/g)) {
    errors.push(`${rel(skillMd)}: "${m[1]}" escapes the skill folder; move the file inside ${name}/.`);
  }
  for (const m of content.matchAll(/`((?:references|scripts|assets)\/[A-Za-z0-9._/-]+)`/g)) {
    if (!(await exists(path.join(dir, m[1])))) {
      errors.push(`${rel(skillMd)}: pointer "${m[1]}" does not exist.`);
    }
  }

  // Codex display metadata (every skill ships cross-agent)
  const openai = path.join(dir, "agents", "openai.yaml");
  if (!(await exists(openai))) {
    errors.push(`skills/${name}: missing agents/openai.yaml.`);
    return;
  }
  let meta;
  try {
    meta = YAML.parse(await readFile(openai, "utf8"));
  } catch (e) {
    errors.push(`${rel(openai)}: invalid YAML: ${e.message}`);
    return;
  }
  const iface = meta?.interface;
  if (!iface || typeof iface !== "object" || Array.isArray(iface)) {
    errors.push(`${rel(openai)}: an interface block is required.`);
    return;
  }
  for (const f of ["display_name", "short_description", "default_prompt"]) {
    if (typeof iface[f] !== "string" || iface[f].trim() === "") {
      errors.push(`${rel(openai)}: interface.${f} must be a non-empty string.`);
    }
  }
}

if (!(await exists(skillsDir))) {
  console.error("skills/: directory not found.");
  process.exit(1);
}

const names = (await readdir(skillsDir, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

for (const name of names) await validateSkill(name);

if (errors.length) {
  console.error("Skill validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Validated ${names.length} skill${names.length === 1 ? "" : "s"}.`);
