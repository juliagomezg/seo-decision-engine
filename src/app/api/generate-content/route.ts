import { NextRequest } from "next/server";
import { ContentRequestSchema, ContentDraftSchema } from "@/types/schemas";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[generate-content]";
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
    log("debug", endpoint, "requestId=", requestId, "Input:", JSON.stringify(body).slice(0, 500));

    // Input validation
    const parsed = ContentRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const location = parsed.location;
    const businessType = parsed.business_type;
    const selectedTemplate = parsed.selected_template ?? parsed.selectedTemplate;

    log("debug", endpoint, "Validated:", { keyword, template: selectedTemplate?.name });

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    // Build section instructions from template
    const sectionInstructions =
      selectedTemplate?.sections
        ?.map(
          (s, i) =>
            `${i + 1}. ${s.heading_level.toUpperCase()}: "${s.heading_text}" (${s.content_type}) - ${s.rationale}`
        )
        .join("\n") || "";

    const faqInstructions =
      selectedTemplate?.faqs
        ?.map((f, i) => `${i + 1}. Q: "${f.question}" - Guidance: ${f.answer_guidance}`)
        .join("\n") || "";

    // Build prompt
    const prompt = `You are an expert SEO content writer.

Generate complete, high-quality content following the template structure below.

Keyword: ${safeKeyword}
Location: ${safeLocation || "global"}
Business Type: ${businessType || "unspecified"}

Template: ${selectedTemplate?.name}
H1: ${selectedTemplate?.h1}

Sections to write:
${sectionInstructions}

FAQs to answer:
${faqInstructions}

CTA: "${selectedTemplate?.cta_suggestion?.text}" (position: ${selectedTemplate?.cta_suggestion?.position})

Return ONLY valid JSON with this schema:
{
  "title": "string (SEO page title, 50-60 chars)",
  "slug": "string (lowercase-with-hyphens)",
  "h1": "string (main heading)",
  "meta_description": "string (50-160 chars, compelling)",
  "sections": [
    {
      "heading_level": "h2" or "h3",
      "heading_text": "string",
      "content": "string (substantive paragraph, 50+ chars minimum)"
    }
  ],
  "faqs": [
    {
      "question": "string",
      "answer": "string (helpful answer, 20+ chars)"
    }
  ],
  "cta": {
    "text": "string",
    "position": "top" | "middle" | "bottom"
  },
  "metadata": {
    "model": "string",
    "prompt_version": "v1.0.0",
    "timestamp": "ISO-8601",
    "word_count": number
  }
}

Requirements:
- Write substantive, helpful content for each section (not placeholder text)
- Match the template structure exactly
- Include all FAQs with complete answers
- Calculate accurate word_count
- Content should be SEO-optimized but natural and helpful`;

    // LLM call
    const validated = await callLLM({
      prompt,
      schema: ContentDraftSchema,
      preset: "creative",
      requestId,
    });

    log("debug", endpoint, "Output:", {
      title: validated.title,
      wordCount: validated.metadata.word_count,
    });
    return ok(validated, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
