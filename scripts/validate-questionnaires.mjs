import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../data/questionnaires/", import.meta.url);
const registry = JSON.parse(await readFile(new URL("registry.json", root), "utf8"));
const schedules = JSON.parse(await readFile(new URL("scheduling-rules.json", root), "utf8"));
const labRules = JSON.parse(await readFile(new URL("lab-trigger-rules.json", root), "utf8"));
const evidence = JSON.parse(await readFile(new URL("evidence/sources.json", root), "utf8"));

const ids = new Set();
for (const entry of registry.instruments) {
  assert(!ids.has(entry.id), `Duplicate instrument id: ${entry.id}`);
  ids.add(entry.id);
  const document = JSON.parse(await readFile(new URL(entry.file, root), "utf8"));
  assert.equal(document.id, entry.id, `Registry/file id mismatch: ${entry.id}`);
  assert(Array.isArray(document.items) && document.items.length > 0, `${entry.id} has no items`);
  assert.equal(new Set(document.items.map((item) => item.id)).size, document.items.length, `${entry.id} has duplicate item ids`);
}

for (const rule of schedules.rules) {
  const target = rule.instrumentId ?? rule.schedule;
  assert(ids.has(target), `Unknown scheduled instrument: ${target}`);
}

for (const rule of labRules.rules) {
  for (const target of rule.schedule) assert(ids.has(target), `Unknown lab-trigger instrument: ${target}`);
}

const evidenceIds = new Set(evidence.sources.map((source) => source.id));
for (const rule of labRules.rules) {
  assert(evidenceIds.has(rule.evidenceId) || rule.evidenceId === "SOURCE_RANGE_ONLY", `Unknown evidence id: ${rule.evidenceId}`);
}

const directoryNames = await readdir(root, { withFileTypes: true });
assert(!directoryNames.some((entry) => /PROMIS/i.test(entry.name)), "PROMIS item directory must not be bundled without permission");
assert(!directoryNames.some((entry) => /^HADS$/i.test(entry.name)), "HADS item directory must not be bundled without a licence");

console.log(`Validated ${ids.size} questionnaire definitions, ${schedules.rules.length} schedule rules and ${labRules.rules.length} lab rules.`);
