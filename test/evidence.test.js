import test from "node:test";
import assert from "node:assert/strict";
import { enforceEvidence, normalizeSources } from "../src/evidence.js";
import { sources, synthesis } from "./fixtures.js";

test("normalizeSources deduplicates URLs and removes post-cutoff evidence", () => {
  const sources = normalizeSources([
    [
      { title: "A", url: "https://example.com/a", publishDate: "2026-01-02", excerpts: ["one"], queryId: "q1" },
      { title: "A copy", url: "https://example.com/a", publishDate: "2026-01-02", excerpts: ["two"], queryId: "q2" },
      { title: "Future", url: "https://example.com/future", publishDate: "2027-01-01", excerpts: ["future"], queryId: "q1" },
    ],
  ], "2026-12-31");

  assert.equal(sources.length, 1);
  assert.deepEqual(sources[0].queryIds, ["q1", "q2"]);
  assert.deepEqual(sources[0].excerpts, ["one", "two"]);
});

test("a real source ID does not validate a fabricated quote", () => {
  const result = enforceEvidence(synthesis([{ sourceId: "s1", excerpt: "Attendance doubled by 100 percent." }]), sources);
  assert.equal(result.audit.passed, false);
  assert.equal(result.audit.unmatchedExcerpts, 1);
  assert.equal(result.claims[0].status, "unverified");
  assert.deepEqual(result.claims[0].evidence, []);
});

test("accepts contiguous quotes with whitespace differences, but not paraphrases or joined passages", () => {
  assert.equal(enforceEvidence(synthesis([{ sourceId: "s1", excerpt: "Attendance\n fell by 2 percent." }]), sources).audit.passed, true);
  for (const excerpt of ["Attendance fell by 20 percent.", "Attendance rose by 2 percent.", "Attendance … Revenue rose.", " ", "attendance fell by 2 percent."]) {
    assert.equal(enforceEvidence(synthesis([{ sourceId: "s1", excerpt }]), sources).audit.passed, false, excerpt);
  }
});

test("withdraws narrative and production advice after a citation intervention", () => {
  const input = synthesis([{ sourceId: "s999", excerpt: "Attendance doubled." }]);
  input.headline = "Attendance doubled";
  input.summary = "The evidence proves attendance doubled.";
  input.risks = ["Costs doubled too."];
  input.openQuestions = ["Why did attendance double?"];
  input.claims[0].productionUse = "State doubled in narration.";
  const result = enforceEvidence(input, sources);
  assert.equal(result.claims[0].status, "unverified");
  for (const value of [result.headline, result.summary, result.claims[0].productionUse, ...result.risks, ...result.openQuestions]) {
    assert.doesNotMatch(value, /doubled|double\?/);
  }
  assert.equal(input.headline, "Attendance doubled", "does not mutate provider input");
});

test("one remaining valid quote does not preserve an affected supported claim", () => {
  const result = enforceEvidence(synthesis([
    { sourceId: "s1", excerpt: "Attendance fell by 2 percent." },
    { sourceId: "s1", excerpt: "Attendance doubled." },
  ]), sources);
  assert.equal(result.claims[0].evidence.length, 1);
  assert.equal(result.claims[0].status, "unverified");
});

test("contested claims without evidence are downgraded and unverified advice stays cautious", () => {
  assert.equal(enforceEvidence(synthesis([], "contested"), sources).audit.downgradedClaims, 1);
  const result = enforceEvidence(synthesis([], "unverified"), sources);
  assert.equal(result.claims[0].confidence, "low");
  assert.match(result.claims[0].productionUse, /Do not present/);
  assert.match(result.audit.scope, /does not verify claim meaning/);
});

test("missing source excerpts fail closed", () => {
  assert.equal(enforceEvidence(synthesis(), [{ id: "s1" }]).audit.passed, false);
});

test("enforceEvidence removes invented citations and downgrades unsupported claims", () => {
  const synthesis = {
    headline: "Test",
    summary: "A sufficiently long test summary.",
    claims: [{
      claim: "A claim with an invented source",
      status: "supported",
      confidence: "high",
      evidence: [{ sourceId: "s99", excerpt: "not present" }],
      productionUse: "Do not put this in the script.",
    }],
    risks: [],
    openQuestions: [],
  };
  const checked = enforceEvidence(synthesis, [{ id: "s1", url: "https://example.com" }]);

  assert.equal(checked.claims[0].status, "unverified");
  assert.equal(checked.claims[0].confidence, "low");
  assert.equal(checked.claims[0].evidence.length, 0);
  assert.equal(checked.audit.removedCitations, 1);
  assert.equal(checked.audit.downgradedClaims, 1);
  assert.equal(checked.audit.passed, false);
});
