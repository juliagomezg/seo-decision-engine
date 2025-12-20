'use client';

import { useState } from 'react';

type Opportunity = {
  title: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  user_goals: string[];
  content_attributes_needed: string[];
  rationale: string;
};

type IntentAnalysis = {
  query_classification: 'informational' | 'transactional' | 'navigational' | 'commercial';
  primary_user_goals: string[];
  opportunities: Opportunity[];
  metadata: {
    model: string;
    prompt_version: string;
    timestamp: string;
  };
};

type TemplateSection = {
  heading_level: 'h2' | 'h3';
  heading_text: string;
  content_type: 'text' | 'list' | 'table' | 'comparison' | 'faq';
  rationale: string;
};

type TemplateStructure = {
  name: string;
  slug: string;
  title: string;
  h1: string;
  sections: TemplateSection[];
  faqs: Array<{ question: string; answer_guidance: string }>;
  cta_suggestion: { text: string; position: 'top' | 'middle' | 'bottom' };
  internal_link_suggestions: string[];
  schema_org_types: string[];
  rationale: string;
};

type TemplateProposal = {
  templates: TemplateStructure[];
  metadata: {
    model: string;
    prompt_version: string;
    timestamp: string;
  };
};

type GeneratedSection = {
  heading_level: 'h2' | 'h3';
  heading_text: string;
  content: string;
};

type ContentDraft = {
  title: string;
  slug: string;
  h1: string;
  meta_description: string;
  sections: GeneratedSection[];
  faqs: Array<{ question: string; answer: string }>;
  cta: { text: string; position: 'top' | 'middle' | 'bottom' };
  metadata: {
    model: string;
    prompt_version: string;
    timestamp: string;
    word_count: number;
  };
};

