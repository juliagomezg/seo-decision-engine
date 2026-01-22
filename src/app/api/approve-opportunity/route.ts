import { NextRequest, NextResponse } from 'next/server';
import {
  OpportunityGuardInputSchema,
  OpportunityGuardOutputSchema,
} from '@/types/schemas';
import { ZodError } from 'zod';
import Groq from 'groq-sdk';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeKeyword, sanitizeLocation } from '@/lib/sanitize';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey });
}

export async function POST(req: NextRequest) {
  const endpoint = '[approve-opportunity]';

  try {
    // P1: Rate limit early to protect Groq spend
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await req.json();
    console.log(endpoint, 'Input:', JSON.stringify(body));

    // 1. Validate input
    const {
      keyword,
      location,
      business_type,
      intent_analysis,
      selected_opportunity_index,
      selected_opportunity,
    } = OpportunityGuardInputSchema.parse(body);
    console.log(endpoint, 'Validated:', { keyword, selected_opportunity_index });

    // P1: sanitize before prompt interpolation (control chars + length clamps live in sanitize.ts)
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? '');

    // 2. Extract sibling opportunities for duplication check
    const siblingOpportunities = intent_analysis.opportunities
      .filter((_, index) => index !== selected_opportunity_index)
      .map((opp) => ({
        title: opp.title,
        description: opp.description,
      }));

    // 3. Construct validation prompt
    const prompt = `You are a senior SEO editor and content strategist. Your role is to validate that a human-selected content opportunity is high-quality, coherent, and non-generic.

INPUT CONTEXT:
Keyword: ${safeKeyword}
Location: ${safeLocation || 'Not specified'}
Business Type: ${business_type ?? 'unspecified'}
Detected Intent: ${intent_analysis.query_classification}

Intent Signals from Opportunities:
${intent_analysis.opportunities.map((o) => `- ${o.title}`).join('\n')}

SELECTED OPPORTUNITY TO VALIDATE:
Title: ${selected_opportunity.title}
Description: ${selected_opportunity.description}
Rationale: ${selected_opportunity.rationale}
Confidence: ${selected_opportunity.confidence}

OTHER OPPORTUNITIES (check for semantic duplication):
${siblingOpportunities
        .map((opp, i) => `${i + 1}. ${opp.title}\n   ${opp.description}`)
        .join('\n\n')}

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

    // 4. Call Groq with validation-specific settings (lazy client) with 30s timeout
    const groq = getGroqClient();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let completion;
    try {
      completion = await groq.chat.completions.create(
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(completion.choices[0].message.content ?? '{}');
    } catch {
      return NextResponse.json(
        { error: 'LLM returned invalid JSON', code: 'LLM_INVALID_JSON' },
        { status: 502 }
      );
    }

    // 5. Validate output
    const validated = OpportunityGuardOutputSchema.parse(raw);

    console.log(endpoint, 'Output:', { approved: validated.approved, risk_flags: validated.risk_flags });
    return NextResponse.json(validated);
  } catch (error) {
    console.error(endpoint, 'Error:', error);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }


    const msg = String(error);
    const isMissingKey = msg.includes('GROQ_API_KEY is not set');

    return NextResponse.json(
      isMissingKey
        ? { error: 'Server misconfigured', code: 'MISSING_GROQ_API_KEY' }
        : { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
