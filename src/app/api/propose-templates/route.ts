import { NextRequest, NextResponse } from 'next/server';
import { TemplateRequestSchema, TemplateProposalSchema } from '@/types/schemas';
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
  const endpoint = '[propose-templates]';

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
    const parsed = TemplateRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const location = parsed.location;
    const businessType = parsed.business_type;
    const selectedOpportunity = parsed.selected_opportunity ?? parsed.selectedOpportunity;

    // P1: sanitize before prompt interpolation (control chars + length clamps live in sanitize.ts)
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? '');

    console.log(endpoint, 'Validated:', { keyword, opportunity: selectedOpportunity?.title });

    // 2. Build prompt
    const prompt = `You are an SEO content strategist.

Based on the following context, propose 2-3 content template structures optimized for this opportunity.

Keyword: ${safeKeyword}
Location: ${safeLocation || 'global'}
Business Type: ${businessType || 'unspecified'}

Selected Opportunity:
- Title: ${selectedOpportunity?.title}
- Description: ${selectedOpportunity?.description}
- User Goals: ${selectedOpportunity?.user_goals?.join(', ')}
- Content Attributes Needed: ${selectedOpportunity?.content_attributes_needed?.join(', ')}

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
      "rationale": "string (why this template structure works)"
    }
  ],
  "metadata": {
    "model": "string",
    "prompt_version": "v1.0.0",
    "timestamp": "ISO-8601"
  }
}

Requirements:
- Provide 2-3 distinct template options
- Each template must have at least 3 sections and at least 3 FAQs
- Sections should address the user goals and content attributes
- Make rationales specific to the keyword and opportunity`;

    // 3. Call Groq with 30s timeout
    const groq = getGroqClient();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let completion;
    try {
      completion = await groq.chat.completions.create(
        {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          top_p: 0.9,
          max_tokens: 4000,
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

    // 4. Validate output
    const validated = TemplateProposalSchema.parse(raw);

    console.log(endpoint, 'Output:', { templateCount: validated.templates.length });
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
      // server-side log only (do not return issues to client)
      console.error(endpoint, 'Validation error:', error.issues);
      // Minimal: avoid leaking internal validation details
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
        : { error: 'Template proposal failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
