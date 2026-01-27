import { describe, it, expect } from 'vitest';
import {
  KeywordInputSchema,
  OpportunitySchema,
  IntentAnalysisSchema,
  OpportunityGuardOutputSchema,
  TemplateGuardOutputSchema,
  ContentGuardOutputSchema,
  RiskIndicatorSchema,
} from '../schemas';

describe('KeywordInputSchema', () => {
  it('accepts valid input with all fields', () => {
    const input = {
      keyword: 'best crm software',
      location: 'United States',
      business_type: 'saas',
    };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with only keyword', () => {
    const input = { keyword: 'crm' };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from keyword', () => {
    const input = { keyword: '  best crm  ' };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyword).toBe('best crm');
    }
  });

  it('rejects empty keyword', () => {
    const input = { keyword: '' };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects keyword with only whitespace', () => {
    const input = { keyword: '   ' };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects keyword over 200 chars', () => {
    const input = { keyword: 'a'.repeat(201) };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid business_type', () => {
    const input = { keyword: 'crm', business_type: 'invalid_type' };
    const result = KeywordInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('RiskIndicatorSchema', () => {
  it('accepts all valid risk indicators', () => {
    const validIndicators = [
      'thin_content',
      'generic_angle',
      'high_competition',
      'low_volume',
      'seasonal_query',
      'intent_mismatch',
      'monetization_weak',
      'eeat_risk',
    ];
    validIndicators.forEach((indicator) => {
      const result = RiskIndicatorSchema.safeParse(indicator);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid risk indicator', () => {
    const result = RiskIndicatorSchema.safeParse('not_a_valid_risk');
    expect(result.success).toBe(false);
  });
});

describe('OpportunitySchema', () => {
  const validOpportunity = {
    title: 'CRM Comparison Guide',
    description: 'A comprehensive guide to comparing CRM software options.',
    confidence: 'high',
    user_goals: ['compare features', 'find pricing'],
    content_attributes_needed: ['comparison', 'pricing'],
    rationale: 'SERP results show high demand for comparison content.',
    risk_indicators: ['high_competition'],
  };

  it('accepts valid opportunity', () => {
    const result = OpportunitySchema.safeParse(validOpportunity);
    expect(result.success).toBe(true);
  });

  it('accepts opportunity without risk_indicators (defaults to empty)', () => {
    const { risk_indicators, ...withoutRisk } = validOpportunity;
    const result = OpportunitySchema.safeParse(withoutRisk);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.risk_indicators).toEqual([]);
    }
  });

  it('rejects opportunity with empty user_goals', () => {
    const invalid = { ...validOpportunity, user_goals: [] };
    const result = OpportunitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects opportunity with short description', () => {
    const invalid = { ...validOpportunity, description: 'short' };
    const result = OpportunitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid confidence level', () => {
    const invalid = { ...validOpportunity, confidence: 'very_high' };
    const result = OpportunitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('IntentAnalysisSchema', () => {
  const createOpportunity = (index: number) => ({
    title: `Opportunity ${index}`,
    description: `Description for opportunity ${index} with enough length.`,
    confidence: 'medium' as const,
    user_goals: ['goal 1'],
    content_attributes_needed: ['attr 1'],
    rationale: `Rationale for opportunity ${index} with enough length.`,
    risk_indicators: [],
  });

  const validIntentAnalysis = {
    query_classification: 'commercial',
    primary_user_goals: ['compare options', 'find best fit'],
    opportunities: Array.from({ length: 5 }, (_, i) => createOpportunity(i)),
    metadata: {
      model: 'mixtral-8x7b-32768',
      prompt_version: 'v1.0.0',
      timestamp: '2026-01-26T10:00:00Z',
    },
  };

  it('accepts valid intent analysis with 5 opportunities', () => {
    const result = IntentAnalysisSchema.safeParse(validIntentAnalysis);
    expect(result.success).toBe(true);
  });

  it('accepts valid intent analysis with 10 opportunities', () => {
    const input = {
      ...validIntentAnalysis,
      opportunities: Array.from({ length: 10 }, (_, i) => createOpportunity(i)),
    };
    const result = IntentAnalysisSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects intent analysis with less than 5 opportunities', () => {
    const input = {
      ...validIntentAnalysis,
      opportunities: Array.from({ length: 4 }, (_, i) => createOpportunity(i)),
    };
    const result = IntentAnalysisSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects intent analysis with more than 10 opportunities', () => {
    const input = {
      ...validIntentAnalysis,
      opportunities: Array.from({ length: 11 }, (_, i) => createOpportunity(i)),
    };
    const result = IntentAnalysisSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid query_classification', () => {
    const input = { ...validIntentAnalysis, query_classification: 'invalid' };
    const result = IntentAnalysisSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid prompt_version format', () => {
    const input = {
      ...validIntentAnalysis,
      metadata: { ...validIntentAnalysis.metadata, prompt_version: '1.0.0' },
    };
    const result = IntentAnalysisSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('Guard Output Schemas', () => {
  describe('OpportunityGuardOutputSchema', () => {
    it('accepts approved result', () => {
      const result = OpportunityGuardOutputSchema.safeParse({
        approved: true,
        reasons: ['Strong alignment with user intent'],
        risk_flags: [],
        suggested_fix: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts rejected result with risk flags', () => {
      const result = OpportunityGuardOutputSchema.safeParse({
        approved: false,
        reasons: ['Too generic', 'Overlaps with existing content'],
        risk_flags: ['generic', 'duplicate_risk'],
        suggested_fix: 'Consider a more specific angle',
      });
      expect(result.success).toBe(true);
    });

    it('rejects result without reasons', () => {
      const result = OpportunityGuardOutputSchema.safeParse({
        approved: true,
        reasons: [],
        risk_flags: [],
        suggested_fix: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TemplateGuardOutputSchema', () => {
    it('accepts valid template guard output', () => {
      const result = TemplateGuardOutputSchema.safeParse({
        approved: false,
        reasons: ['Structure is too generic'],
        risk_flags: ['generic_structure', 'thin_content_risk'],
        suggested_fix: 'Add more specific sections',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid risk flag', () => {
      const result = TemplateGuardOutputSchema.safeParse({
        approved: true,
        reasons: ['Good fit'],
        risk_flags: ['invalid_flag'],
        suggested_fix: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ContentGuardOutputSchema', () => {
    it('accepts valid content guard output', () => {
      const result = ContentGuardOutputSchema.safeParse({
        approved: true,
        reasons: ['Content meets E-E-A-T standards'],
        risk_flags: [],
        suggested_fix: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts content guard with hallucination risk flag', () => {
      const result = ContentGuardOutputSchema.safeParse({
        approved: false,
        reasons: ['Contains unverifiable claims'],
        risk_flags: ['hallucination_risk', 'eeat_weak'],
        suggested_fix: 'Add citations or remove speculative claims',
      });
      expect(result.success).toBe(true);
    });
  });
});
