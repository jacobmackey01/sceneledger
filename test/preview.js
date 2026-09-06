// Local browser QA only. Never imported by the production runtime; no paid providers.
process.env.NODE_ENV = "test";
const { createApp } = await import("../src/server.js");
const { scriptLines } = await import("../src/script-review.js");
const pause = () => new Promise((resolve) => setTimeout(resolve, 250));
const app = createApp({
  config: { ready: true, GOOGLE_CLOUD_PROJECT: "local-fixture", PARALLEL_API_KEY: "fixture-not-a-key", GEMINI_MODEL: "LOCAL TEST FIXTURES — NO LIVE RESEARCH" },
  geminiFactory: () => {
    let attempts = 0;
    return { model: "LOCAL TEST FIXTURES — NO LIVE RESEARCH",
      async plan() { await pause(); return { researchQuestions: [{ id: "q1" }, { id: "q2" }] }; },
      async synthesize(request, questions, sources) {
        await pause(); attempts++;
        const lines = request.mode === "script" ? scriptLines(request.script) : [{ id: undefined, original: "Fictional venue attendance declined." }];
        return { headline: "LOCAL TEST — synthetic evidence only", summary: "This local fixture exercises rendering and safeguards. It is not real research or a model-generated factual assessment.",
          claims: lines.map((line, index) => ({ lineId: line.id, claim: line.original, status: index === 0 && attempts === 1 ? "unverified" : "supported", confidence: "low",
            evidence: index === 0 && attempts === 1 ? [] : [{ sourceId: sources.at(-1).id, excerpt: "Synthetic fixture: attendance fell." }],
            productionUse: "Fixture only; never use as factual narration.", rationale: "Synthetic test data for browser QA.", suggestedWording: "Synthetic fixture clause; not real evidence." })),
          risks: ["Local QA fixture, not research."], openQuestions: ["Check the original sources in a real run."] };
      },
    };
  },
  parallelFactory: () => ({ provider: "LOCAL SYNTHETIC SEARCH FIXTURE", async search(question) { await pause(); return [{ title: "Synthetic source for QA", url: `https://example.com/${question.id}`, queryId: question.id, excerpts: ["Synthetic fixture: attendance fell."] }]; } }),
});
app.listen(8081, "127.0.0.1", () => console.log("Local synthetic QA preview: http://127.0.0.1:8081 — NO LIVE PROVIDER CALLS"));
