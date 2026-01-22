import { NextRequest, NextResponse } from 'next/server';
import { TemplateRequestSchema, TemplateProposalSchema } from '@/types/schemas';
import { templatesMock } from '@/lib/mocks/templates.mock';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  const endpoint = '[propose-templates]';

  try {
    const body = await req.json();
    console.log(endpoint, 'Input:', JSON.stringify(body));

    // 1. Validate input
    const parsed = TemplateRequestSchema.parse(body);

    // Normalize snake_case / camelCase
    const keyword = parsed.keyword;
    const opportunityIndex =
      parsed.selected_opportunity_index ?? parsed.selectedOpportunityIndex;

    console.log(endpoint, 'Validated:', { keyword, opportunityIndex });

    // 2. Return mock (will be replaced with Groq call)
    const validated = TemplateProposalSchema.parse(templatesMock);

    console.log(endpoint, 'Output: mock templates returned');
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
      { error: 'Template proposal failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

