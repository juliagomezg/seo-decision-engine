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
  business_type: z.enum(['real_estate', 'hospitality', 'saas', 'local_services', 'education', 'healthcare', 'food_and_beverage', 'professional_services']).optional(),
});

export type KeywordInput = z.infer<typeof KeywordInputSchema>;

// ============================================
// INTENT ANALYSIS OUTPUT (Gate A Input)
// ============================================

export const RiskIndicatorSchema = z.enum([
  'thin_content',       // Riesgo de contenido muy delgado
  'generic_angle',      // Ángulo muy genérico
  'high_competition',   // Competencia muy alta en SERP
  'low_volume',         // Volumen de búsqueda bajo
  'seasonal_query',     // Query estacional (tráfico variable)
  'intent_mismatch',    // Posible desalineación con intención
  'monetization_weak',  // Débil potencial de monetización
  'eeat_risk',          // Riesgo E-E-A-T (temas sensibles)
]);

export type RiskIndicator = z.infer<typeof RiskIndicatorSchema>;

export const OpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  confidence: z.enum(['low', 'medium', 'high']),
  user_goals: z.array(z.string()).min(1, 'At least one user goal required'),
  content_attributes_needed: z.array(z.string()).min(1, 'At least one content attribute required'),
  rationale: z.string().min(10, 'Rationale must explain why this opportunity exists'),
  risk_indicators: z.array(RiskIndicatorSchema).default([]),
  aeo_potential: z.enum(['low', 'medium', 'high']).optional(),
  geo_potential: z.enum(['low', 'medium', 'high']).optional(),
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
  aeo_strategy: z.object({
    snippet_type: z.string().min(1),
    voice_questions: z.array(z.string()).min(1).max(5),
    answer_unit_count: z.number().int().min(5).max(15),
  }).optional(),
  geo_strategy: z.object({
    schema_types: z.array(z.string()).min(1),
    chunking_strategy: z.string().min(1),
    evidence_density: z.enum(['low', 'medium', 'high']),
  }).optional(),
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
  input_data: z.record(z.string(), z.any()),
  output_data: z.record(z.string(), z.any()),
  validation_passed: z.boolean(),
  validation_errors: z.record(z.string(), z.any()).nullable(),
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
  decision_metadata: z.record(z.string(), z.any()).nullable(),
});

export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;

// ============================================
// LAYER 2: OPPORTUNITY GUARD (QA / VALIDATION)
// ============================================

export const OpportunityGuardInputSchema = z.object({
  keyword: z.string().trim().min(1),
  location: z.string().optional(),
  business_type: z.enum(['real_estate', 'hospitality', 'saas', 'local_services', 'education', 'healthcare', 'food_and_beverage', 'professional_services']).optional(),
  intent_analysis: IntentAnalysisSchema,
  selected_opportunity_index: z.number().int().min(0),
  selected_opportunity: OpportunitySchema,
});

export type OpportunityGuardInput = z.infer<typeof OpportunityGuardInputSchema>;

export const OpportunityGuardOutputSchema = z.object({
  approved: z.boolean(),
  reasons: z.array(z.string()).min(1, 'Must provide at least one reason'),
  risk_flags: z.array(z.enum(['duplicate_risk', 'generic', 'mismatch_intent', 'thin', 'unsafe_claims'])),
  suggested_fix: z.string(),
});

export type OpportunityGuardOutput = z.infer<typeof OpportunityGuardOutputSchema>;

// ============================================
// LAYER 3: TEMPLATE GUARD (STRUCTURE / FIT)
// ============================================

export const TemplateGuardInputSchema = z.object({
  keyword: z.string().min(1),
  location: z.string().optional(),
  business_type: z.string().optional(),
  opportunity: OpportunitySchema,
  selected_template_index: z.number().int().min(0),
  template: z.object({
    name: z.string(),
    description: z.string(),
    structure: z.array(z.string()),
  }),
});

export type TemplateGuardInput = z.infer<typeof TemplateGuardInputSchema>;

export const TemplateGuardOutputSchema = z.object({
  approved: z.boolean(),
  reasons: z.array(z.string()),
  risk_flags: z.array(
    z.enum([
      'generic_structure',
      'mismatch_opportunity',
      'thin_content_risk',
      'duplicate_pattern',
      'overoptimized',
    ])
  ),
  suggested_fix: z.string(),
});

export type TemplateGuardOutput = z.infer<typeof TemplateGuardOutputSchema>;

