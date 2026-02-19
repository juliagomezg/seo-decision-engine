import { NextRequest } from "next/server";
import {
  ContentRequestSchema,
  ContentDraftSchema,
  EnhancedContentDraftSchema,
  EntityProfileSchema,
} from "@/types/schemas";
import type { EntityProfile } from "@/types/schemas";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";
import { log } from "@/lib/logger";
import { buildAllJsonLd } from "@/lib/jsonld";

function buildEntityContext(entity: EntityProfile): string {
  const lines: string[] = [
    `\nENTITY PROFILE (verified business data — use ONLY these facts, do NOT invent):`,
    `Business Name: ${entity.business_name}`,
    `Phone: ${entity.phone}`,
    `Address: ${entity.address.street}, ${entity.address.city}, ${entity.address.state} ${entity.address.postal_code}, ${entity.address.country}`,
  ];

  if (entity.business_type_detail) {
    lines.push(`Business Detail: ${entity.business_type_detail}`);
  }
  if (entity.email) lines.push(`Email: ${entity.email}`);
  if (entity.website) lines.push(`Website: ${entity.website}`);

  lines.push(`Service Area: ${entity.service_area.join(", ")}`);

  // Hours
  const openDays = entity.hours.filter((h) => !h.closed);
  if (openDays.length > 0) {
    lines.push(`Hours: ${openDays.map((h) => `${h.day}: ${h.open}-${h.close}`).join(", ")}`);
  }

  // Services
  lines.push(`\nServices:`);
  entity.services.forEach((s, i) => {
    let sLine = `  ${i + 1}. ${s.name}: ${s.description}`;
    if (s.price_range) sLine += ` | Price: ${s.price_range}`;
    if (s.duration) sLine += ` | Duration: ${s.duration}`;
    if (s.availability) sLine += ` | Availability: ${s.availability}`;
    if (s.custom_attributes && Object.keys(s.custom_attributes).length > 0) {
      sLine += ` | ${Object.entries(s.custom_attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}`;
    }
    lines.push(sLine);
  });

  // E-E-A-T signals
  if (entity.founding_year) lines.push(`Founded: ${entity.founding_year}`);
  if (entity.certifications?.length) lines.push(`Certifications: ${entity.certifications.join(", ")}`);
  if (entity.awards?.length) lines.push(`Awards: ${entity.awards.join(", ")}`);
  if (entity.team_size) lines.push(`Team: ${entity.team_size}`);
  if (entity.team_highlights?.length) lines.push(`Team Highlights: ${entity.team_highlights.join(", ")}`);

  // Social proof
  if (entity.average_rating) lines.push(`Rating: ${entity.average_rating}/5`);
  if (entity.review_count) lines.push(`Reviews: ${entity.review_count}`);
  if (entity.review_platforms?.length) lines.push(`Review Platforms: ${entity.review_platforms.join(", ")}`);

  // Custom attributes
  if (entity.custom_attributes && Object.keys(entity.custom_attributes).length > 0) {
    lines.push(`\nAdditional Attributes:`);
    Object.entries(entity.custom_attributes).forEach(([k, v]) => {
      lines.push(`  ${k}: ${v}`);
    });
  }

  return lines.join("\n");
}

const ENHANCED_SCHEMA_INSTRUCTIONS = `
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
      "content": "string (substantive paragraph, 50+ chars minimum)",
      "chunk_id": "string (lowercase-with-hyphens, unique identifier for this section)",
      "is_self_contained": boolean (true if section makes sense without reading other sections),
      "word_count": number (actual word count of content field),
      "topic_tags": ["string"] (1-5 tags describing section topic)
    }
  ],
  "faqs": [
    {
      "question": "string",
      "answer": "string (helpful answer, 20+ chars)"
    }
  ],
  "citable_answer_units": [
    {
      "question": "string (natural voice search question, 10-200 chars)",
      "answer": "string (direct answer, 150-350 chars, 40-80 words — start with a statement, not 'Bueno...' or 'Depende...')",
      "answer_word_count": number (actual word count, must be 40-80),
      "topic_tag": "string (1-50 chars)",
      "evidence_type": "factual" | "descriptive" | "comparative" | "procedural",
      "source_field": "string (optional, reference to entity_profile field used)"
    }
  ],
  "evidence_layer": {
    "claims": [
      {
        "claim_text": "string (10+ chars, the specific claim made)",
        "claim_type": "entity_fact" | "general_knowledge" | "statistical" | "testimonial" | "procedural",
        "source": "string (where this claim comes from — entity_profile.field or 'general knowledge')",
        "verifiable": boolean (true if can be checked against entity_profile or public data),
        "section_index": number (0-based index of the section containing this claim)
      }
    ],
    "total_claims": number,
    "verifiable_count": number,
    "verifiable_ratio": number (0-1, target >= 0.6)
  },
  "entity_card": {
    "business_name": "string",
    "address_formatted": "string (full formatted address)",
    "phone": "string",
    "services_highlighted": ["string"] (1-5 top services),
    "hours_summary": "string (e.g., 'Lun-Vie 8:00-15:00')",
    "rating_summary": "string (optional, e.g., '4.8/5 (120 reseñas en Google)')"
  },
  "cta": {
    "text": "string",
    "position": "top" | "middle" | "bottom"
  },
  "metadata": {
    "model": "string",
    "prompt_version": "v2.0.0",
    "timestamp": "ISO-8601",
    "word_count": number
  }
}`;

