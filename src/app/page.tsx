'use client';

import { useState } from 'react';
import { Loader2, ChevronDown, Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StepIndicator } from '@/components/step-indicator';
import { ConfidenceBadge } from '@/components/confidence-badge';
import type {
  IntentAnalysis,
  TemplateProposal,
  ContentDraft,
  OpportunityGuardOutput as OpportunityGuardResult,
  TemplateGuardOutput as TemplateGuardResult,
  ContentGuardOutput as ContentGuardResult,
} from '@/types/schemas';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  saas: 'SaaS',
  local_services: 'Local Services',
};

const INTENT_LABELS: Record<string, string> = {
  commercial: 'Commercial',
  informational: 'Informational',
  navigational: 'Navigational',
  transactional: 'Transactional',
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
  const [guardResult, setGuardResult] = useState<OpportunityGuardResult | null>(null);

  const [templateProposal, setTemplateProposal] = useState<TemplateProposal | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [guardTemplateResult, setGuardTemplateResult] = useState<TemplateGuardResult | null>(null);

  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [guardContentResult, setGuardContentResult] = useState<ContentGuardResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const BusinessContextBar = () => (
    <div className="bg-muted/50 border rounded-lg px-4 py-3 mb-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="font-medium text-foreground">Keyword:</span>{' '}
          <span className="text-muted-foreground">{keyword}</span>
        </div>
        <div>
          <span className="font-medium text-foreground">Business Type:</span>{' '}
          <span className="text-muted-foreground">
            {businessType ? BUSINESS_TYPE_LABELS[businessType] : 'Not specified'}
          </span>
        </div>
        {intentAnalysis && (
          <div>
            <span className="font-medium text-foreground">Intent:</span>{' '}
            <span className="text-muted-foreground">{INTENT_LABELS[intentAnalysis.query_classification]}</span>
          </div>
        )}
      </div>
    </div>
  );

  const generateMarkdown = () => {
    if (!contentDraft) return '';

    let markdown = `# ${contentDraft.h1}\n\n`;
    markdown += `> ${contentDraft.meta_description}\n\n`;

    contentDraft.sections.forEach((section) => {
      const headingPrefix = section.heading_level === 'h2' ? '## ' : '### ';
      markdown += `${headingPrefix}${section.heading_text}\n\n`;
      markdown += `${section.content}\n\n`;
    });

    if (contentDraft.faqs.length > 0) {
      markdown += `## Frequently Asked Questions\n\n`;
      contentDraft.faqs.forEach((faq) => {
        markdown += `### ${faq.question}\n\n`;
        markdown += `${faq.answer}\n\n`;
      });
    }

    markdown += `---\n\n`;
    markdown += `**${contentDraft.cta.text}**\n`;

    return markdown;
  };

  const handleCopyContent = async () => {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadContent = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyword?.replace(/\s+/g, '-') || 'seo-content'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 1500);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 1500);
  };

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

      // LAYER 2: Validate selected opportunity before proceeding
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

      // If validation rejected, stop here (guardResult will display feedback)
      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      // Validation passed - proceed to template generation
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
    setGuardContentResult(null); // Clear content validation before regenerating

    try {
      const selectedTemplate = templateProposal.templates[selectedTemplateIndex];
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      // LAYER 3: Validate template structure before content generation
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
            structure: selectedTemplate.sections.map(s => s.heading_text),
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

      // If validation rejected, stop here (guardTemplateResult will display feedback)
      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      // Validation passed - proceed to content generation
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

      // LAYER 4: Validate generated content quality (SOFT GATE)
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

      // Always move to result step (soft gate - content is visible regardless)
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
                <Select value={businessType} onValueChange={(value) => setBusinessType(value as typeof businessType)} disabled={loading}>
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
              onValueChange={(value) => {
                setSelectedOpportunityIndex(Number(value));
                setGuardResult(null); // Clear previous validation when selection changes
                setGuardContentResult(null); // Clear content validation (prevents stale state)
              }}
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

            {guardResult && !guardResult.approved && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Validation Failed
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    The selected opportunity did not pass quality validation. Please select a different opportunity or review the feedback below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-2">Reasons:</p>
                    <ul className="space-y-1">
                      {guardResult.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {guardResult.risk_flags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-2">Risk Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {guardResult.risk_flags.map((flag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {guardResult.suggested_fix && (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">Suggested Fix:</p>
                      <p className="text-sm text-red-800 bg-red-100 rounded px-3 py-2">{guardResult.suggested_fix}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleApproveOpportunity} disabled={selectedOpportunityIndex === null || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating opportunity…
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

            <BusinessContextBar />

            <RadioGroup
              value={selectedTemplateIndex?.toString()}
              onValueChange={(value) => {
                setSelectedTemplateIndex(Number(value));
                setGuardTemplateResult(null); // Clear previous validation when selection changes
                setGuardContentResult(null); // Clear content validation (prevents stale state)
              }}
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

            {guardTemplateResult && !guardTemplateResult.approved && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Validation Failed
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    The selected template structure did not pass quality validation. Please select a different template or review the feedback below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-2">Reasons:</p>
                    <ul className="space-y-1">
                      {guardTemplateResult.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {guardTemplateResult.risk_flags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-2">Risk Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {guardTemplateResult.risk_flags.map((flag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {guardTemplateResult.suggested_fix && (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">Suggested Fix:</p>
                      <p className="text-sm text-red-800 bg-red-100 rounded px-3 py-2">{guardTemplateResult.suggested_fix}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleApproveTemplate} disabled={selectedTemplateIndex === null || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating template structure…
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

            {guardContentResult && !guardContentResult.approved && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-900 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Content needs revision
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    The generated content did not pass quality validation. Review the feedback below and regenerate or manually improve the content before exporting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-2">Reasons:</p>
                    <ul className="space-y-1">
                      {guardContentResult.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {guardContentResult.risk_flags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-yellow-900 mb-2">Risk Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {guardContentResult.risk_flags.map((flag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-200 text-yellow-900"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {guardContentResult.suggested_fix && (
                    <div>
                      <p className="text-sm font-medium text-yellow-900 mb-1">Suggested Fix:</p>
                      <p className="text-sm text-yellow-800 bg-yellow-100 rounded px-3 py-2">{guardContentResult.suggested_fix}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {guardContentResult && guardContentResult.approved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
                <strong>✓ Content approved.</strong> This content has passed quality validation and is ready for export.
              </div>
            )}

            <BusinessContextBar />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Decision Log
                  <span className="text-xs text-muted-foreground font-normal">(Human approved)</span>
                </CardTitle>
                <CardDescription>Your approved path through the decision engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-semibold">✓</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Gate A approved</p>
                    <p className="text-sm text-muted-foreground">
                      {intentAnalysis && selectedOpportunityIndex !== null
                        ? intentAnalysis.opportunities[selectedOpportunityIndex]?.title ?? '—'
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-semibold">✓</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Gate B approved</p>
                    <p className="text-sm text-muted-foreground">
                      {templateProposal && selectedTemplateIndex !== null
                        ? templateProposal.templates[selectedTemplateIndex]?.name ?? '—'
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">H1</p>
                    <CardTitle className="text-2xl">{contentDraft.h1}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyContent}
                      disabled={!guardContentResult?.approved}
                      title={guardContentResult?.approved ? "Copy content to clipboard" : "Fix content issues before exporting"}
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied ✓
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadContent}
                      disabled={!guardContentResult?.approved}
                      title={guardContentResult?.approved ? "Download as Markdown file" : "Fix content issues before exporting"}
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Downloaded ✓
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
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
