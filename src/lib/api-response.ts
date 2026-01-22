import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  LLMTimeoutError,
  LLMInvalidJSONError,
  LLMOutputValidationError,
  LLMUpstreamError,
  GroqConfigError,
} from "./llm";

// ─────────────────────────────────────────────────────────────
// Response shapes — standardized across all routes
// ─────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "LLM_INVALID_JSON"
  | "LLM_OUTPUT_VALIDATION"
  | "UPSTREAM_ERROR"
  | "MISSING_GROQ_API_KEY"
  | "INTERNAL_ERROR";

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  requestId?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  code: ApiErrorCode;
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─────────────────────────────────────────────────────────────
// Success helper
// ─────────────────────────────────────────────────────────────

export function ok<T>(data: T, requestId?: string) {
  const body: ApiSuccessResponse<T> = { ok: true, data };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body);
}

// ─────────────────────────────────────────────────────────────
// Error helpers — atomic, single-purpose
// ─────────────────────────────────────────────────────────────

/** 400 — Malformed JSON or unparseable payload */
export function badRequest(message = "Bad request", requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: message,
    code: "BAD_REQUEST",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 400 });
}

/** 400 — Input schema validation failed (client fault) */
export function validationError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 400 });
}

/** 429 — Rate limit exceeded */
export function rateLimited(requestId?: string, retryAfterSeconds?: number) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Too many requests",
    code: "RATE_LIMITED",
  };
  if (requestId) body.requestId = requestId;
  const res = NextResponse.json(body, { status: 429 });
  if (retryAfterSeconds) res.headers.set("Retry-After", String(retryAfterSeconds));
  return res;
}

/** 504 — LLM request timeout */
export function timeoutError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Request timeout",
    code: "TIMEOUT",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 504 });
}

/** 502 — LLM returned invalid JSON */
export function llmInvalidJsonError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "LLM returned invalid JSON",
    code: "LLM_INVALID_JSON",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 502 });
}

/** 502 — LLM output failed schema validation (upstream fault) */
export function llmOutputValidationError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "LLM output validation failed",
    code: "LLM_OUTPUT_VALIDATION",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 502 });
}

/** 502 — Generic upstream/SDK error */
export function upstreamError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Upstream error",
    code: "UPSTREAM_ERROR",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 502 });
}

/** 500 — Missing GROQ_API_KEY */
export function configError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Server misconfigured",
    code: "MISSING_GROQ_API_KEY",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 500 });
}

/** 500 — Catch-all internal error */
export function internalError(requestId?: string) {
  const body: ApiErrorResponse = {
    ok: false,
    error: "Internal error",
    code: "INTERNAL_ERROR",
  };
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, { status: 500 });
}

// ─────────────────────────────────────────────────────────────
// Optional: minimal error mapper (keeps instanceof logic in one place)
// ─────────────────────────────────────────────────────────────

export interface ErrorContext {
  endpoint: string;
  requestId?: string;
}

/**
 * Maps known error types to appropriate HTTP responses.
 * Use in catch blocks: `return mapErrorToResponse(err, { endpoint: '[route]' })`
 */
export function mapErrorToResponse(err: unknown, ctx: ErrorContext) {
  const { endpoint, requestId } = ctx;
  console.error(endpoint, "Error:", err);

  if (err instanceof LLMTimeoutError) {
    return timeoutError(requestId);
  }
  if (err instanceof LLMInvalidJSONError) {
    return llmInvalidJsonError(requestId);
  }
  if (err instanceof LLMOutputValidationError) {
    return llmOutputValidationError(requestId);
  }
  if (err instanceof LLMUpstreamError) {
    return upstreamError(requestId);
  }
  if (err instanceof ZodError) {
    // Input validation error (client fault)
    return validationError(requestId);
  }
  if (err instanceof GroqConfigError) {
    return configError(requestId);
  }

  return internalError(requestId);
}
