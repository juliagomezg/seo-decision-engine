import { NextRequest } from "next/server";
import {
  TemplateGuardInputSchema,
  TemplateGuardOutputSchema,
} from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";
import { installTelemetry } from "@/lib/telemetry";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  installTelemetry();
  const endpoint = "[approve-template]";
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
      selected_template_index,
      template,
    } = TemplateGuardInputSchema.parse(body);
    log("debug", endpoint, "Validated:", { keyword, selected_template_index });

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    // Construct validation prompt
    const prompt = `You are a senior SEO strategist and information architect. Your role is to validate that a human-selected template structure is appropriate, substantive, and aligned with the approved opportunity.

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
Confidence: ${opportunity.confidence}

SELECTED TEMPLATE TO VALIDATE:
Name: ${template.name}
Description: ${template.description}
Structure (sections):
${template.structure.map((section, i) => `${i + 1}. ${section}`).join("\n")}

VALIDATION CRITERIA:

1. OPPORTUNITY FIT:
   - Does the template structure address the user goals from the approved opportunity?
   - Do the sections align with the content_attributes_needed?
   - Would this structure deliver on the opportunity's promise?
   - Is the template appropriate for the business_type and keyword context?

2. GENERIC STRUCTURE DETECTION:
   - Is this a generic/boilerplate template that could apply to any topic?
   - Are section headings specific to this opportunity or generic placeholders?
   - Does it avoid cookie-cutter patterns like "Introduction / Benefits / Conclusion"?
   - Is it tailored to the specific keyword and business context?

3. COMPLETENESS & SUBSTANCE:
   - Does the template have enough sections for substantive, valuable content?
   - Are there critical sections missing based on user goals?
   - Would this structure support in-depth coverage (not just surface-level)?
   - Is there a logical flow that serves the user's journey?

4. DUPLICATION PATTERN RISK:
   - Is this a common template pattern that competitors likely use?
   - Does it differentiate from standard SEO templates?
   - Would this structure create truly unique content or just replicate existing patterns?

5. OVER-OPTIMIZATION DETECTION:
   - Is the structure balanced between SEO and user value?
   - Does it avoid excessive keyword-focused sections without substance?
   - Is it designed for users first, search engines second?
   - Does it prioritize answering user questions over ranking tactics?

DECISION RULES:
- Set approved: false if ANY high-risk issue is detected
- Set approved: true only if all criteria pass
- Provide specific, actionable reasons (not generic feedback)
- Reference specific sections by name when providing feedback
- Suggest concrete structural improvements if rejected

OUTPUT FORMAT (JSON ONLY):
{
  "approved": boolean,
  "reasons": [
    "Specific reason 1 referencing validation criteria and template sections",
    "Specific reason 2 with concrete evidence from input"
  ],
  "risk_flags": [
    // Array of detected issues: "generic_structure" | "mismatch_opportunity" | "thin_content_risk" | "duplicate_pattern" | "overoptimized"
    // Empty array if no risks detected
  ],
  "suggested_fix": "Concrete suggestion for structural improvement (or empty string if approved)"
}

Validate the selected template structure now. Return JSON only, no explanations.`;

    // LLM call
    const validated = await callLLM({
      prompt,
      schema: TemplateGuardOutputSchema,
      preset: "validation",
      requestId,
    });

    log("debug", endpoint, "Output:", { approved: validated.approved, risk_flags: validated.risk_flags });
    return ok(validated, requestId);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint, requestId });
  }
}
