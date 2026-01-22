import { ZodSchema, ZodError } from "zod";
import {
  getGroqClient,
  GROQ_MODEL,
  LLM_PRESETS,
  LLMPreset,
  GroqConfigError,
  DEFAULT_TIMEOUT_MS,
} from "./groq";

// ─────────────────────────────────────────────────────────────
// Typed errors — each maps to a specific HTTP status
// ─────────────────────────────────────────────────────────────

/** 504 Gateway Timeout */
export class LLMTimeoutError extends Error {
  readonly code = "TIMEOUT" as const;
  constructor(message = "Request timeout") {
    super(message);
    this.name = "LLMTimeoutError";
  }
}

/** 502 Bad Gateway — LLM returned unparseable JSON */
export class LLMInvalidJSONError extends Error {
  readonly code = "LLM_INVALID_JSON" as const;
  constructor(message = "LLM returned invalid JSON") {
    super(message);
    this.name = "LLMInvalidJSONError";
  }
}

/** 502 Bad Gateway — LLM output failed schema validation (upstream fault, not client) */
export class LLMOutputValidationError extends Error {
  readonly code = "LLM_OUTPUT_VALIDATION" as const;
  /** Non-enumerable to prevent log serialization bloat */
  declare readonly issues: ZodError["issues"];
  constructor(zodError: ZodError) {
    super("LLM output failed schema validation");
    this.name = "LLMOutputValidationError";
    // Non-enumerable: won't appear in JSON.stringify or object spread
    Object.defineProperty(this, "issues", {
      value: zodError.issues,
      enumerable: false,
      writable: false,
    });
  }
}

/** 502 Bad Gateway — Generic upstream/SDK error from Groq */
export class LLMUpstreamError extends Error {
  readonly code = "UPSTREAM_ERROR" as const;
  constructor(message = "Upstream error") {
    super(message);
    this.name = "LLMUpstreamError";
  }
}

// Re-export for convenience
export { GroqConfigError };

// ─────────────────────────────────────────────────────────────
// callLLM options & implementation
// ─────────────────────────────────────────────────────────────

export interface CallLLMOptions<T> {
  prompt: string;
  schema: ZodSchema<T>;
  preset?: LLMPreset;
  timeoutMs?: number;
  /** Enable JSON mode (response_format: json_object). Default: true */
  jsonMode?: boolean;
  /** For observability — passed through for logging */
  requestId?: string;
}

// ─────────────────────────────────────────────────────────────
// Optional observability hooks (P3) — no route changes required
// ─────────────────────────────────────────────────────────────

export type LLMEvent =
  | { type: "llm.success"; preset: LLMPreset; latencyMs: number; requestId?: string }
  | { type: "llm.error"; preset: LLMPreset; latencyMs: number; requestId?: string; code: string };

let _onLLMEvent: ((e: LLMEvent) => void) | undefined;

/** Register a handler for LLM events (success/error with timing) */
export function setLLMEventHandler(handler?: (e: LLMEvent) => void) {
  _onLLMEvent = handler;
}

/**
 * Unified LLM call wrapper with timeout, JSON parsing, and schema validation.
 *
 * @throws {GroqConfigError} GROQ_API_KEY missing (500)
 * @throws {LLMTimeoutError} Request exceeded timeout (504)
 * @throws {LLMInvalidJSONError} LLM returned unparseable JSON (502)
 * @throws {LLMOutputValidationError} LLM output failed schema validation (502)
 */
export async function callLLM<T>(opts: CallLLMOptions<T>): Promise<T> {
  const {
    prompt,
    schema,
    preset = "classification",
    timeoutMs = DEFAULT_TIMEOUT_MS,
    jsonMode = true,
    requestId,
  } = opts;

  const { temperature, maxTokens } = LLM_PRESETS[preset];
  const groq = getGroqClient(); // throws GroqConfigError

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const completion = await groq.chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature,
        top_p: 0.9,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: "json_object" as const } }),
      },
      { signal: controller.signal }
    );

    // Parse JSON (guard against empty/malformed Groq payload)
    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new LLMInvalidJSONError("Empty LLM response");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new LLMInvalidJSONError();
    }

    // Validate output schema — wrap ZodError as upstream error
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new LLMOutputValidationError(result.error);
    }

    _onLLMEvent?.({
      type: "llm.success",
      preset,
      latencyMs: Date.now() - start,
      requestId,
    });
    return result.data;
  } catch (err) {
    // Convert AbortError to typed timeout error
    if (err instanceof Error && err.name === "AbortError") {
      const e = new LLMTimeoutError();
      _onLLMEvent?.({ type: "llm.error", preset, latencyMs: Date.now() - start, requestId, code: e.code });
      throw e;
    }
    // Pass through our typed errors/config errors unchanged
    if (
      err instanceof GroqConfigError ||
      err instanceof LLMInvalidJSONError ||
      err instanceof LLMOutputValidationError ||
      err instanceof LLMTimeoutError ||
      err instanceof LLMUpstreamError
    ) {
      const code = (err as { code?: string }).code ?? "INTERNAL_ERROR";
      _onLLMEvent?.({ type: "llm.error", preset, latencyMs: Date.now() - start, requestId, code });
      throw err;
    }

    // Wrap unknown SDK/network/etc errors as upstream (prevents INTERNAL_ERROR for Groq faults)
    if (err instanceof Error) {
      const e = new LLMUpstreamError(err.message);
      _onLLMEvent?.({ type: "llm.error", preset, latencyMs: Date.now() - start, requestId, code: e.code });
      throw e;
    }
    const e = new LLMUpstreamError();
    _onLLMEvent?.({ type: "llm.error", preset, latencyMs: Date.now() - start, requestId, code: e.code });
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
