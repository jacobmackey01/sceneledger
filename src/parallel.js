import Parallel from "parallel-web";

export function createParallelService(config) {
  const client = new Parallel({ apiKey: config.PARALLEL_API_KEY });

  return {
    provider: "Parallel Search API",
    async search(question) {
      const response = await client.search({
        objective: `${question.reason}. Find direct evidence for: ${question.label}`,
        search_queries: [question.query],
        mode: "fast",
        client_model: config.GEMINI_MODEL,
        advanced_settings: { max_results: 6 },
      });

      return (response.results || []).map((result) => ({
        title: result.title || result.url,
        url: result.url,
        publishDate: result.publish_date || null,
        excerpts: (result.excerpts || []).slice(0, 3),
        queryId: question.id,
      }));
    },
  };
}
