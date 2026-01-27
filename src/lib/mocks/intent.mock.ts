import { IntentAnalysis } from '@/types/schemas';

export const intentMock: IntentAnalysis = {
  query_classification: 'commercial',
  primary_user_goals: [
    'Compare options',
    'Understand pricing',
    'Evaluate fit for business'
  ],
  opportunities: [
    {
      title: 'Comparison-focused landing page',
      description: 'Users want to compare providers side by side.',
      confidence: 'high',
      user_goals: ['Compare features', 'Evaluate pricing'],
      content_attributes_needed: ['comparison', 'pricing', 'features'],
      rationale: 'SERP results show listicles and comparison tables.',
      risk_indicators: []
    },
    {
      title: 'Pricing explainer page',
      description: 'Users want transparent pricing details.',
      confidence: 'medium',
      user_goals: ['Understand cost'],
      content_attributes_needed: ['pricing', 'faq'],
      rationale: 'Many queries include "cost" and "pricing".',
      risk_indicators: ['seasonal_query']
    },
    {
      title: 'Use-case focused page',
      description: 'Users want to know if this fits their specific use case.',
      confidence: 'medium',
      user_goals: ['Evaluate fit'],
      content_attributes_needed: ['use_cases', 'examples'],
      rationale: 'Use-case modifiers appear frequently in queries.',
      risk_indicators: ['high_competition']
    },
    {
      title: 'Feature breakdown page',
      description: 'Users want to understand key features in detail.',
      confidence: 'low',
      user_goals: ['Learn features'],
      content_attributes_needed: ['features', 'details'],
      rationale: 'Some SERP results focus on deep feature explanations.',
      risk_indicators: ['thin_content', 'generic_angle']
    },
    {
      title: 'FAQ-heavy page',
      description: 'Users have many pre-purchase questions.',
      confidence: 'low',
      user_goals: ['Resolve doubts'],
      content_attributes_needed: ['faq'],
      rationale: 'People ask boxes dominate SERP.',
      risk_indicators: ['low_volume', 'monetization_weak']
    }
  ],
  metadata: {
    model: 'mock',
    prompt_version: 'v1.0.0',
    timestamp: new Date().toISOString()
  }
};
