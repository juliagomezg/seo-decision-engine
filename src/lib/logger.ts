import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Logs only when:
 * - not production OR
 * - TELEMETRY_DEBUG=1
 *
 * This keeps tests and production cleaner.
 */
export function shouldLog() {
    return process.env.NODE_ENV !== "production" || process.env.TELEMETRY_DEBUG === "1";
}

export function log(level: LogLevel, ...args: unknown[]) {
    if (!shouldLog()) return;

    // Use the appropriate console method
    if (level === "error") console.error(...args);
    else if (level === "warn") console.warn(...args);
    else console.log(...args);
}
