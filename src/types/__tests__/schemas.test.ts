import { describe, it, expect } from 'vitest';
import {
  KeywordInputSchema,
  OpportunitySchema,
  IntentAnalysisSchema,
} from '../schemas';

describe('KeywordInputSchema', () => {
  it('validates valid input', () => {
    const result = KeywordInputSchema.safeParse({
      keyword: 'best crm software',
      location: 'US',
      business_type: 'saas',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty keyword', () => {
    const result = KeywordInputSchema.safeParse({ keyword: '' });
    expect(result.success).toBe(false);
  });

  it('rejects keyword that is too long', () => {
    const result = KeywordInputSchema.safeParse({
      keyword: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from keyword', () => {
    const result = KeywordInputSchema.safeParse({
      keyword: '  best crm software  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyword).toBe('best crm software');
    }
  });

  it('accepts valid business types', () => {
    const validTypes = ['real_estate', 'hospitality', 'saas', 'local_services'];
    for (const type of validTypes) {
      const result = KeywordInputSchema.safeParse({
        keyword: 'test',
        business_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid business type', () => {
    const result = KeywordInputSchema.safeParse({
      keyword: 'test',
      business_type: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });
});

describe('OpportunitySchema', () => {
  const validOpportunity = {
    title: 'CRM Comparison Guide',
    description: 'A comprehensive guide comparing top CRM solutions',
    confidence: 'high',
    user_goals: ['compare options'],
    content_attributes_needed: ['pricing tables'],
    rationale: 'Users searching for best CRM want to compare options',
  };

  it('validates valid opportunity', () => {
    const result = OpportunitySchema.safeParse(validOpportunity);
    expect(result.success).toBe(true);
  });

  it('rejects empty user_goals', () => {
    const result = OpportunitySchema.safeParse({
      ...validOpportunity,
      user_goals: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid confidence level', () => {
    const result = OpportunitySchema.safeParse({
      ...validOpportunity,
      confidence: 'very_high',
    });
    expect(result.success).toBe(false);
  });
});

describe('IntentAnalysisSchema', () => {
  const validOpportunity = {
    title: 'CRM Comparison Guide',
    description: 'A comprehensive guide comparing top CRM solutions',
    confidence: 'high',
    user_goals: ['compare options'],
    content_attributes_needed: ['pricing tables'],
    rationale: 'Users searching for best CRM want to compare options',
  };

  it('requires at least 5 opportunities', () => {
    const result = IntentAnalysisSchema.safeParse({
      query_classification: 'commercial',
      primary_user_goals: ['compare'],
      opportunities: [validOpportunity], // only 1
      metadata: {
        model: 'test',
        prompt_version: 'v1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
    expect(result.success).toBe(false);
  });

  it('validates query classification enum', () => {
    const validClassifications = ['informational', 'transactional', 'navigational', 'commercial'];
    for (const classification of validClassifications) {
      const result = IntentAnalysisSchema.safeParse({
        query_classification: classification,
        primary_user_goals: ['test'],
        opportunities: Array(5).fill(validOpportunity),
        metadata: {
          model: 'test',
          prompt_version: 'v1.0.0',
          timestamp: new Date().toISOString(),
        },
      });
      expect(result.success).toBe(true);
    }
  });
});
