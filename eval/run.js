import { writeFile, readFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dataset, datasetMetadata } from "./dataset.js";
import { scoreCases } from "./score.js";
import { enforceEvidence } from "../src/evidence.js";
import { createGeminiService } from "../src/gemini.js";
import { loadConfig } from "../src/config.js";

const args = process.argv.slice(2);
const output = args.find((arg) => arg.startsWith("--out="))?.slice(6);
if (!output) throw new Error("Supply --out=path.json (new file; no overwrite).");
const reviewPath = args.find((arg) => arg.startsWith("--reviews="))?.slice(10);
const reviews = reviewPath ? JSON.parse(await readFile(reviewPath, "utf8")) : null;
const provisional = args.includes("--provisional");
const groups = structuredClone(dataset);
if (reviews) for (const group of groups) for (const item of group.cases) item.review = reviews[item.id];
const base = { dataset: datasetMetadata, sourceBundleSha256: createHash("sha256").update(JSON.stringify(dataset)).digest("hex") };
base.runtimeFilesSha256 = {};
for (const filename of ["src/prompts.js", "src/schema.js", "src/evidence.js", "src/gemini.js"]) {
  base.runtimeFilesSha256[filename] = createHash("sha256").update(await readFile(filename)).digest("hex");
}
try { base.commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { base.commit = null; }
base.workingTreeDirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
if (args.includes("--review-template")) {
  await writeFile(output, JSON.stringify(Object.fromEntries(groups.flatMap((g) => g.cases.map((item) => [item.id, item.review]))), null, 2), { flag: "wx" });
} else if (!args.includes("--live")) {
  await writeFile(output, JSON.stringify({ ...base, status: "NOT RUN; use --live for four billable Gemini synthesis calls; no Parallel searches", dataset: groups }, null, 2), { flag: "wx" });
} else {
  // Validate all labels before incurring provider costs.
  for (const group of groups) scoreCases(group.cases, [], { provisional });
  const config = loadConfig();
  if (!config.GOOGLE_CLOUD_PROJECT) throw new Error("GOOGLE_CLOUD_PROJECT is required.");
  const gemini = createGeminiService(config);
  const run = { ...base, startedAt: new Date().toISOString(), model: gemini.model, labelBasis: provisional ? "PROVISIONAL — no human accuracy claim" : "reviewer-supplied labels", groups: [], searchCalls: 0 };
  // Reserve output before spending; checkpoints preserve completed groups if a later call fails.
  const checkpointDirectory = `${output}.checkpoints`;
  await mkdir(checkpointDirectory);
  await writeFile(output, JSON.stringify({ ...run, status: "RUNNING", checkpoints: checkpointDirectory }, null, 2), { flag: "wx" });
  for (const group of groups) {
    const started = performance.now();
    const request = { title: `Evaluation: ${group.title}`, productionType: "documentary", audience: "General audience", mode: "script", brief: "Assess each narration line against only the supplied excerpt. Do not rely on outside knowledge.", script: group.cases.map((item) => item.claim).join("\n") };
    const raw = await gemini.synthesize(request, [], group.sources);
    const checked = enforceEvidence(raw, group.sources);
    const result = { group: group.id, runtimeMs: performance.now() - started, raw, checked,
      withoutChecks: scoreCases(group.cases, raw.claims, { provisional }), withChecks: scoreCases(group.cases, checked.claims, { provisional }) };
    run.groups.push(result);
    await writeFile(`${checkpointDirectory}/${group.id}.json`, JSON.stringify(result, null, 2), { flag: "wx" });
  }
  run.completedAt = new Date().toISOString();
  run.usage = gemini.getUsage();
  run.billedCost = null;
  run.costNote = "Token metadata is provider-reported, not an invoice; no monetary estimate inferred.";
  await writeFile(`${output}.complete.json`, JSON.stringify({ ...run, status: "COMPLETE" }, null, 2), { flag: "wx" });
}
console.log(`Evaluation artifact: ${output}`);
