import { NextRequest, NextResponse } from 'next/server';
import { ContentRequestSchema, ContentDraftSchema } from '@/types/schemas';
import { contentMock } from '@/lib/mocks/content.mock';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  const endpoint = '[generate-content]';

  try {
    const body = await req.json();
    console.log(endpoint, 'Input:', JSON.stringify(body));

    // 1. Validate input
    const parsed = ContentRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const templateIndex =
      parsed.selected_template_index ?? parsed.selectedTemplateIndex;

    console.log(endpoint, 'Validated:', { keyword, templateIndex });

    // 2. Return mock (will be replaced with Groq call)
    const validated = ContentDraftSchema.parse(contentMock);

    console.log(endpoint, 'Output: mock content returned');
    return NextResponse.json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(endpoint, 'Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error(endpoint, 'Error:', error);
    return NextResponse.json(
      { error: 'Content generation failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

