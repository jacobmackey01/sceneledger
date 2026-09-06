import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dataset } from "./dataset.js";
import { scoreCases } from "./score.js";
import { enforceEvidence } from "../src/evidence.js";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node eval/replay.js saved-run.json new-output.json");
const run = JSON.parse(await readFile(input, "utf8"));
const hash = createHash("sha256").update(JSON.stringify(dataset)).digest("hex");
if (hash !== run.sourceBundleSha256) throw new Error("Dataset changed; cannot silently replay against a different source bundle.");
const groups = run.groups.map((group) => {
  const data = dataset.find((item) => item.id === group.group);
  const checked = enforceEvidence(group.raw, data.sources);
  return { group: group.group, checked, withoutChecks: scoreCases(data.cases, group.raw.claims, { provisional: true }), withChecks: scoreCases(data.cases, checked.claims, { provisional: true }) };
});
await writeFile(output, JSON.stringify({ status: "OFFLINE GUARD REPLAY", labelBasis: "Provisional assistant labels; no human accuracy claim", input, sourceBundleSha256: hash,
  guardSha256: createHash("sha256").update(await readFile("src/evidence.js")).digest("hex"), replayedAt: new Date().toISOString(), groups }, null, 2), { flag: "wx" });
console.log(`Replayed ${groups.length} groups without provider calls: ${output}`);
