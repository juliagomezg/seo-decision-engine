/**
 * SCHEMAS.TS
 * Single source of truth for all data structures.
 * These schemas are immutable contracts after Day 1.
 * All API inputs/outputs MUST validate against these schemas.
 */

import { z } from 'zod';

// ============================================
// INPUT SCHEMAS
// ============================================

export const KeywordInputSchema = z.object({
  keyword: z.string().trim().min(1, 'Keyword is required').max(200, 'Keyword too long'),
  location: z.string().max(100).optional(),
  business_type: z.enum(['real_estate', 'hospitality', 'saas', 'local_services']).optional(),
});

export type KeywordInput = z.infer<typeof KeywordInputSchema>;

// ============================================
// INTENT ANALYSIS OUTPUT (Gate A Input)
// ============================================

export const OpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  confidence: z.enum(['low', 'medium', 'high']),
  user_goals: z.array(z.string()).min(1, 'At least one user goal required'),
  content_attributes_needed: z.array(z.string()).min(1, 'At least one content attribute required'),
  rationale: z.string().min(10, 'Rationale must explain why this opportunity exists'),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;

export const IntentAnalysisSchema = z.object({
  query_classification: z.enum(['informational', 'transactional', 'navigational', 'commercial']),
  primary_user_goals: z.array(z.string()).min(1).max(5),
  opportunities: z.array(OpportunitySchema).min(5, 'Must provide at least 5 opportunities').max(10, 'Max 10 opportunities'),
  metadata: z.object({
    model: z.string().min(1),
    prompt_version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Must be semantic version like v1.0.0'),
    timestamp: z.string().datetime(),
  }),
});

export type IntentAnalysis = z.infer<typeof IntentAnalysisSchema>;

// ============================================
// TEMPLATE STRUCTURE OUTPUT (Gate B Input)
// ============================================

export const TemplateSectionSchema = z.object({
  heading_level: z.enum(['h2', 'h3']),
  heading_text: z.string().min(1),
  content_type: z.enum(['text', 'list', 'table', 'comparison', 'faq']),
  rationale: z.string().min(10, 'Rationale must explain why this section is needed'),
});

export type TemplateSection = z.infer<typeof TemplateSectionSchema>;

export const TemplateStructureSchema = z.object({
  name: z.string().min(1, 'Template must have a name'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1),
  h1: z.string().min(1),
  sections: z.array(TemplateSectionSchema).min(3, 'Template must have at least 3 sections').max(15, 'Max 15 sections'),
  faqs: z.array(z.object({
    question: z.string().min(5),
    answer_guidance: z.string().min(10),
  })).min(3, 'Must have at least 3 FAQs').max(10, 'Max 10 FAQs'),
  cta_suggestion: z.object({
    text: z.string().min(1),
    position: z.enum(['top', 'middle', 'bottom']),
  }),
  internal_link_suggestions: z.array(z.string()).max(10),
  schema_org_types: z.array(z.string()).min(1, 'Must suggest at least one schema.org type'),
  rationale: z.string().min(20, 'Rationale must explain template structure choice'),
});

export type TemplateStructure = z.infer<typeof TemplateStructureSchema>;

export const TemplateProposalSchema = z.object({
  templates: z.array(TemplateStructureSchema).min(2, 'Must provide at least 2 template options').max(3, 'Max 3 template options'),
  metadata: z.object({
    model: z.string().min(1),
    prompt_version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Must be semantic version like v1.0.0'),
    timestamp: z.string().datetime(),
  }),
});

export type TemplateProposal = z.infer<typeof TemplateProposalSchema>;

// ============================================
// CONTENT GENERATION OUTPUT (Final Deliverable)
// ============================================

export const GeneratedSectionSchema = z.object({
  heading_level: z.enum(['h2', 'h3']),
  heading_text: z.string().min(1),
  content: z.string().min(50, 'Content must be substantive'),
});

export type GeneratedSection = z.infer<typeof GeneratedSectionSchema>;

export const ContentDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  h1: z.string().min(1).max(150),
  meta_description: z.string().min(50, 'Meta description should be at least 50 chars').max(160, 'Meta description should not exceed 160 chars'),
  sections: z.array(GeneratedSectionSchema).min(3, 'Must have at least 3 sections'),
  faqs: z.array(z.object({
    question: z.string().min(5),
    answer: z.string().min(20),
  })).min(3, 'Must have at least 3 FAQs'),
  cta: z.object({
    text: z.string().min(1),
    position: z.enum(['top', 'middle', 'bottom']),
  }),
  metadata: z.object({
    model: z.string().min(1),
    prompt_version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Must be semantic version like v1.0.0'),
    timestamp: z.string().datetime(),
    word_count: z.number().int().positive(),
  }),
});

export type ContentDraft = z.infer<typeof ContentDraftSchema>;

// ============================================
// DATABASE RECORD TYPES (for reference)
// ============================================

export const RequestRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  user_name: z.string().default('demo'),
  keyword: z.string(),
  location: z.string().nullable(),
  business_type: z.string().nullable(),
  step: z.enum(['intent_analysis', 'template_proposal', 'content_generation']),
  model_used: z.string(),
  prompt_version: z.string(),
  input_data: z.record(z.any()),
  output_data: z.record(z.any()),
  validation_passed: z.boolean(),
  validation_errors: z.record(z.any()).nullable(),
});

export type RequestRecord = z.infer<typeof RequestRecordSchema>;

export const ApprovalRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  user_name: z.string().default('demo'),
  request_id: z.string().uuid(),
  gate: z.enum(['gate_a', 'gate_b']),
  approved: z.boolean(),
  selected_option_index: z.number().int().min(0).nullable(),
  rejection_reason: z.string().nullable(),
  decision_metadata: z.record(z.any()).nullable(),
});

export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;
