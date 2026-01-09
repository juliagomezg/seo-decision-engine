import { NextRequest, NextResponse } from 'next/server';
import { ContentGuardInputSchema, ContentGuardOutputSchema } from '@/types/schemas';
import { ZodError } from 'zod';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    // 1. Check API key inside handler (don't break build)
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Server misconfigured: GROQ_API_KEY missing' },
        { status: 500 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body = await req.json();

    // 2. Validate input
    const {
      keyword,
      location,
      business_type,
      opportunity,
      template,
      content,
    } = ContentGuardInputSchema.parse(body);

    // 3. Construct validation prompt
    const prompt = `You are a senior editorial director and SEO quality auditor. Your role is to validate that AI-generated content meets publication standards for quality, trust, depth, and user value. You protect brand reputation by rejecting content with hallucinations, thin substance, or weak E-E-A-T signals.

INPUT CONTEXT:
Keyword: ${keyword}
Location: ${location || 'Not specified'}
Business Type: ${business_type ?? 'unspecified'}

APPROVED OPPORTUNITY (Gate A passed):
Title: ${opportunity.title}
Description: ${opportunity.description}
User Goals: ${opportunity.user_goals.join(', ')}
Content Attributes Needed: ${opportunity.content_attributes_needed.join(', ')}
Rationale: ${opportunity.rationale}

APPROVED TEMPLATE (Gate B passed):
Template Name: ${template.name}
H1: ${template.h1}
Sections: ${template.sections.map(s => s.heading_text).join(' | ')}
Rationale: ${template.rationale}

GENERATED CONTENT TO VALIDATE:
Title: ${content.title}
H1: ${content.h1}
Meta Description: ${content.meta_description}
Word Count: ${content.metadata.word_count}

Sections:
${content.sections.map((s, i) => `${i + 1}. ${s.heading_text} (${s.heading_level})
   Content preview: ${s.content.substring(0, 200)}...`).join('\n\n')}

FAQs:
${content.faqs.map((f, i) => `${i + 1}. ${f.question}
   Answer: ${f.answer.substring(0, 150)}...`).join('\n\n')}

CTA: ${content.cta.text}

VALIDATION CRITERIA:

1. INTENT & OPPORTUNITY ALIGNMENT:
   - Does the content actually satisfy the user intent behind "${keyword}"?
   - Does it deliver on the approved opportunity promise: "${opportunity.title}"?
   - Would a real user searching this keyword feel their question was answered?
   - Are the user goals (${opportunity.user_goals.join(', ')}) addressed meaningfully?

2. CONTENT DEPTH & SUBSTANCE:
   - Is the content genuinely informative or surface-level?
   - Are sections substantive or padded with filler?
   - Is the word count (${content.metadata.word_count}) justified by actual value?
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

DECISION RULES:
- Set approved: false if ANY high-risk issue is detected (hallucinations, thin content, generic language, E-E-A-T weakness)
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
    // Array of detected issues: "thin_content" | "generic_language" | "mismatch_intent" | "overoptimized" | "hallucination_risk" | "eeat_weak" | "duplicate_angle"
    // Empty array if no risks detected
  ],
  "suggested_fix": "Concrete editorial guidance for improving content quality (or empty string if approved)"
}

Validate the generated content now. Return JSON only, no explanations.`;

    // 4. Call Groq with validation-specific settings
    const completion = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}');

    // 5. Validate output
    const validated = ContentGuardOutputSchema.parse(raw);

    return NextResponse.json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
