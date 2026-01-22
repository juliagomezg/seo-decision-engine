import { NextRequest } from "next/server";
import {
  OpportunityGuardInputSchema,
  OpportunityGuardOutputSchema,
} from "@/types/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeKeyword, sanitizeLocation } from "@/lib/sanitize";
import { callLLM } from "@/lib/llm";
import { ok, badRequest, rateLimited, mapErrorToResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const endpoint = "[approve-opportunity]";

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

    // Input validation
    const {
      keyword,
      location,
      business_type,
      intent_analysis,
      selected_opportunity_index,
      selected_opportunity,
    } = OpportunityGuardInputSchema.parse(body);
    console.log(endpoint, "Validated:", { keyword, selected_opportunity_index });

    // Sanitize before prompt interpolation
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? "");

    // Extract sibling opportunities for duplication check
    const siblingOpportunities = intent_analysis.opportunities
      .filter((_, index) => index !== selected_opportunity_index)
      .map((opp) => ({
        title: opp.title,
        description: opp.description,
      }));

    // Construct validation prompt
    const prompt = `You are a senior SEO editor and content strategist. Your role is to validate that a human-selected content opportunity is high-quality, coherent, and non-generic.

INPUT CONTEXT:
Keyword: ${safeKeyword}
Location: ${safeLocation || "Not specified"}
Business Type: ${business_type ?? "unspecified"}
Detected Intent: ${intent_analysis.query_classification}

Intent Signals from Opportunities:
${intent_analysis.opportunities.map((o) => `- ${o.title}`).join("\n")}

SELECTED OPPORTUNITY TO VALIDATE:
Title: ${selected_opportunity.title}
Description: ${selected_opportunity.description}
Rationale: ${selected_opportunity.rationale}
Confidence: ${selected_opportunity.confidence}

OTHER OPPORTUNITIES (check for semantic duplication):
${siblingOpportunities
  .map((opp, i) => `${i + 1}. ${opp.title}\n   ${opp.description}`)
  .join("\n\n")}

VALIDATION CRITERIA:

1. INTENT COHERENCE:
   - Does this opportunity align with the detected intent (${intent_analysis.query_classification})?
   - Would a user with this search intent find this content valuable?
   - Is the opportunity appropriate for the business_type context?

2. GENERIC DETECTION:
   - Is the title specific and actionable, or generic/templated?
   - Does it avoid SEO clichés like "Ultimate Guide" or "Everything You Need to Know"?
   - Is it tailored to the business_type and location context?

3. DUPLICATION RISK:
   - Does this opportunity semantically overlap with sibling opportunities?
   - Are the user goals and content angles truly distinct?
   - Would creating both this and another opportunity result in cannibalization?

4. CONTENT THINNESS:
   - Does the description suggest substantive, valuable content?
   - Is the rationale specific (not vague platitudes)?
   - Does it go beyond basic keyword repetition?

5. UNSAFE CLAIMS:
   - Does the title avoid superlatives without evidence ("best", "top", "ultimate")?
   - Is it realistic and achievable for the given business context?
   - Does it avoid overpromising or clickbait patterns?

DECISION RULES:
- Set approved: false if ANY high-risk issue is detected
- Set approved: true only if all criteria pass
- Provide specific, actionable reasons (not generic feedback)
- Suggest concrete fixes if rejected

OUTPUT FORMAT (JSON ONLY):
{
  "approved": boolean,
  "reasons": [
    "Specific reason 1 based on validation criteria",
    "Specific reason 2 with concrete evidence from input"
  ],
  "risk_flags": [
    // Array of detected issues: "duplicate_risk" | "generic" | "mismatch_intent" | "thin" | "unsafe_claims"
    // Empty array if no risks detected
  ],
  "suggested_fix": "Concrete suggestion for improvement (or empty string if approved)"
}

Validate the selected opportunity now. Return JSON only, no explanations.`;

    // LLM call
    const validated = await callLLM({
      prompt,
      schema: OpportunityGuardOutputSchema,
      preset: "validation",
    });

    console.log(endpoint, "Output:", { approved: validated.approved, risk_flags: validated.risk_flags });
    return ok(validated);
  } catch (err) {
    return mapErrorToResponse(err, { endpoint });
  }
}