// ============================================
// LAYER 4: CONTENT GUARD (QUALITY / TRUST)
// ============================================

export const ContentGuardInputSchema = z.object({
  keyword: z.string().min(1),
  location: z.string().optional(),
  business_type: z.string().optional(),

  opportunity: OpportunitySchema,
  template: TemplateStructureSchema,

  content: ContentDraftSchema,
});

export type ContentGuardInput = z.infer<typeof ContentGuardInputSchema>;

export const ContentGuardOutputSchema = z.object({
  approved: z.boolean(),

  reasons: z.array(z.string()).min(1, 'Must provide at least one reason'),

  risk_flags: z.array(
    z.enum([
      'thin_content',
      'generic_language',
      'mismatch_intent',
      'overoptimized',
      'hallucination_risk',
      'eeat_weak',
      'duplicate_angle',
      'answer_unit_too_short',
      'answer_unit_too_long',
      'low_evidence_ratio',
      'entity_data_mismatch',
      'chunk_not_self_contained',
      'missing_eeat_signals',
    ])
  ),

  suggested_fix: z.string(),
});

export type ContentGuardOutput = z.infer<typeof ContentGuardOutputSchema>;

// ============================================
// API REQUEST SCHEMAS (for mock routes)
// ============================================

// DRY: single source of truth for business types
export const BusinessTypeSchema = z.enum([
  'real_estate',
  'hospitality',
  'saas',
  'local_services',
  'education',
  'healthcare',
  'food_and_beverage',
  'professional_services',
]);

// Cleaner index coercion:
// - If it's a numeric string -> number
// - If it's not numeric -> keep original so Zod says "expected number, received string"
const IndexSchema = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}, z.number().int().min(0));

/**
 * Request schema for /api/propose-templates
 * Called after Gate A approval with the selected opportunity context
 */
export const TemplateRequestSchema = z
  .object({
    keyword: z.string().trim().min(1, 'Keyword is required'),
    location: z.string().optional(),
    business_type: BusinessTypeSchema.optional(),

    // support snake_case + camelCase
    selected_opportunity: OpportunitySchema.optional(),
    selectedOpportunity: OpportunitySchema.optional(),

    selected_opportunity_index: IndexSchema.optional(),
    selectedOpportunityIndex: IndexSchema.optional(),
  })
  .refine((d) => d.selected_opportunity || d.selectedOpportunity, {
    message: 'selected_opportunity is required',
  })
  .refine(
    (d) =>
      d.selected_opportunity_index !== undefined ||
      d.selectedOpportunityIndex !== undefined,
    { message: 'selected_opportunity_index is required' }
  );

export type TemplateRequest = z.infer<typeof TemplateRequestSchema>;

/**
 * Request schema for /api/generate-content
 * Called after Gate B approval with the selected template context
 */
export const ContentRequestSchema = z
  .object({
    keyword: z.string().trim().min(1, 'Keyword is required'),
    location: z.string().optional(),
    business_type: BusinessTypeSchema.optional(),

    // support snake_case + camelCase
    selected_template: TemplateStructureSchema.optional(),
    selectedTemplate: TemplateStructureSchema.optional(),

    selected_template_index: IndexSchema.optional(),
    selectedTemplateIndex: IndexSchema.optional(),

    // AEO+GEO: optional entity profile for enriched content
    entity_profile: z.lazy(() => EntityProfileSchema).optional(),
  })
  .refine((d) => d.selected_template || d.selectedTemplate, {
    message: 'selected_template is required',
  })
  .refine(
    (d) =>
      d.selected_template_index !== undefined ||
      d.selectedTemplateIndex !== undefined,
    { message: 'selected_template_index is required' }
  );

export type ContentRequest = z.infer<typeof ContentRequestSchema>;

// ============================================
// ENTITY PROFILE (Business Data — user-provided, never LLM-invented)
// ============================================

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type GeoCoordinates = z.infer<typeof GeoCoordinatesSchema>;

export const BusinessHoursSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean().default(false),
});

export type BusinessHours = z.infer<typeof BusinessHoursSchema>;

export const ServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(500),
  price_range: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  availability: z.string().max(200).optional(),
  custom_attributes: z.record(z.string(), z.string()).optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

