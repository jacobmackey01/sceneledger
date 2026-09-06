import test from "node:test";
import assert from "node:assert/strict";
import { buildScriptReview, scriptLines } from "../src/script-review.js";
import { researchRequestSchema } from "../src/schema.js";
import { enforceEvidence } from "../src/evidence.js";
import { runResearchWorkflow } from "../src/workflow.js";
import { request, providers, synthesis, sources } from "./fixtures.js";

test("script lines preserve exact text, order, blank-line positions and duplicates", () => {
  assert.deepEqual(scriptLines("  Same.\r\n\r\nSame.\nLast."), [
    { id: "l1", number: 1, original: "  Same." }, { id: "l3", number: 3, original: "Same." }, { id: "l4", number: 4, original: "Last." },
  ]);
});
test("script validation caps work, brief mode remains backward compatible", () => {
  assert.equal(researchRequestSchema.parse(request).mode, "brief");
  for (const script of [" ", Array(21).fill("A line.").join("\n"), "x".repeat(6001)]) {
    assert.equal(researchRequestSchema.safeParse({ ...request, mode: "script", script }).success, false);
  }
});
test("omitted lines and wrong IDs stay visible; multiple claims aggregate conservatively", () => {
  const review = buildScriptReview({ mode: "script", script: "One.\nTwo." }, [
    { lineId: "l1", status: "supported" }, { lineId: "l1", status: "unverified" }, { lineId: "l999", status: "supported" },
  ]);
  assert.deepEqual(review.lines.map((line) => line.status), ["unverified", "unassessed"]);
  assert.equal(review.unassignedClaims.length, 1);
  assert.equal(review.assessedLines, 1);
});
test("invalid evidence withdraws proposed wording and rationale without changing the original", () => {
  const draft = synthesis([{ sourceId: "s1", excerpt: "Invented quotation" }]);
  Object.assign(draft.claims[0], { lineId: "l1", suggestedWording: "Unsafe claim.", rationale: "Unsafe reasoning." });
  const checked = enforceEvidence(draft, sources);
  assert.equal(checked.claims[0].suggestedWording, null);
  assert.doesNotMatch(checked.claims[0].rationale, /Unsafe/);
  assert.equal(checked.claims[0].citationIssues.length, 1);
  assert.equal(draft.claims[0].suggestedWording, "Unsafe claim.");
});
test("workflow returns script review and frozen request context", async () => {
  const services = providers();
  const draft = synthesis();
  draft.claims[0].lineId = "l1";
  services.gemini.synthesize = async () => draft;
  const result = await runResearchWorkflow({ request: { ...request, mode: "script", script: "Attendance fell.\nUnreviewed." }, ...services });
  assert.equal(result.scriptReview.lines[0].original, "Attendance fell.");
  assert.equal(result.scriptReview.lines[1].status, "unassessed");
});
