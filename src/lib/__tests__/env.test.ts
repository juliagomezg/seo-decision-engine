import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const VALID_ENV = {
  GROQ_API_KEY: "gsk_test_key",
  API_KEY: "secret-key",
  UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "AXtest",
  NODE_ENV: "production" as const,
};

describe("env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("validates all required vars in production", async () => {
    Object.assign(process.env, VALID_ENV);
    const { validateEnv } = await import("../env");
    const env = validateEnv();
    expect(env.GROQ_API_KEY).toBe("gsk_test_key");
    expect(env.API_KEY).toBe("secret-key");
    expect(env.UPSTASH_REDIS_REST_URL).toBe("https://test.upstash.io");
  });

  it("throws when GROQ_API_KEY is missing in production", async () => {
    Object.assign(process.env, { ...VALID_ENV, GROQ_API_KEY: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow("GROQ_API_KEY");
  });

  it("throws when API_KEY is missing in production", async () => {
    Object.assign(process.env, { ...VALID_ENV, API_KEY: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow("API_KEY");
  });

  it("throws when UPSTASH_REDIS_REST_URL is missing in production", async () => {
    Object.assign(process.env, { ...VALID_ENV, UPSTASH_REDIS_REST_URL: "" });
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow("UPSTASH_REDIS_REST_URL");
  });

  it("allows missing API_KEY and Upstash vars in development", async () => {
    process.env.GROQ_API_KEY = "gsk_dev_key";
    process.env.NODE_ENV = "development";
    delete process.env.API_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { validateEnv } = await import("../env");
    const env = validateEnv();
    expect(env.GROQ_API_KEY).toBe("gsk_dev_key");
    expect(env.API_KEY).toBe("");
  });

  it("applies defaults for optional vars", async () => {
    Object.assign(process.env, VALID_ENV);
    const { validateEnv } = await import("../env");
    const env = validateEnv();
    expect(env.LLM_GENERATION_MODEL).toBe("mixtral-8x7b-32768");
    expect(env.PROMPT_VERSION).toBe("v1.0.0");
    expect(env.DEBUG_MODE).toBe(false);
  });

  it("parses boolean env vars correctly", async () => {
    Object.assign(process.env, { ...VALID_ENV, DEBUG_MODE: "true", TELEMETRY_DEBUG: "1" });
    const { validateEnv } = await import("../env");
    const env = validateEnv();
    expect(env.DEBUG_MODE).toBe(true);
    expect(env.TELEMETRY_DEBUG).toBe(true);
  });
});
