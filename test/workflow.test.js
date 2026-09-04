import test from "node:test";
import assert from "node:assert/strict";
import { runResearchWorkflow } from "../src/workflow.js";

test("workflow records both providers and passes valid citations", async () => {
  const request = {
    title: "Test production",
    productionType: "documentary",
    audience: "General audience",
    brief: "A long enough production brief that identifies a factual question for research.",
    cutoffDate: "2026-09-01",
  };
  const gemini = {
    model: "gemini-3.8-flash",
    async plan() {
      return { researchQuestions: [
        { id: "q1", label: "First question", query: "first query", reason: "Verify one" },
        { id: "q2", label: "Second question", query: "second query", reason: "Verify two" },
      ] };
    },
    async synthesize(_request, _questions, sources) {
      return {
        headline: "A tested ledger",
        summary: "This is a sufficiently long and bounded research summary.",
        claims: [{
          claim: "The supplied source supports this test claim.",
          status: "supported",
          confidence: "medium",
          evidence: [{ sourceId: sources[0].id, excerpt: "Test excerpt" }],
          productionUse: "Keep the source attached to the line.",
        }],
        risks: [],
        openQuestions: [],
      };
    },
  };
  const parallel = {
    provider: "Parallel Search API",
    async search(question) {
      return [{
        title: question.label,
        url: `https://example.com/${question.id}`,
        publishDate: "2026-08-01",
        excerpts: ["Test excerpt"],
        queryId: question.id,
      }];
    },
  };

  const result = await runResearchWorkflow({ request, gemini, parallel });
  assert.equal(result.audit.passed, true);
  assert.equal(result.sources.length, 2);
  assert.equal(result.workflow.planner, "gemini-3.8-flash");
  assert.equal(result.workflow.searchProvider, "Parallel Search API");
});
