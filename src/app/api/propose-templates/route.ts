import { NextRequest } from "next/server";
import { TemplateRequestSchema, TemplateProposalSchema } from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[propose-templates]";
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
    const parsed = TemplateRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const location = parsed.location;
    const businessType = parsed.business_type;
    const selectedOpportunity = parsed.selected_opportunity ?? parsed.selectedOpportunity;

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    log("debug", endpoint, "Validated:", { keyword, opportunity: selectedOpportunity?.title });

    // Build prompt
    const prompt = `You are an SEO content strategist.

Based on the following context, propose 2-3 content template structures optimized for this opportunity.

Keyword: ${safeKeyword}
Location: ${safeLocation || "global"}
Business Type: ${businessType || "unspecified"}

Selected Opportunity:
- Title: ${selectedOpportunity?.title}
- Description: ${selectedOpportunity?.description}
- User Goals: ${selectedOpportunity?.user_goals?.join(", ")}
- Content Attributes Needed: ${selectedOpportunity?.content_attributes_needed?.join(", ")}

Return ONLY valid JSON with this schema:
{
  "templates": [
    {
      "name": "string (template name)",
      "slug": "string (lowercase-with-hyphens)",
      "title": "string (page title)",
      "h1": "string (main heading)",
      "sections": [
        {
          "heading_level": "h2" or "h3",
          "heading_text": "string",
          "content_type": "text" | "list" | "table" | "comparison" | "faq",
          "rationale": "string (why this section is needed)"
        }
      ],
      "faqs": [
        {
          "question": "string",
          "answer_guidance": "string (guidance for answering)"
        }
      ],
      "cta_suggestion": {
        "text": "string",
        "position": "top" | "middle" | "bottom"
      },
      "internal_link_suggestions": ["string"],
      "schema_org_types": ["string"],
      "rationale": "string (why this template structure works)",
      "aeo_strategy": {
        "snippet_type": "string (paragraph | list | table — best format for featured snippets)",
        "voice_questions": ["string (2-5 natural voice search questions this template should answer)"],
        "answer_unit_count": number (5-15, recommended citable answer units)
      },
      "geo_strategy": {
        "schema_types": ["string (schema.org types to generate, e.g., FAQPage, LocalBusiness)"],
        "chunking_strategy": "string (how sections should be chunked for AI retrieval)",
        "evidence_density": "low | medium | high (how much verifiable evidence to include)"
      }
    }
  ],
  "metadata": {
    "model": "string",
    "prompt_version": "v1.1.0",
    "timestamp": "ISO-8601"
  }
}

Requirements:
- Provide 2-3 distinct template options
- Each template must have at least 3 sections and at least 3 FAQs
- Sections should address the user goals and content attributes
- Make rationales specific to the keyword and opportunity
- Include aeo_strategy with voice search questions and snippet format recommendation
- Include geo_strategy with schema.org types and evidence density level
- voice_questions should be natural queries a user would ask a voice assistant`;

    // LLM call
    const validated = await callLLM({
      prompt,
      schema: TemplateProposalSchema,
      preset: "generation",
      requestId,
    });

    log("debug", endpoint, "Output:", { templateCount: validated.templates.length });
    return ok(validated, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
