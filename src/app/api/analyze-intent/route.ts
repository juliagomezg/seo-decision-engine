import { NextRequest } from "next/server";
import { KeywordInputSchema, IntentAnalysisSchema } from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[analyze-intent]";
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    // Rate limit early to protect Groq spend
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(ip)) {
      return rateLimited(requestId);
    }

    // Safe body parse
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body", requestId);
    }
    console.log(endpoint, "requestId=", requestId, "Input:", JSON.stringify(body).slice(0, 500));

    // Input validation (throws ZodError → mapErrorToResponse handles it)
    const { keyword, location, business_type } = KeywordInputSchema.parse(body);
    console.log(endpoint, "Validated:", { keyword, location, business_type });

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    // Prompt
    const prompt =
      `You are an SEO intent classification expert.\n\n` +
      `Keyword: ${safeKeyword}\n` +
      `Location: ${safeLocation || "global"}\n` +
      `Business Type: ${business_type || "unspecified"}\n\n` +
      `For each opportunity, identify RISK INDICATORS that could affect content strategy:\n` +
      `- thin_content: Not enough substantive information available\n` +
      `- generic_angle: Angle is too broad or templated\n` +
      `- high_competition: Extremely competitive SERP\n` +
      `- low_volume: Low search volume or too niche\n` +
      `- seasonal_query: Strong seasonal patterns (variable traffic)\n` +
      `- intent_mismatch: Might not match user search intent\n` +
      `- monetization_weak: Limited commercial potential\n` +
      `- eeat_risk: Difficult to establish E-E-A-T (legal, medical, financial)\n\n` +
      `Return ONLY valid JSON with this schema:\n` +
      `{
  "query_classification": "informational | commercial | navigational | transactional",
  "primary_user_goals": ["string"],
  "opportunities": [
    {
      "title": "string",
      "description": "string",
      "confidence": "low | medium | high",
      "user_goals": ["string"],
      "content_attributes_needed": ["string"],
      "rationale": "string",
      "risk_indicators": ["thin_content", "generic_angle", "high_competition", "low_volume", "seasonal_query", "intent_mismatch", "monetization_weak", "eeat_risk"]
    }
  ],
  "metadata": {
    "model": "string",
    "prompt_version": "v1.1.0",
    "timestamp": "ISO-8601"
  }
}
Note: risk_indicators should be an array with 0 or more of the listed values. Use empty array [] if no risks detected.
`;

    // LLM call (1 line replaces ~25 LOC boilerplate)
    const validated = await callLLM({
      prompt,
      schema: IntentAnalysisSchema,
      preset: "classification",
      requestId,
    });

    console.log(endpoint, "Output:", {
      classification: validated.query_classification,
      opportunities: validated.opportunities.length,
    });
    return ok(validated, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
