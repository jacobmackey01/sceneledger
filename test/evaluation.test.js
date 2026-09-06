import test from "node:test";
import assert from "node:assert/strict";
import { dataset } from "../eval/dataset.js";
import { scoreCases } from "../eval/score.js";
import { enforceEvidence } from "../src/evidence.js";
import { sources, synthesis } from "./fixtures.js";

test("evaluation has 24 unique probes and does not claim human labels", () => {
  const cases = dataset.flatMap((group) => group.cases);
  assert.equal(cases.length, 24);
  assert.equal(new Set(cases.map((item) => item.id)).size, 24);
  assert.throws(() => scoreCases(cases, []), /Missing/);
  assert.deepEqual(cases.reduce((a, c) => ({ ...a, [c.proposedLabel]: (a[c.proposedLabel] || 0) + 1 }), {}), { supported: 8, contradicted: 8, insufficient: 8 });
});
test("metrics count omissions and preserve explicit denominators", () => {
  const cases = dataset[0].cases;
  const result = scoreCases(cases, [{ lineId: "l1", status: "supported" }, { lineId: "l3", status: "supported" }], { provisional: true });
  assert.deepEqual(result.falseAcceptance, { numerator: 1, denominator: 4, rate: .25 });
  assert.deepEqual(result.falseRejection, { numerator: 1, denominator: 2, rate: .5 });
  assert.equal(result.usefulCoverage.numerator, 1);
  assert.equal(result.outputCoverage.denominator, 6);
});
test("a matched quote can still support a wrong interpretation: known semantic failure", () => {
  const input = synthesis();
  input.claims[0].claim = "Attendance rose by 200 percent.";
  assert.equal(enforceEvidence(input, sources).claims[0].status, "supported");
});
