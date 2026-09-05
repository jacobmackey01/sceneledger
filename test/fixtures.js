export const request = {
  title: "Cinema research", productionType: "documentary", audience: "UK audience",
  brief: "Establish whether cinema attendance recovered and identify the remaining evidence gaps.",
};
export const sources = [{ id: "s1", title: "Attendance report", url: "https://example.com/report", excerpts: ["Attendance fell by 2 percent. Revenue rose."], queryId: "q1" }];
export function synthesis(evidence = [{ sourceId: "s1", excerpt: "Attendance fell by 2 percent." }], status = "supported") {
  return {
    headline: "Attendance fell", summary: "The source reports a fall in attendance.",
    claims: [{ claim: "Attendance fell by 2 percent.", status, confidence: "high", evidence, productionUse: "Use with attribution." }],
    risks: [], openQuestions: [],
  };
}
export function providers() {
  return {
    gemini: {
      model: "test-model",
      async plan() { return { researchQuestions: [{ id: "q1" }, { id: "q2" }] }; },
      async synthesize() { return synthesis(); },
    },
    parallel: { provider: "Test search", async search() { return sources; } },
  };
}
