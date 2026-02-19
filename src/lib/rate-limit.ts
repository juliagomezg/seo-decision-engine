import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const MAX_REQUESTS = 10;
const WINDOW_SECONDS = 60; // 1 minute
const WINDOW_MS = WINDOW_SECONDS * 1000;

// ─────────────────────────────────────────────────────────────
// Upstash Redis rate limiter (production)
// ─────────────────────────────────────────────────────────────

function createUpstashLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SECONDS} s`),
    prefix: "seo-engine:ratelimit",
  });
}

let _upstash: Ratelimit | null | undefined;

function getUpstashLimiter(): Ratelimit | null {
  if (_upstash === undefined) _upstash = createUpstashLimiter();
  return _upstash;
}

// ─────────────────────────────────────────────────────────────
// In-memory fallback (development / missing Redis config)
// ─────────────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, MemoryEntry>();
const MAX_ENTRIES = 500;

function memoryCheck(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  // Periodic cleanup
  if (Math.random() < 0.1) {
    for (const [key, entry] of cache.entries()) {
      if (entry.resetAt <= now) cache.delete(key);
    }
    if (cache.size > MAX_ENTRIES) {
      const toRemove = cache.size - MAX_ENTRIES;
      const keys = cache.keys();
      for (let i = 0; i < toRemove; i++) {
        const key = keys.next().value;
        if (key) cache.delete(key);
      }
    }
  }

  const entry = cache.get(ip);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    cache.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─────────────────────────────────────────────────────────────
// Public API — same interface as before
// ─────────────────────────────────────────────────────────────

/**
 * Check if a request from the given IP is allowed.
 * Uses Upstash Redis when configured, falls back to in-memory.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    const { success } = await upstash.limit(ip);
    return success;
  }
  return memoryCheck(ip).allowed;
}

/**
 * Get rate limit info for response headers.
 */
export async function getRateLimitInfo(ip: string): Promise<{
  remaining: number;
  resetAt: number;
}> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    const result = await upstash.limit(ip);
    return {
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }
  const mem = memoryCheck(ip);
  return { remaining: mem.remaining, resetAt: mem.resetAt };
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
