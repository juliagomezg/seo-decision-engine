'use client';

import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { ValidationFeedback } from './ValidationFeedback';
import { LoadingOverlay } from './LoadingOverlay';
import { BackButton } from './BackButton';
import type { GateAStepProps } from './types';
import type { RiskIndicator } from '@/types/schemas';

const RISK_INDICATOR_LABELS: Record<RiskIndicator, { label: string; description: string }> = {
  thin_content: { label: 'Contenido delgado', description: 'Puede no haber suficiente información sustancial disponible' },
  generic_angle: { label: 'Ángulo genérico', description: 'El enfoque es demasiado amplio o común' },
  high_competition: { label: 'Alta competencia', description: 'SERP muy competitivo con sitios establecidos' },
  low_volume: { label: 'Bajo volumen', description: 'Volumen de búsqueda bajo o nicho muy específico' },
  seasonal_query: { label: 'Estacional', description: 'Tráfico variable según temporada' },
  intent_mismatch: { label: 'Intención mixta', description: 'Podría no coincidir exactamente con la intención del usuario' },
  monetization_weak: { label: 'Monetización débil', description: 'Potencial comercial limitado' },
  eeat_risk: { label: 'Riesgo E-E-A-T', description: 'Tema sensible que requiere demostrar experiencia y autoridad' },
};

const VALIDATION_CRITERIA_DETAILED = [
  {
    title: 'Originalidad',
    description: 'El ángulo debe diferenciarse del contenido existente.',
  },
  {
    title: 'Alineación',
    description: 'Debe coincidir con la intención de búsqueda detectada.',
  },
  {
    title: 'Sin duplicación',
    description: 'No debe replicar patrones genéricos del mercado.',
  },
];

const LOADING_STEPS = [
  'Verificando originalidad del ángulo...',
  'Evaluando alineación con intención...',
  'Detectando riesgos de duplicación...',
  'Generando propuestas de estructura...',
];

const LOADING_TIPS = [
  'Un ángulo original te diferencia de la competencia.',
  'La alineación con intención mejora el engagement.',
  'Evitar duplicación protege tu SEO.',
];

export function GateAStep({
  intentAnalysis,
  selectedOpportunityIndex,
  setSelectedOpportunityIndex,
  guardResult,
  setGuardResult,
  loading,
  onApprove,
  onBack,
}: GateAStepProps) {
  return (
    <>
      {loading && (
        <LoadingOverlay
          steps={LOADING_STEPS}
          tips={LOADING_TIPS}
        />
      )}
      <div className="space-y-6">
        <div className="flex justify-start">
          <BackButton onClick={onBack} disabled={loading} />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Paso 2: Elige tu ángulo de contenido</h2>
          <p className="text-muted-foreground">Selecciona el enfoque que mejor represente tu objetivo.</p>
          <div className="mt-4 p-3 bg-muted rounded-md inline-block">
            <p className="text-sm text-muted-foreground">
              <strong>Clasificación:</strong> {intentAnalysis.query_classification}
            </p>
          </div>
        </div>

        {/* Caja de criterios visible ANTES de seleccionar */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 text-base flex items-center gap-2">
              <Info className="w-4 h-4" />
              Cómo evaluamos tu selección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 mb-3">
              Al confirmar, verificaremos que la oportunidad elegida cumpla:
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {VALIDATION_CRITERIA_DETAILED.map((criterion, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-white/50 rounded p-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{criterion.title}</p>
                    <p className="text-xs text-blue-700">{criterion.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Si no pasa algún criterio, te mostraremos qué ajustar y podrás elegir otra opción.
            </p>
          </CardContent>
        </Card>

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

                {/* Risk Indicators */}
                {opportunity.risk_indicators && opportunity.risk_indicators.length > 0 && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800">
                        {opportunity.risk_indicators.length} riesgo{opportunity.risk_indicators.length > 1 ? 's' : ''} detectado{opportunity.risk_indicators.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <TooltipProvider delayDuration={200}>
                        {opportunity.risk_indicators.map((risk) => (
                          <Tooltip key={risk}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="text-xs bg-amber-100 text-amber-800 border-amber-300 cursor-help"
                              >
                                {RISK_INDICATOR_LABELS[risk]?.label || risk}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{RISK_INDICATOR_LABELS[risk]?.description || risk}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-medium text-foreground">Por qué existe: </span>
                  <span className="text-muted-foreground">{opportunity.rationale}</span>
                </div>
              </CardContent>
            </Card>
          </Label>
        ))}
      </RadioGroup>

      {guardResult && !guardResult.approved && (
        <ValidationFeedback
          title="Esta oportunidad necesita ajuste"
          description="El ángulo seleccionado presenta riesgos que podrían afectar el resultado."
          reasons={guardResult.reasons}
          riskFlags={guardResult.risk_flags}
          suggestedFix={guardResult.suggested_fix}
          variant="error"
          actions={[
            {
              label: 'Elegir otra oportunidad',
              description: 'mantener keyword',
              onClick: () => setSelectedOpportunityIndex(null),
            },
            {
              label: 'Ajustar keyword',
              description: 'nuevo análisis',
              onClick: onBack,
            },
          ]}
        />
      )}

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onApprove} disabled={selectedOpportunityIndex === null || loading}>
          Confirmar selección
        </Button>
      </div>
      </div>
    </>
  );
}
