import { NextRequest } from "next/server";
import {
  ContentGuardInputSchema,
  ContentGuardOutputSchema,
} from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[approve-content]";
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
    const {
      keyword,
      location,
      business_type,
      opportunity,
      template,
      content,
    } = ContentGuardInputSchema.parse(body);
    log("debug", endpoint, "Validated:", { keyword, wordCount: content.metadata?.word_count });

    // BUGFIX: metadata can be missing -> avoid runtime crash
    const wordCount = content.metadata?.word_count ?? 0;

    // Detect enhanced content
    const contentAny = content as Record<string, unknown>;
    const hasAnswerUnits = Array.isArray(contentAny.citable_answer_units);
    const hasEvidenceLayer = contentAny.evidence_layer != null;
    const hasEntityCard = contentAny.entity_card != null;
    const isEnhanced = hasAnswerUnits && hasEvidenceLayer && hasEntityCard;

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    // Build AEO/GEO validation sections (only when enhanced content is present)
    let aeoGeoSections = "";
    if (isEnhanced) {
      const answerUnits = contentAny.citable_answer_units as Array<{ question: string; answer: string; answer_word_count: number }>;
      const evidenceLayer = contentAny.evidence_layer as { verifiable_ratio: number; total_claims: number; verifiable_count: number; claims: Array<{ claim_text: string; claim_type: string; source: string; verifiable: boolean }> };
      const entityCard = contentAny.entity_card as { business_name: string; address_formatted: string; phone: string };

      aeoGeoSections = `

7. AEO QUALITY CHECK:
   - Does each citable_answer_unit have 40-80 words? (Current units: ${answerUnits.length})
   - Sample answer units:
${answerUnits.slice(0, 3).map((u, i) => `     ${i + 1}. Q: "${u.question}" (${u.answer_word_count} words)`).join("\n")}
   - Do answers start with a direct statement (not "Bueno...", "Depende...", "En general...")?
   - Are questions formatted as natural voice search queries?
   - Do entity_fact claims match the entity data provided?

8. GEO EVIDENCE CHECK:
   - Verifiable ratio: ${evidenceLayer.verifiable_ratio.toFixed(2)} (target >= 0.6)
   - Total claims: ${evidenceLayer.total_claims}, Verifiable: ${evidenceLayer.verifiable_count}
   - Are there claims marked as entity_fact that reference non-existent data?
   - Are there statistical claims without proper sources?
   - Do any claims appear to be hallucinated?
   - Sample claims:
${evidenceLayer.claims.slice(0, 3).map((c, i) => `     ${i + 1}. "${c.claim_text}" (${c.claim_type}, verifiable: ${c.verifiable})`).join("\n")}

9. LOCAL E-E-A-T CHECK:
   - Does content naturally mention business name "${entityCard.business_name}"?
   - Does content reference the location "${entityCard.address_formatted}"?
   - Are certifications/awards used if available?
   - Is founding year or experience mentioned?
   - Does entity card have correct NAP: ${entityCard.business_name}, ${entityCard.address_formatted}, ${entityCard.phone}?`;
    }

    // Build risk flags documentation
    const riskFlagsDoc = isEnhanced
      ? `// Array of detected issues: "thin_content" | "generic_language" | "mismatch_intent" | "overoptimized" | "hallucination_risk" | "eeat_weak" | "duplicate_angle" | "answer_unit_too_short" | "answer_unit_too_long" | "low_evidence_ratio" | "entity_data_mismatch" | "chunk_not_self_contained" | "missing_eeat_signals"`
      : `// Array of detected issues: "thin_content" | "generic_language" | "mismatch_intent" | "overoptimized" | "hallucination_risk" | "eeat_weak" | "duplicate_angle"`;

    // Construct validation prompt
    const prompt = `You are a senior editorial director and SEO quality auditor. Your role is to validate that AI-generated content meets publication standards for quality, trust, depth, and user value. You protect brand reputation by rejecting content with hallucinations, thin substance, or weak E-E-A-T signals.

INPUT CONTEXT:
Keyword: ${safeKeyword}
Location: ${safeLocation || "Not specified"}
Business Type: ${business_type ?? "unspecified"}

APPROVED OPPORTUNITY (Gate A passed):
Title: ${opportunity.title}
Description: ${opportunity.description}
User Goals: ${opportunity.user_goals.join(", ")}
Content Attributes Needed: ${opportunity.content_attributes_needed.join(", ")}
Rationale: ${opportunity.rationale}

APPROVED TEMPLATE (Gate B passed):
Template Name: ${template.name}
H1: ${template.h1}
Sections: ${template.sections.map((s) => s.heading_text).join(" | ")}
Rationale: ${template.rationale}

GENERATED CONTENT TO VALIDATE:
Title: ${content.title}
H1: ${content.h1}
Meta Description: ${content.meta_description}
Word Count: ${wordCount}

Sections:
${content.sections
        .map(
          (s, i) => `${i + 1}. ${s.heading_text} (${s.heading_level})
   Content preview: ${s.content.substring(0, 200)}...`
        )
        .join("\n\n")}

FAQs:
${content.faqs
        .map(
          (f, i) => `${i + 1}. ${f.question}
   Answer: ${f.answer.substring(0, 150)}...`
        )
        .join("\n\n")}

CTA: ${content.cta.text}

VALIDATION CRITERIA:

1. INTENT & OPPORTUNITY ALIGNMENT:
   - Does the content actually satisfy the user intent behind "${safeKeyword}"?
   - Does it deliver on the approved opportunity promise: "${opportunity.title}"?
   - Would a real user searching this keyword feel their question was answered?
   - Are the user goals (${opportunity.user_goals.join(", ")}) addressed meaningfully?

2. CONTENT DEPTH & SUBSTANCE:
   - Is the content genuinely informative or surface-level?
   - Are sections substantive or padded with filler?
   - Is the word count (${wordCount}) justified by actual value?
   - Does each section provide specific, actionable information?
   - Are examples, details, or data included (not just generic statements)?

3. GENERIC / TEMPLATE LANGUAGE:
   - Does the content feel templated or could it exist for any keyword?
   - Are phrases overly generic ("it's important to...", "many people...", "in today's world...")?
   - Is the language specific to the business_type context?
   - Does it avoid blog-like platitudes without substance?

4. E-E-A-T & TRUST:
   - Is expertise demonstrated (not just claimed)?
   - Are claims realistic and responsible for the business_type?
   - Any hallucination risk: invented statistics, fake data, unverifiable claims?
   - Does the content establish authority naturally?
   - Are there trust signals (specificity, nuance, realistic limitations)?

5. SEO BALANCE:
   - Is optimization natural or does it feel forced?
   - Any keyword stuffing or unnatural repetition?
   - Is the content written for humans first, search engines second?
   - Does the meta description accurately represent the content?

6. DUPLICATION / ANGLE RISK:
   - Is the angle distinct or a common SERP pattern?
   - Does it avoid repeating what competitors already say?
   - Is there a unique perspective or value-add?
   - Would this content stand out in search results?
${aeoGeoSections}

DECISION RULES:
- Set approved: false if ANY high-risk issue is detected (hallucinations, thin content, generic language, E-E-A-T weakness)
${isEnhanced ? "- Set approved: false if verifiable_ratio < 0.6 or answer units have wrong word count" : ""}
- Set approved: true ONLY if content is publishable as-is without edits
- Provide specific, actionable reasons with examples from the content
- Reference specific sections, FAQs, or phrases when explaining issues
- Suggest concrete fixes if rejected

OUTPUT FORMAT (JSON ONLY):
{
  "approved": boolean,
  "reasons": [
    "Specific reason 1 with evidence from content (quote section headings or phrases)",
    "Specific reason 2 referencing validation criteria"
  ],
  "risk_flags": [
    ${riskFlagsDoc}
    // Empty array if no risks detected
  ],
  "suggested_fix": "Concrete editorial guidance for improving content quality (or empty string if approved)"
}

Validate the generated content now. Return JSON only, no explanations.`;

    // LLM call
    const validated = await callLLM({
      prompt,
      schema: ContentGuardOutputSchema,
      preset: "validation",
      requestId,
    });

    log("debug", endpoint, "Output:", { approved: validated.approved, risk_flags: validated.risk_flags });
    return ok(validated, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
