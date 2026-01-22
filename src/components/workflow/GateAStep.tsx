'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { ValidationFeedback } from './ValidationFeedback';
import type { GateAStepProps } from './types';

export function GateAStep({
  intentAnalysis,
  selectedOpportunityIndex,
  setSelectedOpportunityIndex,
  guardResult,
  setGuardResult,
  loading,
  onApprove,
}: GateAStepProps) {
  return (
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
          setGuardResult(null);
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        {intentAnalysis.opportunities.map((opportunity, index) => (
          <Label key={index} htmlFor={`opportunity-${index}`} className="cursor-pointer">
            <Card
              className={`h-full transition-all ${selectedOpportunityIndex === index
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
        <ValidationFeedback
          title="Validation Failed"
          description="The selected opportunity did not pass quality validation. Please select a different opportunity or review the feedback below."
          reasons={guardResult.reasons}
          riskFlags={guardResult.risk_flags}
          suggestedFix={guardResult.suggested_fix}
          variant="error"
        />
      )}

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onApprove} disabled={selectedOpportunityIndex === null || loading}>
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
  );
}
