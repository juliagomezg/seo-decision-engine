'use client';

import { useState } from 'react';
import { StepIndicator } from '@/components/step-indicator';
import {
  InputStep,
  GateAStep,
  GateBStep,
  ResultStep,
  type WorkflowStep,
  type BusinessType,
} from '@/components/workflow';
import type {
  IntentAnalysis,
  TemplateProposal,
  ContentDraft,
  OpportunityGuardOutput as OpportunityGuardResult,
  TemplateGuardOutput as TemplateGuardResult,
  ContentGuardOutput as ContentGuardResult,
} from '@/types/schemas';

export default function Page() {
  const [step, setStep] = useState<WorkflowStep>('input');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [selectedOpportunityIndex, setSelectedOpportunityIndex] = useState<number | null>(null);
  const [guardResult, setGuardResult] = useState<OpportunityGuardResult | null>(null);

  const [templateProposal, setTemplateProposal] = useState<TemplateProposal | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [guardTemplateResult, setGuardTemplateResult] = useState<TemplateGuardResult | null>(null);

  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [guardContentResult, setGuardContentResult] = useState<ContentGuardResult | null>(null);

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
    setGuardResult(null);

    try {
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      const validationRes = await fetch('/api/approve-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          intent_analysis: intentAnalysis,
          selected_opportunity_index: selectedOpportunityIndex,
          selected_opportunity: selectedOpportunity,
        }),
      });

      if (!validationRes.ok) {
        const errorData = await validationRes.json().catch(() => ({}));
        setError(errorData.error || 'Opportunity validation request failed');
        setLoading(false);
        return;
      }

      const validationData: OpportunityGuardResult = await validationRes.json();
      setGuardResult(validationData);

      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/propose-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_opportunity: selectedOpportunity,
          selected_opportunity_index: selectedOpportunityIndex,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Template proposal failed');
        setLoading(false);
        return;
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
    if (selectedTemplateIndex === null || !templateProposal || selectedOpportunityIndex === null || !intentAnalysis) {
      setError('You must select a template');
      return;
    }

    setLoading(true);
    setError(null);
    setGuardTemplateResult(null);
    setGuardContentResult(null);

    try {
      const selectedTemplate = templateProposal.templates[selectedTemplateIndex];
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      const validationRes = await fetch('/api/approve-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          opportunity: selectedOpportunity,
          selected_template_index: selectedTemplateIndex,
          template: {
            name: selectedTemplate.name,
            description: selectedTemplate.rationale,
            structure: selectedTemplate.sections.map((s) => s.heading_text),
          },
        }),
      });

      if (!validationRes.ok) {
        const errorData = await validationRes.json().catch(() => ({}));
        setError(errorData.error || 'Template validation request failed');
        setLoading(false);
        return;
      }

      const validationData: TemplateGuardResult = await validationRes.json();
      setGuardTemplateResult(validationData);

      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_template: selectedTemplate,
          selected_template_index: selectedTemplateIndex,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Content generation failed');
        setLoading(false);
        return;
      }

      const data: ContentDraft = await res.json();
      setContentDraft(data);

      const contentValidationRes = await fetch('/api/approve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          opportunity: selectedOpportunity,
          template: selectedTemplate,
          content: data,
        }),
      });

      if (!contentValidationRes.ok) {
        const errorData = await contentValidationRes.json().catch(() => ({}));
        setError(errorData.error || 'Content validation request failed');
        setLoading(false);
        return;
      }

      const contentValidationData: ContentGuardResult = await contentValidationRes.json();
      setGuardContentResult(contentValidationData);

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
    setGuardResult(null);
    setTemplateProposal(null);
    setSelectedTemplateIndex(null);
    setGuardTemplateResult(null);
    setContentDraft(null);
    setGuardContentResult(null);
    setError(null);
  };

  const handleOpportunityIndexChange = (index: number | null) => {
    setSelectedOpportunityIndex(index);
    setGuardContentResult(null);
  };

  const handleTemplateIndexChange = (index: number | null) => {
    setSelectedTemplateIndex(index);
    setGuardContentResult(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">SEO Decision Engine</h1>
          <p className="text-muted-foreground">AI suggests. Humans approve.</p>
        </header>

        <StepIndicator currentStep={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {step === 'input' && (
          <InputStep
            keyword={keyword}
            setKeyword={setKeyword}
            location={location}
            setLocation={setLocation}
            businessType={businessType}
            setBusinessType={setBusinessType}
            loading={loading}
            onAnalyze={handleAnalyzeIntent}
          />
        )}

        {step === 'gate_a' && intentAnalysis && (
          <GateAStep
            intentAnalysis={intentAnalysis}
            selectedOpportunityIndex={selectedOpportunityIndex}
            setSelectedOpportunityIndex={handleOpportunityIndexChange}
            guardResult={guardResult}
            setGuardResult={setGuardResult}
            loading={loading}
            onApprove={handleApproveOpportunity}
          />
        )}

        {step === 'gate_b' && templateProposal && (
          <GateBStep
            templateProposal={templateProposal}
            selectedTemplateIndex={selectedTemplateIndex}
            setSelectedTemplateIndex={handleTemplateIndexChange}
            guardTemplateResult={guardTemplateResult}
            setGuardTemplateResult={setGuardTemplateResult}
            keyword={keyword}
            businessType={businessType}
            intentAnalysis={intentAnalysis}
            loading={loading}
            onApprove={handleApproveTemplate}
          />
        )}

        {step === 'result' && contentDraft && (
          <ResultStep
            contentDraft={contentDraft}
            guardContentResult={guardContentResult}
            keyword={keyword}
            businessType={businessType}
            intentAnalysis={intentAnalysis}
            selectedOpportunityIndex={selectedOpportunityIndex}
            templateProposal={templateProposal}
            selectedTemplateIndex={selectedTemplateIndex}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
