import { NextRequest, NextResponse } from 'next/server';
import { KeywordInputSchema, IntentAnalysisSchema } from '@/types/schemas';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate input
    const { keyword, location, business_type } =
      KeywordInputSchema.parse(body);

    // 2. Prompt
    const prompt =
      `You are an SEO intent classification expert.\n\n` +
      `Keyword: ${keyword}\n` +
      `Location: ${location || 'global'}\n` +
      `Business Type: ${business_type || 'unspecified'}\n\n` +
      `Return ONLY valid JSON with this schema:\n` +
      `{
  "query_classification": "informational | commercial | navigational | transactional",
  "primary_user_goals": ["string"],
  "opportunities": [
    {
      "title": "string",
      "description": "string",
      "confidence": "low | medium | high",
      "user_goals": ["string"],
      "content_attributes_needed": ["string"],
      "rationale": "string"
    }
  ],
  "metadata": {
    "model": "string",
    "prompt_version": "v1.0.0",
    "timestamp": "ISO-8601"
  }
}
`;

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      top_p: 0.9,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}');

    // 4. Validate output
    const validated = IntentAnalysisSchema.parse(raw);

    return NextResponse.json(validated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    );
  }
}
