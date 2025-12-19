import { NextRequest, NextResponse } from 'next/server';
import { KeywordInputSchema, IntentAnalysisSchema } from '@/types/schemas';
import { intentMock } from '@/lib/mocks/intent.mock';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    KeywordInputSchema.parse(body);

    // Validate output (schemas are boss)
    const validated = IntentAnalysisSchema.parse(intentMock);

    return NextResponse.json(validated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    );
  }
}
