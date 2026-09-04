import { enforceEvidence, normalizeSources } from "./evidence.js";

export async function runResearchWorkflow({ request, gemini, parallel }) {
  const startedAt = new Date().toISOString();
  const plan = await gemini.plan(request);

  const searchGroups = await Promise.all(
    plan.researchQuestions.map((question) => parallel.search(question)),
  );
  const sources = normalizeSources(searchGroups, request.cutoffDate);
  if (sources.length === 0) {
    throw new Error("Parallel Search returned no sources within the requested cutoff");
  }

  const synthesis = await gemini.synthesize(request, plan.researchQuestions, sources);
  const checked = enforceEvidence(synthesis, sources);

  return {
    ...checked,
    sources,
    workflow: {
      startedAt,
      completedAt: new Date().toISOString(),
      planner: gemini.model,
      searchProvider: parallel.provider,
      steps: ["plan", "parallel-search", "synthesize", "citation-audit"],
    },
  };
}
