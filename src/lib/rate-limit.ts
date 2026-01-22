/**
 * Simple in-memory rate limiting using LRU cache pattern.
 * For production, consider using Redis or a distributed cache.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

// Configuration
const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000; // 1 minute
const MAX_ENTRIES = 500;

/**
 * Clean up expired entries from the cache.
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt <= now) {
      cache.delete(key);
    }
  }
}

/**
 * Enforce max cache size by removing oldest entries.
 */
function enforceMaxSize(): void {
  if (cache.size <= MAX_ENTRIES) return;

  // Remove oldest entries (first inserted)
  const toRemove = cache.size - MAX_ENTRIES;
  const keys = cache.keys();
  for (let i = 0; i < toRemove; i++) {
    const key = keys.next().value;
    if (key) cache.delete(key);
  }
}

/**
 * Check if a request from the given IP is allowed.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup
  if (Math.random() < 0.1) {
    cleanupExpired();
    enforceMaxSize();
  }

  const entry = cache.get(ip);

  if (!entry || entry.resetAt <= now) {
    // New window
    cache.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get rate limit info for headers.
 */
export function getRateLimitInfo(ip: string): {
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = cache.get(ip);

  if (!entry || entry.resetAt <= now) {
    return {
      remaining: MAX_REQUESTS,
      resetAt: now + WINDOW_MS,
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
