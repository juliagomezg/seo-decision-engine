import { NextRequest, NextResponse } from 'next/server';
import { TemplateProposalSchema } from '@/types/schemas';
import { templatesMock } from '@/lib/mocks/templates.mock';

export async function POST(_req: NextRequest) {
  try {
    // Validate mock output against schema
    const validated = TemplateProposalSchema.parse(templatesMock);

    return NextResponse.json(validated);

  } catch (error) {
    return NextResponse.json(
      { error: 'Template proposal failed', details: String(error) },
      { status: 400 }
    );
  }
}
