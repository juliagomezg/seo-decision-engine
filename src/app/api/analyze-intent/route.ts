import { NextRequest } from "next/server";
import { KeywordInputSchema, IntentAnalysisSchema } from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const endpoint = "[analyze-intent]";

  try {
    // Rate limit early to protect Groq spend
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(ip)) {
      return rateLimited();
    }

    // Safe body parse
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    console.log(endpoint, "Input:", JSON.stringify(body));

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
      "rationale": "string"
    }
  ],
  "metadata": {
    "model": "string",
    "prompt_version": "v1.0.0",
    "timestamp": "ISO-8601"
  }
}
`;

    // LLM call (1 line replaces ~25 LOC boilerplate)
    const validated = await callLLM({
      prompt,
      schema: IntentAnalysisSchema,
      preset: "classification",
    });

    console.log(endpoint, "Output:", {
      classification: validated.query_classification,
      opportunities: validated.opportunities.length,
    });
    return ok(validated);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint });
  }
}
