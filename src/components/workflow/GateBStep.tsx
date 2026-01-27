'use client';

import { ChevronDown, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BusinessContextBar } from './BusinessContextBar';
import { ValidationFeedback } from './ValidationFeedback';
import { LoadingOverlay } from './LoadingOverlay';
import { BackButton } from './BackButton';
import type { GateBStepProps } from './types';

const VALIDATION_CRITERIA_DETAILED = [
  {
    title: 'Coherencia',
    description: 'La estructura debe alinearse con la oportunidad elegida.',
  },
  {
    title: 'Profundidad',
    description: 'El nivel de detalle debe ser adecuado para la intención.',
  },
  {
    title: 'Sin patrón genérico',
    description: 'La estructura no debe ser un template común del mercado.',
  },
];

const LOADING_STEPS = [
  'Validando coherencia de estructura...',
  'Verificando profundidad adecuada...',
  'Generando contenido completo...',
  'Evaluando calidad del resultado...',
];

const LOADING_TIPS = [
  'Una estructura clara mejora la lectura.',
  'Las secciones bien definidas ayudan al SEO.',
  'El contenido profundo genera más autoridad.',
];

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
  onBack,
}: GateBStepProps) {
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Paso 3: Elige la estructura</h2>
          <p className="text-muted-foreground">Define cómo se organizará tu contenido.</p>
        </div>

        <BusinessContextBar keyword={keyword} businessType={businessType} intentAnalysis={intentAnalysis} />

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
              Al confirmar, verificaremos que la estructura elegida cumpla:
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
                      {template.sections.length} secciones • {template.faqs.length} FAQs
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
                  <span className="font-medium text-foreground">Razonamiento: </span>
                  <span className="text-muted-foreground">{template.rationale}</span>
                </div>
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="w-4 h-4" />
                    Ver estructura de secciones
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
          title="Esta estructura necesita ajuste"
          description="El template seleccionado no es óptimo para esta oportunidad."
          reasons={guardTemplateResult.reasons}
          riskFlags={guardTemplateResult.risk_flags}
          suggestedFix={guardTemplateResult.suggested_fix}
          variant="error"
          actions={[
            {
              label: 'Elegir otro template',
              description: 'mantener oportunidad',
              onClick: () => setSelectedTemplateIndex(null),
            },
            {
              label: 'Cambiar oportunidad',
              description: 'ver más opciones',
              onClick: onBack,
            },
          ]}
        />
      )}

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onApprove} disabled={selectedTemplateIndex === null || loading}>
          Confirmar y generar contenido
        </Button>
      </div>
      </div>
    </>
  );
}
