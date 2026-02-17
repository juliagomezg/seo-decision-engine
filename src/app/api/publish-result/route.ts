import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ContentDraftSchema,
  ContentGuardOutputSchema,
  IntentAnalysisSchema,
  TemplateProposalSchema,
  BusinessTypeSchema,
  EntityProfileSchema,
  JsonLdOutputSchema,
} from '@/types/schemas';
import type { PublishedResultBundle } from '@/types/schemas';
import { resultStore } from '@/lib/result-store';

const PublishInputSchema = z.object({
  keyword: z.string().min(1),
  location: z.string().optional(),
  business_type: BusinessTypeSchema.optional(),
  entity_profile: EntityProfileSchema.optional(),
  content_draft: ContentDraftSchema,
  guard_content_result: ContentGuardOutputSchema,
  jsonld_output: JsonLdOutputSchema.optional(),
  intent_analysis: IntentAnalysisSchema,
  selected_opportunity_index: z.number().int().min(0),
  template_proposal: TemplateProposalSchema,
  selected_template_index: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = PublishInputSchema.parse(body);

    const slug = parsed.content_draft.slug;
    const shortId = crypto.randomUUID().slice(0, 6);
    const id = `${slug}-${shortId}`;

    const bundle: PublishedResultBundle = {
      ...parsed,
      id,
      published_at: new Date().toISOString(),
    };

    await resultStore.save(bundle);

    return NextResponse.json({ id, url: `/result/${id}` });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 },
      );
    }
    console.error('[publish-result] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
