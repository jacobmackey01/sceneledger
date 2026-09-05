import { z } from "zod";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const envSchema = z.object({
  GOOGLE_CLOUD_PROJECT: z.preprocess((value) => value || undefined, z.string().min(1).optional()),
  GOOGLE_CLOUD_LOCATION: z.string().min(1).default("global"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.8-flash"),
  PARALLEL_API_KEY: z.preprocess((value) => value || undefined, z.string().min(1).optional()),
  PORT: z.coerce.number().int().positive().default(8080),
});

export function loadConfig(env = process.env) {
  const config = envSchema.parse(env);
  return {
    ...config,
    ready: Boolean(config.GOOGLE_CLOUD_PROJECT && config.PARALLEL_API_KEY),
  };
}
