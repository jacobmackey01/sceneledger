import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { researchRequestSchema } from "./schema.js";
import { createGeminiService } from "./gemini.js";
import { createParallelService } from "./parallel.js";
import { runResearchWorkflow } from "./workflow.js";
import { createRequestGuard } from "./guard.js";

const config = loadConfig();
const app = express();
const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(directory, "../public");
const researchGuard = createRequestGuard();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
app.use(express.static(publicDirectory, { extensions: ["html"] }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: config.ready ? "ready" : "configuration-required",
    model: config.GEMINI_MODEL,
    googleCloudProjectConfigured: Boolean(config.GOOGLE_CLOUD_PROJECT),
    parallelConfigured: Boolean(config.PARALLEL_API_KEY),
  });
});

app.post("/api/research", async (request, response) => {
  if (!config.ready) {
    return response.status(503).json({
      error: "Runtime configuration is incomplete.",
      detail: "GOOGLE_CLOUD_PROJECT and PARALLEL_API_KEY are required.",
    });
  }

  const parsed = researchRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({
      error: "Please check the production brief.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const admission = researchGuard.tryEnter(request.ip || "unknown");
  if (!admission.ok) {
    response.set("Retry-After", String(admission.retryAfterSeconds));
    return response.status(admission.status).json({
      error: admission.status === 429 ? "Research limit reached." : "The research desk is busy.",
      detail: admission.status === 429
        ? "This public demo allows three research runs per visitor every 15 minutes."
        : "Two research runs are already active. Please retry shortly.",
    });
  }

  try {
    const result = await runResearchWorkflow({
      request: parsed.data,
      gemini: createGeminiService(config),
      parallel: createParallelService(config),
    });
    return response.json(result);
  } catch (error) {
    console.error("research_workflow_failed", error);
    return response.status(502).json({
      error: "The research run did not complete.",
      detail: error instanceof Error ? error.message : "Unknown service error",
    });
  } finally {
    admission.release();
  }
});

app.get("*splat", (_request, response) => response.sendFile(path.join(publicDirectory, "index.html")));

if (process.env.NODE_ENV !== "test") {
  app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`SceneLedger listening on http://localhost:${config.PORT}`);
  });
}

export { app };
