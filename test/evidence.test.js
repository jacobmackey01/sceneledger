import test from "node:test";
import assert from "node:assert/strict";
import { enforceEvidence, normalizeSources } from "../src/evidence.js";

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
