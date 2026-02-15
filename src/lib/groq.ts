import "server-only";
import Groq from "groq-sdk";

/**
 * Singleton Groq client — reuses connection across requests.
 */
export type GroqClient = Groq;

let _client: GroqClient | null = null;

/**
 * Typed error for missing configuration.
 */
export class GroqConfigError extends Error {
  readonly code = "MISSING_GROQ_API_KEY" as const;
  constructor(message = "GROQ_API_KEY is not set") {
    super(message);
    this.name = "GroqConfigError";
  }
}

/**
 * Returns singleton Groq client.
 * @throws {GroqConfigError} if GROQ_API_KEY is not set
 */
export function getGroqClient(): GroqClient {
  if (_client) return _client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqConfigError();
  _client = new Groq({ apiKey });
  return _client;
}

/** Canonical model — single place to update */
export const GROQ_MODEL = "mixtral-8x7b-32768" as const;

/** Default timeout for LLM calls (ms) */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Presets by use case — temperature + maxTokens tuned for each pipeline stage.
 */
export const LLM_PRESETS = {
  /** Intent classification — deterministic */
  classification: { temperature: 0.35, maxTokens: 2000 },
  /** Template generation — diverse options */
  generation: { temperature: 0.4, maxTokens: 4000 },
  /** Content creation — natural language (8K for enriched AEO+GEO output) */
  creative: { temperature: 0.5, maxTokens: 8000 },
  /** Approval gates — strict validation */
  validation: { temperature: 0.2, maxTokens: 1200 },
} as const;

export type LLMPreset = keyof typeof LLM_PRESETS;
