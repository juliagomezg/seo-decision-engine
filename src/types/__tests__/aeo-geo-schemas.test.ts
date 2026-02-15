import { describe, it, expect } from 'vitest';
import {
  EntityProfileSchema,
  GeoCoordinatesSchema,
  BusinessHoursSchema,
  ServiceSchema,
  CitableAnswerUnitSchema,
  EvidenceClaimSchema,
  EvidenceLayerSchema,
  EnhancedSectionSchema,
  EntityCardSchema,
  JsonLdOutputSchema,
  BusinessTypeSchema,
  ContentGuardOutputSchema,
  OpportunitySchema,
} from '../schemas';

// ============================================
// ENTITY PROFILE SCHEMAS
// ============================================

describe('GeoCoordinatesSchema', () => {
  it('accepts valid coordinates', () => {
    const result = GeoCoordinatesSchema.safeParse({ latitude: 29.0729, longitude: -110.9559 });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-range latitude', () => {
    const result = GeoCoordinatesSchema.safeParse({ latitude: 91, longitude: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    const result = GeoCoordinatesSchema.safeParse({ latitude: 0, longitude: 181 });
    expect(result.success).toBe(false);
  });
});

describe('BusinessHoursSchema', () => {
  it('accepts valid hours', () => {
    const result = BusinessHoursSchema.safeParse({
      day: 'monday',
      open: '08:00',
      close: '15:00',
      closed: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid time format', () => {
    const result = BusinessHoursSchema.safeParse({
      day: 'monday',
      open: '8:00', // missing leading zero
      close: '15:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid day', () => {
    const result = BusinessHoursSchema.safeParse({
      day: 'lunes',
      open: '08:00',
      close: '15:00',
    });
    expect(result.success).toBe(false);
  });
});

describe('ServiceSchema', () => {
  it('accepts valid service with custom_attributes', () => {
    const result = ServiceSchema.safeParse({
      name: 'Maternal',
      description: 'Programa para niños de 2-3 años',
      price_range: '$3,500/mes',
      custom_attributes: { age_range: '2-3 años', methodology: 'Montessori' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects service with too-short description', () => {
    const result = ServiceSchema.safeParse({
      name: 'Test',
      description: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('accepts service without optional fields', () => {
    const result = ServiceSchema.safeParse({
      name: 'Test Service',
      description: 'A valid service description',
    });
    expect(result.success).toBe(true);
  });
});

describe('EntityProfileSchema', () => {
  const validProfile = {
    business_name: 'Test Business',
    address: {
      street: 'Blvd. Test 123',
      city: 'Hermosillo',
      state: 'Sonora',
      postal_code: '83140',
      country: 'MX',
    },
    phone: '+52-662-123-4567',
    service_area: ['Hermosillo'],
    hours: [{ day: 'monday', open: '08:00', close: '15:00', closed: false }],
    services: [{ name: 'Service', description: 'A test service description' }],
  };

  it('accepts minimal valid profile', () => {
    const result = EntityProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('accepts profile with all optional fields', () => {
    const fullProfile = {
      ...validProfile,
      business_type_detail: 'Test detail',
      email: 'test@test.com',
      website: 'https://test.com',
      coordinates: { latitude: 29.0, longitude: -110.0 },
      founding_year: 2005,
      certifications: ['SEP'],
      awards: ['Best 2023'],
      team_size: '10 people',
      team_highlights: ['Expert 1'],
      review_count: 100,
      average_rating: 4.5,
      review_platforms: ['Google'],
      custom_attributes: { key: 'value' },
    };
    const result = EntityProfileSchema.safeParse(fullProfile);
    expect(result.success).toBe(true);
  });

  it('rejects profile without required business_name', () => {
    const { business_name, ...rest } = validProfile;
    const result = EntityProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects profile without services', () => {
    const { services, ...rest } = validProfile;
    const result = EntityProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects profile with empty service_area', () => {
    const result = EntityProfileSchema.safeParse({ ...validProfile, service_area: [] });
    expect(result.success).toBe(false);
  });

  it('rejects founding_year out of range', () => {
    const result = EntityProfileSchema.safeParse({ ...validProfile, founding_year: 1700 });
    expect(result.success).toBe(false);
  });

  it('rejects average_rating out of range', () => {
    const result = EntityProfileSchema.safeParse({ ...validProfile, average_rating: 6 });
    expect(result.success).toBe(false);
  });
});

// ============================================
// AEO: CITABLE ANSWER UNITS
// ============================================

describe('CitableAnswerUnitSchema', () => {
  const validUnit = {
    question: '¿Cuánto cuesta un kinder en Hermosillo?',
    answer: 'El Kinder Montessori Rayitos en zona poniente de Hermosillo tiene colegiaturas desde $3,500 hasta $5,200 mensuales. El programa maternal para niños de 2-3 años cuesta $3,500 al mes.',
    answer_word_count: 42,
    topic_tag: 'pricing',
    evidence_type: 'factual',
    source_field: 'entity_profile.services[*].price_range',
  };

  it('accepts valid answer unit', () => {
    const result = CitableAnswerUnitSchema.safeParse(validUnit);
    expect(result.success).toBe(true);
  });

  it('rejects answer shorter than 150 chars', () => {
    const result = CitableAnswerUnitSchema.safeParse({
      ...validUnit,
      answer: 'Too short answer that is under 150 characters.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects answer longer than 350 chars', () => {
    const result = CitableAnswerUnitSchema.safeParse({
      ...validUnit,
      answer: 'A'.repeat(351),
    });
    expect(result.success).toBe(false);
  });

  it('rejects word count below 40', () => {
    const result = CitableAnswerUnitSchema.safeParse({
      ...validUnit,
      answer_word_count: 39,
    });
    expect(result.success).toBe(false);
  });

  it('rejects word count above 80', () => {
    const result = CitableAnswerUnitSchema.safeParse({
      ...validUnit,
      answer_word_count: 81,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all evidence_type values', () => {
    for (const type of ['factual', 'descriptive', 'comparative', 'procedural']) {
      const result = CitableAnswerUnitSchema.safeParse({ ...validUnit, evidence_type: type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid evidence_type', () => {
    const result = CitableAnswerUnitSchema.safeParse({
      ...validUnit,
      evidence_type: 'opinion',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// GEO: EVIDENCE LAYER
// ============================================

describe('EvidenceClaimSchema', () => {
  it('accepts valid claim', () => {
    const result = EvidenceClaimSchema.safeParse({
      claim_text: 'Colegiaturas desde $3,500 mensuales',
      claim_type: 'entity_fact',
      source: 'entity_profile.services[0].price_range',
      verifiable: true,
      section_index: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all claim_type values', () => {
    for (const type of ['entity_fact', 'general_knowledge', 'statistical', 'testimonial', 'procedural']) {
      const result = EvidenceClaimSchema.safeParse({
        claim_text: 'A valid claim text',
        claim_type: type,
        source: 'test',
        verifiable: true,
        section_index: 0,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('EvidenceLayerSchema', () => {
  it('accepts valid evidence layer', () => {
    const result = EvidenceLayerSchema.safeParse({
      claims: [
        { claim_text: 'Valid claim here', claim_type: 'entity_fact', source: 'test', verifiable: true, section_index: 0 },
      ],
      total_claims: 1,
      verifiable_count: 1,
      verifiable_ratio: 1.0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty claims array', () => {
    const result = EvidenceLayerSchema.safeParse({
      claims: [],
      total_claims: 0,
      verifiable_count: 0,
      verifiable_ratio: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects verifiable_ratio > 1', () => {
    const result = EvidenceLayerSchema.safeParse({
      claims: [
        { claim_text: 'Valid claim here', claim_type: 'entity_fact', source: 'test', verifiable: true, section_index: 0 },
      ],
      total_claims: 1,
      verifiable_count: 1,
      verifiable_ratio: 1.1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// ENHANCED SECTION
// ============================================

describe('EnhancedSectionSchema', () => {
  it('accepts valid enhanced section', () => {
    const result = EnhancedSectionSchema.safeParse({
      heading_level: 'h2',
      heading_text: 'About Us',
      content: 'A substantive paragraph about the business with enough text to pass validation requirements.',
      chunk_id: 'about-us',
      is_self_contained: true,
      word_count: 15,
      topic_tags: ['about'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid chunk_id format', () => {
    const result = EnhancedSectionSchema.safeParse({
      heading_level: 'h2',
      heading_text: 'About Us',
      content: 'A substantive paragraph about the business with enough text.',
      chunk_id: 'About Us!', // invalid: uppercase, space, special chars
      is_self_contained: true,
      word_count: 15,
      topic_tags: ['about'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects section without topic_tags', () => {
    const result = EnhancedSectionSchema.safeParse({
      heading_level: 'h2',
      heading_text: 'About Us',
      content: 'A substantive paragraph about the business with enough text.',
      chunk_id: 'about-us',
      is_self_contained: true,
      word_count: 15,
      topic_tags: [],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// ENTITY CARD
// ============================================

describe('EntityCardSchema', () => {
  it('accepts valid entity card', () => {
    const result = EntityCardSchema.safeParse({
      business_name: 'Test Business',
      address_formatted: 'Street 123, City, State',
      phone: '1234567',
      services_highlighted: ['Service A', 'Service B'],
      hours_summary: 'Lun-Vie 9:00-18:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts card with optional rating_summary', () => {
    const result = EntityCardSchema.safeParse({
      business_name: 'Test',
      address_formatted: 'Address',
      phone: '123',
      services_highlighted: ['A'],
      hours_summary: 'Mon-Fri',
      rating_summary: '4.5/5 (50 reviews)',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// BUSINESS TYPE EXPANSION
// ============================================

describe('BusinessTypeSchema (expanded)', () => {
  it('accepts all new business types', () => {
    for (const type of ['education', 'healthcare', 'food_and_beverage', 'professional_services']) {
      const result = BusinessTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it('still accepts original business types', () => {
    for (const type of ['real_estate', 'hospitality', 'saas', 'local_services']) {
      const result = BusinessTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// CONTENT GUARD — NEW RISK FLAGS
// ============================================

describe('ContentGuardOutputSchema (new risk_flags)', () => {
  const base = {
    approved: false,
    reasons: ['Test reason'],
    suggested_fix: 'Fix this',
  };

  it('accepts new AEO/GEO risk flags', () => {
    const newFlags = [
      'answer_unit_too_short',
      'answer_unit_too_long',
      'low_evidence_ratio',
      'entity_data_mismatch',
      'chunk_not_self_contained',
      'missing_eeat_signals',
    ];

    for (const flag of newFlags) {
      const result = ContentGuardOutputSchema.safeParse({
        ...base,
        risk_flags: [flag],
      });
      expect(result.success).toBe(true);
    }
  });

  it('still accepts original risk flags', () => {
    const result = ContentGuardOutputSchema.safeParse({
      ...base,
      risk_flags: ['thin_content', 'hallucination_risk', 'eeat_weak'],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// OPPORTUNITY — AEO/GEO POTENTIAL
// ============================================

describe('OpportunitySchema (aeo/geo potential)', () => {
  const validOpp = {
    title: 'Test Opportunity',
    description: 'A test opportunity description',
    confidence: 'high',
    user_goals: ['Find information'],
    content_attributes_needed: ['pricing'],
    rationale: 'This opportunity exists because of demand',
  };

  it('accepts opportunity with aeo_potential and geo_potential', () => {
    const result = OpportunitySchema.safeParse({
      ...validOpp,
      aeo_potential: 'high',
      geo_potential: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('accepts opportunity without aeo/geo potential (backward compat)', () => {
    const result = OpportunitySchema.safeParse(validOpp);
    expect(result.success).toBe(true);
  });

  it('rejects invalid potential values', () => {
    const result = OpportunitySchema.safeParse({
      ...validOpp,
      aeo_potential: 'very_high',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// JSON-LD OUTPUT
// ============================================

describe('JsonLdOutputSchema', () => {
  it('accepts valid output with scripts and warnings', () => {
    const result = JsonLdOutputSchema.safeParse({
      scripts: [
        { type: 'FAQPage', jsonld: { '@type': 'FAQPage' } },
      ],
      warnings: ['Missing coordinates'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty scripts and warnings', () => {
    const result = JsonLdOutputSchema.safeParse({
      scripts: [],
      warnings: [],
    });
    expect(result.success).toBe(true);
  });
});
