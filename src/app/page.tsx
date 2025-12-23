'use client';

import { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StepIndicator } from '@/components/step-indicator';
import { ConfidenceBadge } from '@/components/confidence-badge';

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
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Intent Analysis</CardTitle>
              <CardDescription>
                Enter your target keyword to analyze search intent and discover opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword *</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., best CRM software"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., United States, New York, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-type">Business Type (optional)</Label>
                <Select value={businessType} onValueChange={(value: any) => setBusinessType(value)} disabled={loading}>
                  <SelectTrigger id="business-type" className="w-full">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="local_services">Local Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleAnalyzeIntent}
                disabled={!keyword.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI analyzing intent (human approval required)…
                  </>
                ) : (
                  'Analyze Intent'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'gate_a' && intentAnalysis && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-2">Gate A: Approve Opportunity</h2>
              <p className="text-muted-foreground">Review AI-suggested opportunities and select one to proceed.</p>
              <div className="mt-4 p-3 bg-muted rounded-md inline-block">
                <p className="text-sm text-muted-foreground">
                  <strong>Classification:</strong> {intentAnalysis.query_classification}
                </p>
              </div>
            </div>

            <RadioGroup
              value={selectedOpportunityIndex?.toString()}
              onValueChange={(value) => setSelectedOpportunityIndex(Number(value))}
              className="grid gap-4 md:grid-cols-2"
            >
              {intentAnalysis.opportunities.map((opportunity, index) => (
                <Label key={index} htmlFor={`opportunity-${index}`} className="cursor-pointer">
                  <Card
                    className={`h-full transition-all ${
                      selectedOpportunityIndex === index
                        ? 'ring-2 ring-primary'
                        : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={index.toString()} id={`opportunity-${index}`} className="mt-1" />
                          <CardTitle className="text-base font-medium leading-snug">{opportunity.title}</CardTitle>
                        </div>
                        <ConfidenceBadge confidence={opportunity.confidence} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pl-10">
                      <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Why this exists: </span>
                        <span className="text-muted-foreground">{opportunity.rationale}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleApproveOpportunity} disabled={selectedOpportunityIndex === null || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI proposing templates (human approval required)…
                  </>
                ) : (
                  'Approve Opportunity & Propose Templates'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'gate_b' && templateProposal && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-2">Gate B: Approve Template Structure</h2>
              <p className="text-muted-foreground">Select a content structure for your approved opportunity.</p>
            </div>

            <RadioGroup
              value={selectedTemplateIndex?.toString()}
              onValueChange={(value) => setSelectedTemplateIndex(Number(value))}
              className="grid gap-4 md:grid-cols-3"
            >
              {templateProposal.templates.map((template, index) => (
                <Label key={index} htmlFor={`template-${index}`} className="cursor-pointer">
                  <Card
                    className={`h-full transition-all ${
                      selectedTemplateIndex === index ? 'ring-2 ring-primary' : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={index.toString()} id={`template-${index}`} className="mt-1" />
                        <div>
                          <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {template.sections.length} sections • {template.faqs.length} FAQs
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pl-10 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">H1</p>
                        <p className="text-sm text-foreground">{template.h1}</p>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Rationale: </span>
                        <span className="text-muted-foreground">{template.rationale}</span>
                      </div>
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronDown className="w-4 h-4" />
                          View section outline
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {template.sections.map((section, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground/60">{section.heading_level === 'h2' ? '■' : '□'}</span>
                                {section.heading_text}
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleApproveTemplate} disabled={selectedTemplateIndex === null || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI generating content (human approval required)…
                  </>
                ) : (
                  'Approve Template & Generate Content'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && contentDraft && (
          <div className="space-y-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
              <strong>✓ Generated after two human approval gates.</strong> This content was created only after you
              approved both the opportunity and template structure.
            </div>

            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">H1</p>
                  <CardTitle className="text-2xl">{contentDraft.h1}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta Description</p>
                <p className="text-muted-foreground">{contentDraft.meta_description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Word count: {contentDraft.metadata.word_count} | Model: {contentDraft.metadata.model}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Content Sections</h3>
              {contentDraft.sections.map((section, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{section.heading_text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {contentDraft.faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-xl">Call to Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/90 mb-2">{contentDraft.cta.text}</p>
                <p className="text-xs text-primary-foreground/70">CTA Position: {contentDraft.cta.position}</p>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleReset}>
                Start New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
