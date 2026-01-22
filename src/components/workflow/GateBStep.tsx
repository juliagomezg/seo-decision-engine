'use client';

import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BusinessContextBar } from './BusinessContextBar';
import { ValidationFeedback } from './ValidationFeedback';
import type { GateBStepProps } from './types';

export function GateBStep({
  templateProposal,
  selectedTemplateIndex,
  setSelectedTemplateIndex,
  guardTemplateResult,
  setGuardTemplateResult,
  keyword,
  businessType,
  intentAnalysis,
  loading,
  onApprove,
}: GateBStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Gate B: Approve Template Structure</h2>
        <p className="text-muted-foreground">Select a content structure for your approved opportunity.</p>
      </div>

      <BusinessContextBar keyword={keyword} businessType={businessType} intentAnalysis={intentAnalysis} />

      <RadioGroup
        value={selectedTemplateIndex?.toString()}
        onValueChange={(value) => {
          setSelectedTemplateIndex(Number(value));
          setGuardTemplateResult(null);
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
        <ValidationFeedback
          title="Validation Failed"
          description="The selected template structure did not pass quality validation. Please select a different template or review the feedback below."
          reasons={guardTemplateResult.reasons}
          riskFlags={guardTemplateResult.risk_flags}
          suggestedFix={guardTemplateResult.suggested_fix}
          variant="error"
        />
      )}

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onApprove} disabled={selectedTemplateIndex === null || loading}>
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
  );
}