export const EntityProfileSchema = z.object({
  // === CORE (universal, required) ===
  business_name: z.string().min(1).max(200),
  business_type_detail: z.string().max(200).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(1).default('MX'),
  }),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional(),
  website: z.string().url().optional(),

  // === GEO (location data) ===
  coordinates: GeoCoordinatesSchema.optional(),
  service_area: z.array(z.string()).min(1).max(20),

  // === OPERATIONS (universal) ===
  hours: z.array(BusinessHoursSchema).min(1).max(7),
  services: z.array(ServiceSchema).min(1).max(20),

  // === E-E-A-T SIGNALS (universal, all optional) ===
  founding_year: z.number().int().min(1800).max(2030).optional(),
  certifications: z.array(z.string()).max(20).optional(),
  awards: z.array(z.string()).max(20).optional(),
  team_size: z.string().max(50).optional(),
  team_highlights: z.array(z.string()).max(10).optional(),

  // === SOCIAL PROOF (universal) ===
  review_count: z.number().int().min(0).optional(),
  average_rating: z.number().min(1).max(5).optional(),
  review_platforms: z.array(z.string()).max(10).optional(),

  // === VERTICAL-SPECIFIC EXTENSION ===
  custom_attributes: z.record(z.string(), z.string()).optional(),
});

export type EntityProfile = z.infer<typeof EntityProfileSchema>;

// ============================================
// AEO: CITABLE ANSWER UNITS
// ============================================

export const CitableAnswerUnitSchema = z.object({
  question: z.string().min(10).max(200),
  answer: z.string().min(150).max(350),
  answer_word_count: z.number().int().min(40).max(80),
  topic_tag: z.string().min(1).max(50),
  evidence_type: z.enum(['factual', 'descriptive', 'comparative', 'procedural']),
  source_field: z.string().optional(),
});

export type CitableAnswerUnit = z.infer<typeof CitableAnswerUnitSchema>;

// ============================================
// GEO: EVIDENCE LAYER
// ============================================

export const EvidenceClaimSchema = z.object({
  claim_text: z.string().min(10),
  claim_type: z.enum(['entity_fact', 'general_knowledge', 'statistical', 'testimonial', 'procedural']),
  source: z.string().min(1),
  verifiable: z.boolean(),
  section_index: z.number().int().min(0),
});

export type EvidenceClaim = z.infer<typeof EvidenceClaimSchema>;

export const EvidenceLayerSchema = z.object({
  claims: z.array(EvidenceClaimSchema).min(1),
  total_claims: z.number().int().positive(),
  verifiable_count: z.number().int().min(0),
  verifiable_ratio: z.number().min(0).max(1),
});

export type EvidenceLayer = z.infer<typeof EvidenceLayerSchema>;

// ============================================
// ENHANCED SECTIONS (with chunking metadata)
// ============================================

export const EnhancedSectionSchema = z.object({
  heading_level: z.enum(['h2', 'h3']),
  heading_text: z.string().min(1),
  content: z.string().min(50),
  chunk_id: z.string().regex(/^[a-z0-9-]+$/),
  is_self_contained: z.boolean(),
  word_count: z.number().int().positive(),
  topic_tags: z.array(z.string()).min(1).max(5),
});

export type EnhancedSection = z.infer<typeof EnhancedSectionSchema>;

// ============================================
// ENHANCED CONTENT DRAFT (extends ContentDraftSchema)
// ============================================

export const EntityCardSchema = z.object({
  business_name: z.string(),
  address_formatted: z.string(),
  phone: z.string(),
  services_highlighted: z.array(z.string()).min(1).max(5),
  hours_summary: z.string(),
  rating_summary: z.string().optional(),
});

export type EntityCard = z.infer<typeof EntityCardSchema>;

export const EnhancedContentDraftSchema = ContentDraftSchema.extend({
  sections: z.array(EnhancedSectionSchema).min(3),
  citable_answer_units: z.array(CitableAnswerUnitSchema).min(5).max(15),
  evidence_layer: EvidenceLayerSchema,
  entity_card: EntityCardSchema,
});

export type EnhancedContentDraft = z.infer<typeof EnhancedContentDraftSchema>;

// ============================================
// JSON-LD OUTPUT (deterministic, no LLM)
// ============================================

export const JsonLdScriptSchema = z.object({
  type: z.string(),
  jsonld: z.record(z.string(), z.unknown()),
});

export type JsonLdScript = z.infer<typeof JsonLdScriptSchema>;

export const JsonLdOutputSchema = z.object({
  scripts: z.array(JsonLdScriptSchema),
  warnings: z.array(z.string()),
});

export type JsonLdOutput = z.infer<typeof JsonLdOutputSchema>;
