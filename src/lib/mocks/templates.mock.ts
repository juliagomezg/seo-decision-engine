import { TemplateProposal } from '@/types/schemas';

export const templatesMock: TemplateProposal = {
  templates: [
    {
      name: 'Comparison-Heavy Template',
      slug: 'comparison-template',
      title: 'Best Options Compared',
      h1: 'Compare the Best Options for Your Business',
      sections: [
        {
          heading_level: 'h2',
          heading_text: 'Overview',
          content_type: 'text',
          rationale: 'Introduces the topic and sets context'
        },
        {
          heading_level: 'h2',
          heading_text: 'Feature Comparison',
          content_type: 'comparison',
          rationale: 'Users want side-by-side feature comparison'
        },
        {
          heading_level: 'h2',
          heading_text: 'Pricing Breakdown',
          content_type: 'table',
          rationale: 'Pricing transparency is a key decision factor'
        }
      ],
      faqs: [
        {
          question: 'Which option is best for small businesses?',
          answer_guidance: 'Explain based on pricing and simplicity'
        },
        {
          question: 'Are there hidden costs?',
          answer_guidance: 'Address transparency and billing'
        },
        {
          question: 'Can I switch later?',
          answer_guidance: 'Explain flexibility and contracts'
        }
      ],
      cta_suggestion: {
        text: 'Compare Options Now',
        position: 'bottom'
      },
      internal_link_suggestions: [
        'pricing',
        'features',
        'use-cases'
      ],
      schema_org_types: ['FAQPage'],
      rationale: 'Optimized for users comparing multiple providers'
    },
    {
      name: 'Pricing-Focused Template',
      slug: 'pricing-template',
      title: 'Pricing Explained',
      h1: 'Understand Pricing Before You Decide',
      sections: [
        {
          heading_level: 'h2',
          heading_text: 'How Pricing Works',
          content_type: 'text',
          rationale: 'Explains pricing model clearly'
        },
        {
          heading_level: 'h2',
          heading_text: 'Plans and Costs',
          content_type: 'table',
          rationale: 'Users want clear pricing tables'
        },
        {
          heading_level: 'h2',
          heading_text: 'Is It Worth the Cost?',
          content_type: 'text',
          rationale: 'Addresses ROI concerns'
        }
      ],
      faqs: [
        {
          question: 'Is there a free trial?',
          answer_guidance: 'Explain trial availability'
        },
        {
          question: 'Can I cancel anytime?',
          answer_guidance: 'Explain cancellation terms'
        },
        {
          question: 'Are discounts available?',
          answer_guidance: 'Mention promotions or bulk pricing'
        }
      ],
      cta_suggestion: {
        text: 'See Pricing Details',
        position: 'middle'
      },
      internal_link_suggestions: [
        'comparison',
        'faq'
      ],
      schema_org_types: ['FAQPage'],
      rationale: 'Designed for cost-conscious users'
    }
  ],
  metadata: {
    model: 'mock',
    prompt_version: 'v1.0.0',
    timestamp: new Date().toISOString()
  }
};