export default function Page() {
  const [step, setStep] = useState<'input' | 'gate_a' | 'gate_b' | 'result'>('input');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState<'' | 'real_estate' | 'hospitality' | 'saas' | 'local_services'>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [selectedOpportunityIndex, setSelectedOpportunityIndex] = useState<number | null>(null);

  const [templateProposal, setTemplateProposal] = useState<TemplateProposal | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);

  const handleAnalyzeIntent = async () => {
    if (!keyword.trim()) {
      setError('Keyword is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Intent analysis failed');
      }

      const data: IntentAnalysis = await res.json();
      setIntentAnalysis(data);
      setStep('gate_a');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOpportunity = async () => {
    if (selectedOpportunityIndex === null || !intentAnalysis) {
      setError('You must select an opportunity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/propose-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_opportunity: intentAnalysis.opportunities[selectedOpportunityIndex],
          selected_opportunity_index: selectedOpportunityIndex,
        }),
      });

      if (!res.ok) {
        throw new Error('Template proposal failed');
      }

      const data: TemplateProposal = await res.json();
      setTemplateProposal(data);
      setStep('gate_b');
      setSelectedTemplateIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTemplate = async () => {
    if (selectedTemplateIndex === null || !templateProposal) {
      setError('You must select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_template: templateProposal.templates[selectedTemplateIndex],
          selected_template_index: selectedTemplateIndex,
        }),
      });

      if (!res.ok) {
        throw new Error('Content generation failed');
      }

      const data: ContentDraft = await res.json();
      setContentDraft(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setKeyword('');
    setLocation('');
    setBusinessType('');
    setIntentAnalysis(null);
    setSelectedOpportunityIndex(null);
    setTemplateProposal(null);
    setSelectedTemplateIndex(null);
    setContentDraft(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">SEO Decision Engine</h1>
          <p className="text-sm text-gray-600 mt-1">AI suggests. Humans approve.</p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {step === 'input' && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Step 1: Intent Analysis</h2>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword or topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., best CRM software"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={loading}
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., United States, New York, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={loading}
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type (optional)
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={loading}
            >
              <option value="">Select business type</option>
              <option value="real_estate">Real Estate</option>
              <option value="hospitality">Hospitality</option>
              <option value="saas">SaaS</option>
              <option value="local_services">Local Services</option>
            </select>

            <button
              onClick={handleAnalyzeIntent}
              disabled={loading || !keyword.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {loading ? 'AI analyzing intent (human approval required)...' : 'Analyze Intent'}
            </button>
          </div>
        )}

        {step === 'gate_a' && intentAnalysis && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gate A: Approve Opportunity</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Classification:</strong> {intentAnalysis.query_classification}
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-3">
              Select exactly ONE opportunity to pursue:
            </p>

            <div className="space-y-3 mb-6">
              {intentAnalysis.opportunities.map((opp, index) => (
                <label
                  key={index}
                  className={`block border rounded p-4 cursor-pointer transition ${
                    selectedOpportunityIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="opportunity"
                      checked={selectedOpportunityIndex === index}
                      onChange={() => setSelectedOpportunityIndex(index)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            opp.confidence === 'high'
                              ? 'bg-green-100 text-green-800'
                              : opp.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {opp.confidence}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opp.description}</p>
                      <p className="text-xs text-gray-500 italic">
                        <strong>Why this exists:</strong> {opp.rationale}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleApproveOpportunity}
              disabled={loading || selectedOpportunityIndex === null}
              className="px-6 py-2 bg-green-600 text-white rounded font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700"
            >
              {loading ? 'AI proposing templates (human approval required)...' : 'Approve Opportunity & Propose Templates'}
            </button>
          </div>
        )}

        {step === 'gate_b' && templateProposal && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gate B: Approve Template</h2>

            <p className="text-sm font-medium text-gray-700 mb-3">
              Select exactly ONE template structure:
            </p>

            <div className="space-y-4 mb-6">
              {templateProposal.templates.map((template, index) => (
                <label
                  key={index}
                  className={`block border rounded p-4 cursor-pointer transition ${
                    selectedTemplateIndex === index
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="template"
                      checked={selectedTemplateIndex === index}
                      onChange={() => setSelectedTemplateIndex(index)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.rationale}</p>

                      <div className="bg-gray-50 p-3 rounded mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">H1: {template.h1}</p>
                        <p className="text-xs text-gray-600">
                          <strong>Sections:</strong> {template.sections.length} | <strong>FAQs:</strong> {template.faqs.length}
                        </p>
                      </div>

                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 font-medium">
                          View section outline
                        </summary>
                        <ul className="mt-2 ml-4 space-y-1 text-gray-600">
                          {template.sections.map((section, i) => (
                            <li key={i}>
                              {section.heading_level === 'h2' ? '■' : '□'} {section.heading_text}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleApproveTemplate}
              disabled={loading || selectedTemplateIndex === null}
              className="px-6 py-2 bg-green-600 text-white rounded font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700"
            >
              {loading ? 'AI generating content (human approval required)...' : 'Approve Template & Generate Content'}
            </button>
          </div>
        )}

        {step === 'result' && contentDraft && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Final Content Draft</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Start New Analysis
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Generated after two human approval gates.
            </p>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                <strong>Meta Description:</strong> {contentDraft.meta_description}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Word count: {contentDraft.metadata.word_count} | Model: {contentDraft.metadata.model}
              </p>
            </div>

            <article className="prose max-w-none">
              <h1 className="text-3xl font-bold mb-6">{contentDraft.h1}</h1>

              {contentDraft.sections.map((section, index) => (
                <div key={index} className="mb-6">
                  {section.heading_level === 'h2' ? (
                    <h2 className="text-2xl font-semibold mb-3">{section.heading_text}</h2>
                  ) : (
                    <h3 className="text-xl font-semibold mb-2">{section.heading_text}</h3>
                  )}
                  <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
                </div>
              ))}

              <div className="mt-8 pt-6 border-t">
                <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {contentDraft.faqs.map((faq, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded text-center">
                <p className="font-semibold text-gray-900">{contentDraft.cta.text}</p>
                <p className="text-xs text-gray-500 mt-1">CTA Position: {contentDraft.cta.position}</p>
              </div>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
