import { z } from "zod";

const envSchema = z.object({
  GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
  GOOGLE_CLOUD_LOCATION: z.string().min(1).default("global"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.8-flash"),
  PARALLEL_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(8080),
});

export function loadConfig(env = process.env) {
  const config = envSchema.parse(env);
  return {
    ...config,
    ready: Boolean(config.GOOGLE_CLOUD_PROJECT && config.PARALLEL_API_KEY),
  };
}