const ENHANCED_REQUIREMENTS = `
Requirements:
- Write substantive, helpful content for each section (not placeholder text)
- Match the template structure exactly
- Include all FAQs with complete answers
- Calculate accurate word_count for metadata and each section
- Content should be SEO-optimized but natural and helpful
- Each section must have a unique chunk_id (lowercase-with-hyphens)
- Sections should be self-contained when possible (is_self_contained: true)
- Generate 5-15 citable_answer_units, each with 40-80 words (150-350 chars)
- Answer units must start with a direct statement (never "Bueno...", "Depende...", "En general...")
- Answer unit questions should be natural voice search queries mentioning business name and location
- Use entity_fact claims ONLY for data present in the ENTITY PROFILE above
- Evidence layer must have verifiable_ratio >= 0.6
- Entity card must use EXACT data from entity profile (never invent NAP data)
- Mention business name, location, certifications, and founding year naturally in content
- Use E-E-A-T signals (certifications, awards, experience) when available`;

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[generate-content]";
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    // Rate limit early to protect Groq spend
    const ip = getClientIp(req.headers);
    if (!(await checkRateLimit(ip))) {
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

    // Parse entity_profile if present
    const entityProfile = parsed.entity_profile
      ? EntityProfileSchema.parse(parsed.entity_profile)
      : null;

    const isEnhanced = !!entityProfile;

    log("debug", endpoint, "Validated:", {
      keyword,
      template: selectedTemplate?.name,
      enhanced: isEnhanced,
    });

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

    // Build prompt — enhanced or standard
    let prompt: string;

    if (isEnhanced) {
      const entityContext = buildEntityContext(entityProfile);

      prompt = `You are an expert SEO content writer specializing in local business content optimized for featured snippets and AI citation (AEO+GEO).

Generate complete, high-quality content following the template structure below. Your content must be optimized for:
1. Featured Snippets (Google) — via citable answer units with direct, factual answers
2. AI Citation (Gemini, Perplexity, ChatGPT) — via self-contained sections with evidence
3. Local SEO — via entity data, NAP consistency, and local E-E-A-T signals

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
${entityContext}
${ENHANCED_SCHEMA_INSTRUCTIONS}
${ENHANCED_REQUIREMENTS}`;
    } else {
      // Standard prompt (backward compatible — no entity profile)
      prompt = `You are an expert SEO content writer.

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
    }

    // LLM call with appropriate schema
    const schema = isEnhanced ? EnhancedContentDraftSchema : ContentDraftSchema;
    const validated = await callLLM({
      prompt,
      schema,
      preset: "creative",
      requestId,
    });

    // Post-LLM: generate JSON-LD deterministically (enhanced mode only)
    const responseData: Record<string, unknown> = { ...validated };

    if (isEnhanced && entityProfile) {
      const jsonldOutput = buildAllJsonLd(
        validated as import("@/types/schemas").EnhancedContentDraft,
        entityProfile,
        businessType ?? "local_services",
      );
      responseData.jsonld_output = jsonldOutput;
    }

    log("debug", endpoint, "Output:", {
      title: validated.title,
      wordCount: validated.metadata.word_count,
      enhanced: isEnhanced,
    });
    return ok(responseData, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
