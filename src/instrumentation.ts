/**
 * Next.js instrumentation hook — runs once at server startup.
 * Validates all required environment variables and fails fast.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only validate on the server (not edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
