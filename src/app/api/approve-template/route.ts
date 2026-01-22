import { NextRequest, NextResponse } from 'next/server';
import {
  TemplateGuardInputSchema,
  TemplateGuardOutputSchema,
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
  const endpoint = '[approve-template]';

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
      opportunity,
      selected_template_index, // intentionally unused but validated
      template,
    } = TemplateGuardInputSchema.parse(body);
    console.log(endpoint, 'Validated:', { keyword, selected_template_index });

    // P1: sanitize before prompt interpolation (control chars + length clamps live in sanitize.ts)
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? '');

    // 2. Construct validation prompt
    const prompt = `You are a senior SEO strategist and information architect. Your role is to validate that a human-selected template structure is appropriate, substantive, and aligned with the approved opportunity.

INPUT CONTEXT:
Keyword: ${safeKeyword}
Location: ${safeLocation || 'Not specified'}
Business Type: ${business_type ?? 'unspecified'}

APPROVED OPPORTUNITY (Gate A passed):
Title: ${opportunity.title}
Description: ${opportunity.description}
User Goals: ${opportunity.user_goals.join(', ')}
Content Attributes Needed: ${opportunity.content_attributes_needed.join(', ')}
Rationale: ${opportunity.rationale}
Confidence: ${opportunity.confidence}

SELECTED TEMPLATE TO VALIDATE:
Name: ${template.name}
Description: ${template.description}
Structure (sections):
${template.structure.map((section, i) => `${i + 1}. ${section}`).join('\n')}

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

    // 3. Call Groq (lazy client) with 30s timeout
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

    let raw;
    try {
      raw = JSON.parse(completion.choices[0].message.content ?? '{}');
    } catch {
      return NextResponse.json(
        { error: 'LLM returned invalid JSON', code: 'LLM_INVALID_JSON' },
        { status: 502 }
      );
    }

    // 4. Validate output
    const validated = TemplateGuardOutputSchema.parse(raw);

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
