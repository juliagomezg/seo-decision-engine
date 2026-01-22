import { NextRequest, NextResponse } from 'next/server';
import { ContentRequestSchema, ContentDraftSchema } from '@/types/schemas';
import { ZodError } from 'zod';
import Groq from 'groq-sdk';
import { sanitizeKeyword, sanitizeLocation } from '@/lib/sanitize';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey });
}

export async function POST(req: NextRequest) {
  const endpoint = '[generate-content]';

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
    const parsed = ContentRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const location = parsed.location;
    const businessType = parsed.business_type;
    const selectedTemplate = parsed.selected_template ?? parsed.selectedTemplate;

    console.log(endpoint, 'Validated:', { keyword, template: selectedTemplate?.name });

    // P1: sanitize before prompt interpolation (control chars + length clamps live in sanitize.ts)
    const safeKeyword = sanitizeKeyword(keyword);
    const safeLocation = sanitizeLocation(location ?? '');

    // Build section instructions from template
    const sectionInstructions = selectedTemplate?.sections
      ?.map((s, i) => `${i + 1}. ${s.heading_level.toUpperCase()}: "${s.heading_text}" (${s.content_type}) - ${s.rationale}`)
      .join('\n') || '';

    const faqInstructions = selectedTemplate?.faqs
      ?.map((f, i) => `${i + 1}. Q: "${f.question}" - Guidance: ${f.answer_guidance}`)
      .join('\n') || '';

    // 2. Build prompt
    const prompt = `You are an expert SEO content writer.

Generate complete, high-quality content following the template structure below.

Keyword: ${safeKeyword}
Location: ${safeLocation || 'global'}
Business Type: ${businessType || 'unspecified'}

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
          temperature: 0.5,
          top_p: 0.9,
          max_tokens: 6000,
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
    const validated = ContentDraftSchema.parse(raw);

    console.log(endpoint, 'Output:', {
      title: validated.title,
      wordCount: validated.metadata.word_count,
    });
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
        : { error: 'Content generation failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
