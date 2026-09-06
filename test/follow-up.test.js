import test from "node:test";
import assert from "node:assert/strict";
import { runResearchWorkflow } from "../src/workflow.js";
import { providers, request, synthesis } from "./fixtures.js";

function scenario({ noNew = false, failSearch = false, failModel = false, wrongClaim = false, badQuote = false } = {}) {
  const services = providers();
  let syntheses = 0;
  let searches = 0;
  services.parallel.search = async (question) => {
    searches++;
    if (question.id.startsWith("follow-up") && failSearch) throw new Error("private provider details");
    return [{ title: "Source", url: question.id.startsWith("follow-up") && !noNew ? "https://example.com/new" : "https://example.com/old", excerpts: ["Attendance fell by 2 percent."], queryId: question.id }];
  };
  services.gemini.synthesize = async (req, questions, sources) => {
    syntheses++;
    if (syntheses === 1) {
      const draft = synthesis([], "unverified");
      draft.claims = Array.from({ length: 3 }, (_, index) => ({ ...draft.claims[0], claim: `Claim ${index + 1} remains unresolved.`, lineId: `l${index + 1}` }));
      return draft;
    }
    if (failModel) throw new Error("private provider details");
    const draft = synthesis();
    draft.claims = req.script.split("\n").map((claim, index) => ({ ...draft.claims[0], claim: wrongClaim ? "A different claim entirely." : claim, lineId: `l${index + 1}`,
      evidence: [{ sourceId: sources.at(-1).id, excerpt: badQuote ? "Fabricated." : "Attendance fell by 2 percent." }], rationale: "The new excerpt provides evidence." }));
    return draft;
  };
  return { ...services, counts: () => ({ syntheses, searches }) };
}
test("follow-up is opt-in and bounded; only selected claims change and source IDs stay stable", async () => {
  const services = scenario();
  const result = await runResearchWorkflow({ request: { ...request, followUp: true }, ...services });
  assert.deepEqual(services.counts(), { syntheses: 2, searches: 4 });
  assert.deepEqual(result.workflow.providerCalls, { gemini: 3, search: 4 });
  assert.deepEqual(result.claims.map((claim) => claim.status), ["supported", "supported", "unverified"]);
  assert.equal(result.claims[0].lineId, "l1");
  assert.equal(result.sources[0].url, "https://example.com/old");
  assert.equal(result.sources[0].id, "s1");
  assert.equal(result.sources[1].id, "s2");
  assert.equal(result.followUp.targets[0].before, "unverified");
  assert.equal(result.followUp.targets[0].after, "supported");
  assert.match(result.summary, /earlier narrative summary is withheld/);
});
test("disabled and unnecessary follow-up make no extra provider calls", async () => {
  const services = scenario();
  assert.equal((await runResearchWorkflow({ request, ...services })).followUp.status, "disabled");
  assert.deepEqual(services.counts(), { syntheses: 1, searches: 2 });
  assert.equal((await runResearchWorkflow({ request: { ...request, followUp: true }, ...providers() })).followUp.status, "not-needed");
});
test("no new evidence or failed searches preserve the initial checked ledger", async () => {
  for (const options of [{ noNew: true }, { failSearch: true }]) {
    const services = scenario(options);
    const result = await runResearchWorkflow({ request: { ...request, followUp: true }, ...services });
    assert.equal(services.counts().syntheses, 1);
    assert.ok(result.claims.every((claim) => claim.status === "unverified"));
    assert.doesNotMatch(JSON.stringify(result), /private provider/);
  }
});
test("changed claim identity, failed reassessment and bad quotations cannot upgrade a target", async () => {
  for (const options of [{ failModel: true }, { wrongClaim: true }, { badQuote: true }]) {
    const result = await runResearchWorkflow({ request: { ...request, followUp: true }, ...scenario(options) });
    assert.ok(result.claims.every((claim) => claim.status === "unverified"));
    assert.doesNotMatch(JSON.stringify(result), /private provider/);
    assert.equal(result.workflow.stages.at(-1).stage, "complete");
  }
});
test("oversized research plans fail before search spend", async () => {
  const services = scenario();
  services.gemini.plan = async () => ({ researchQuestions: Array(6).fill({ id: "q" }) });
  await assert.rejects(runResearchWorkflow({ request, ...services }), /1–5/);
  assert.equal(services.counts().searches, 0);
});
