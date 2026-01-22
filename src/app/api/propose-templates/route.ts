import { NextRequest, NextResponse } from 'next/server';
import { TemplateProposalSchema } from '@/types/schemas';
import { templatesMock } from '@/lib/mocks/templates.mock';

export async function POST(_req: NextRequest) {
  try {
    // Validate mock output against schema
    const validated = TemplateProposalSchema.parse(templatesMock);
    return NextResponse.json(validated);
  } catch {
    // Minimal: don't leak internals; mock/schema mismatch is server-side
    return NextResponse.json(
      { error: 'Template proposal failed', code: 'TEMPLATES_MOCK_INVALID' },
      { status: 500 }
    );
  }
}

