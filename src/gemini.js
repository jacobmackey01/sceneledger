import { GoogleGenAI } from "@google/genai";
import { planSchema, synthesisSchema } from "./schema.js";
import { planningPrompt, synthesisPrompt } from "./prompts.js";

function parseJsonResponse(text, schema, stage) {
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    throw new Error(`Gemini returned invalid ${stage} JSON`, { cause: error });
  }
}

export function createGeminiService(config) {
  const client = new GoogleGenAI({
    vertexai: true,
    project: config.GOOGLE_CLOUD_PROJECT,
    location: config.GOOGLE_CLOUD_LOCATION,
  });

  async function generate(contents) {
    const response = await client.models.generateContent({
      model: config.GEMINI_MODEL,
      contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: "LOW" },
      },
    });
    if (!response.text) throw new Error("Gemini returned an empty response");
    return response.text;
  }

  return {
    model: config.GEMINI_MODEL,
    async plan(request) {
      return parseJsonResponse(await generate(planningPrompt(request)), planSchema, "planning");
    },
    async synthesize(request, questions, sources) {
      return parseJsonResponse(
        await generate(synthesisPrompt(request, questions, sources)),
        synthesisSchema,
        "synthesis",
      );
    },
  };
}
