import { enforceEvidence, normalizeSources } from "./evidence.js";
import { buildScriptReview } from "./script-review.js";
import { runFollowUp } from "./follow-up.js";

export async function runResearchWorkflow({ request, gemini, parallel, onProgress = () => {} }) {
  const startedAt = new Date().toISOString();
  const calls = { gemini: 0, search: 0 };
  const stages = [];
  const progress = (stage) => {
    const event = { stage, at: new Date().toISOString() };
    stages.push(event);
    onProgress(event);
  };
  progress("plan");
  calls.gemini++;
  const plan = await gemini.plan(request);
  if (!plan.researchQuestions?.length || plan.researchQuestions.length > 5) throw new Error("Research plan must contain 1–5 queries");

  progress("parallel-search");
  calls.search += plan.researchQuestions.length;
  const searchGroups = await Promise.all(
    plan.researchQuestions.map((question) => parallel.search(question)),
  );
  let sources = normalizeSources(searchGroups, request.cutoffDate);
  if (sources.length === 0) {
    throw new Error("Parallel Search returned no sources within the requested cutoff");
  }

  progress("synthesize");
  calls.gemini++;
  const synthesis = await gemini.synthesize(request, plan.researchQuestions, sources);
  progress("citation-audit");
  let checked = enforceEvidence(synthesis, sources);
  let followUp = { enabled: false, status: "disabled", searchCalls: 0, reassessmentCalls: 0, targets: [] };
  if (request.followUp) ({ checked, sources, followUp } = await runFollowUp({ request, checked, sources, gemini, parallel, progress, calls }));
  progress("complete");

  return {
    ...checked,
    request,
    followUp,
    scriptReview: buildScriptReview(request, checked.claims),
    sources,
    workflow: {
      startedAt,
      completedAt: new Date().toISOString(),
      planner: gemini.model,
      searchProvider: parallel.provider,
      steps: stages.filter((item) => item.stage !== "complete").map((item) => item.stage),
      stages,
      providerCalls: calls,
      usage: gemini.getUsage?.() ?? null,
      elapsedMs: Date.now() - new Date(startedAt).valueOf(),
      costNote: "API method calls and provider token metadata are not an invoice. SDK retries can add attempts. No fixed total spend cap is implied.",
    },
  };
}
