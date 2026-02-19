import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

describe("API key middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createRequest(apiKey?: string): NextRequest {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-api-key"] = apiKey;
    return new NextRequest("http://localhost:3000/api/analyze-intent", {
      method: "POST",
      headers,
    });
  }

  it("skips auth in development", async () => {
    process.env.NODE_ENV = "development";
    const { middleware } = await import("../middleware");
    const res = middleware(createRequest());
    expect(res.status).toBe(200);
  });

  it("returns 401 when X-API-Key is missing in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.API_KEY = "secret";
    const { middleware } = await import("../middleware");
    const res = middleware(createRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when X-API-Key is wrong in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.API_KEY = "secret";
    const { middleware } = await import("../middleware");
    const res = middleware(createRequest("wrong-key"));
    expect(res.status).toBe(401);
  });

  it("passes when X-API-Key matches in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.API_KEY = "secret";
    const { middleware } = await import("../middleware");
    const res = middleware(createRequest("secret"));
    expect(res.status).toBe(200);
  });

  it("returns 500 when API_KEY env var is missing in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.API_KEY;
    const { middleware } = await import("../middleware");
    const res = middleware(createRequest("anything"));
    expect(res.status).toBe(500);
  });
});
