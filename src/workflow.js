import { enforceEvidence, normalizeSources } from "./evidence.js";

export async function runResearchWorkflow({ request, gemini, parallel, onProgress = () => {} }) {
  const startedAt = new Date().toISOString();
  const stages = [];
  const progress = (stage) => {
    const event = { stage, at: new Date().toISOString() };
    stages.push(event);
    onProgress(event);
  };
  progress("plan");
  const plan = await gemini.plan(request);

  progress("parallel-search");
  const searchGroups = await Promise.all(
    plan.researchQuestions.map((question) => parallel.search(question)),
  );
  const sources = normalizeSources(searchGroups, request.cutoffDate);
  if (sources.length === 0) {
    throw new Error("Parallel Search returned no sources within the requested cutoff");
  }

  progress("synthesize");
  const synthesis = await gemini.synthesize(request, plan.researchQuestions, sources);
  progress("citation-audit");
  const checked = enforceEvidence(synthesis, sources);
  progress("complete");

  return {
    ...checked,
    sources,
    workflow: {
      startedAt,
      completedAt: new Date().toISOString(),
      planner: gemini.model,
      searchProvider: parallel.provider,
      steps: ["plan", "parallel-search", "synthesize", "citation-audit"],
      stages,
    },
  };
}
