import "server-only";
import { setLLMEventHandler } from "@/lib/llm";
import { setApiErrorHandler } from "@/lib/api-response";

let _installed = false;

/**
 * Install telemetry handlers for LLM and API events.
 * Safe to call multiple times (idempotent).
 *
 * Currently logs to console; replace with your metrics/tracing provider.
 */
export function installTelemetry() {
  if (_installed) return;
  _installed = true;

  setLLMEventHandler((e) => {
    // Replace with your metrics/logging provider (e.g., OpenTelemetry, Datadog, etc.)
    if (e.type === "llm.success") {
      console.log("[telemetry]", e.type, {
        preset: e.preset,
        latencyMs: e.latencyMs,
        requestId: e.requestId,
      });
    } else {
      console.log("[telemetry]", e.type, {
        preset: e.preset,
        latencyMs: e.latencyMs,
        code: e.code,
        requestId: e.requestId,
      });
    }
  });

  setApiErrorHandler((e) => {
    console.log("[telemetry]", e.type, {
      code: e.code,
      endpoint: e.endpoint,
      requestId: e.requestId,
    });
  });
}
