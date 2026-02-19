import "server-only";
import { z } from "zod";

/**
 * Environment variable schema — single source of truth.
 * Required vars throw at startup in production; optional vars have defaults.
 */

const booleanString = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const envSchema = z.object({
  // Required
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),

  // Required in production (auth + rate limiting)
  API_KEY: z.string().min(1, "API_KEY is required for production auth"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

  // Optional
  LLM_GENERATION_MODEL: z.string().optional().default("mixtral-8x7b-32768"),
  PROMPT_VERSION: z.string().optional().default("v1.0.0"),
  DEBUG_MODE: booleanString,
  TELEMETRY_DEBUG: booleanString,
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

/**
 * In development, API_KEY and Upstash vars are optional.
 * In production, all vars are required.
 */
const devSchema = envSchema.extend({
  API_KEY: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and return typed environment variables.
 * Throws with descriptive message if required vars are missing.
 */
export function validateEnv(): Env {
  const isProd = process.env.NODE_ENV === "production";
  const schema = isProd ? envSchema : devSchema;

  const result = schema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Environment validation failed:\n${missing}\n\nSee .env.example for required variables.`
    );
  }

  return result.data;
}

/**
 * Cached env — call validateEnv() once, reuse everywhere.
 * Lazy so instrumentation.ts can call validateEnv() first for fail-fast.
 */
let _env: Env | null = null;

export function env(): Env {
  if (!_env) _env = validateEnv();
  return _env;
}
