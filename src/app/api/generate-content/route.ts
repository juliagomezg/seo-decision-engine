import { NextRequest, NextResponse } from 'next/server';
import { ContentDraftSchema } from '@/types/schemas';
import { contentMock } from '@/lib/mocks/content.mock';

export async function POST(_req: NextRequest) {
  try {
    // Validate mock output against schema
    const validated = ContentDraftSchema.parse(contentMock);
    return NextResponse.json(validated);
  } catch {
    // Minimal: don't leak internals
    return NextResponse.json(
      { error: 'Content generation failed', code: 'CONTENT_MOCK_INVALID' },
      { status: 500 }
    );
  }
}

