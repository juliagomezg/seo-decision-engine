'use client';

import { useState } from 'react';
import { Copy, Download, Check, AlertTriangle, Loader2, ChevronDown, MapPin, Phone, Clock, Star, Code2, MessageSquareQuote, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BusinessContextBar } from './BusinessContextBar';
import { BackButton } from './BackButton';
import type { ResultStepProps } from './types';
import type { CitableAnswerUnit, EvidenceLayer, EntityCard } from '@/types/schemas';
import { renderJsonLdScripts } from '@/lib/jsonld';

function isEnhancedDraft(
  draft: Record<string, unknown>,
): draft is Record<string, unknown> & {
  citable_answer_units: CitableAnswerUnit[];
  evidence_layer: EvidenceLayer;
  entity_card: EntityCard;
} {
  return (
    Array.isArray(draft.citable_answer_units) &&
    draft.evidence_layer != null &&
    draft.entity_card != null
  );
}

// ============================================
// Entity Card Component
// ============================================
function EntityCardDisplay({ card }: { card: EntityCard }) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          {card.business_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{card.address_formatted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{card.phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{card.hours_summary}</span>
          </div>
          {card.rating_summary && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{card.rating_summary}</span>
            </div>
          )}
        </div>
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Servicios destacados:</p>
          <div className="flex flex-wrap gap-1.5">
            {card.services_highlighted.map((service, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Citable Answer Units Component
// ============================================
function CitableAnswerUnitsDisplay({ units }: { units: CitableAnswerUnit[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-purple-600" />
          Answer Units ({units.length})
          <span className="text-xs font-normal text-muted-foreground">Optimizadas para featured snippets</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {units.map((unit, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{unit.question}</p>
              <div className="flex gap-1 shrink-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                  {unit.answer_word_count}w
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                  {unit.evidence_type}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                  {unit.topic_tag}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{unit.answer}</p>
            {unit.source_field && (
              <p className="text-[10px] text-muted-foreground">
                Source: {unit.source_field}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================
// Evidence Layer Component
// ============================================
function EvidenceLayerDisplay({ evidence }: { evidence: EvidenceLayer }) {
  const [expanded, setExpanded] = useState(false);
  const ratioColor =
    evidence.verifiable_ratio >= 0.6 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          Evidence Layer
        </CardTitle>
        <CardDescription>
          <span className="flex items-center gap-3">
            <span>{evidence.total_claims} claims totales</span>
            <span>{evidence.verifiable_count} verificables</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ratioColor}`}>
              {(evidence.verifiable_ratio * 100).toFixed(0)}% verificable
            </span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Ver detalle de claims</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {evidence.claims.map((claim, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded border ${
                  claim.verifiable
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    claim.verifiable ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {claim.claim_type}
                  </span>
                  <span className="text-muted-foreground">Section {claim.section_index + 1}</span>
                </div>
                <p className="text-foreground">{claim.claim_text}</p>
                <p className="text-muted-foreground mt-1">Source: {claim.source}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// ============================================
// JSON-LD Preview Component
// ============================================
function JsonLdPreview({ jsonldOutput }: { jsonldOutput: NonNullable<ResultStepProps['jsonldOutput']> }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const scripts = renderJsonLdScripts(jsonldOutput);
    try {
      await navigator.clipboard.writeText(scripts);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy JSON-LD:', err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="w-5 h-5 text-orange-600" />
            JSON-LD ({jsonldOutput.scripts.length} scripts)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        {jsonldOutput.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {jsonldOutput.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Ver scripts JSON-LD</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3">
              {jsonldOutput.scripts.map((script, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{script.type}</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(script.jsonld, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main ResultStep
// ============================================
export function ResultStep({
  contentDraft,
  guardContentResult,
  keyword,
  businessType,
  intentAnalysis,
  selectedOpportunityIndex,
  templateProposal,
  selectedTemplateIndex,
  entityProfile,
  jsonldOutput,
  onReset,
  onBack,
  onRegenerate,
  isRegenerating,
}: ResultStepProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const draftAny = contentDraft as unknown as Record<string, unknown>;
  const enhanced = isEnhancedDraft(draftAny);
  const hasEntityProfile = !!entityProfile;

  const generateMarkdown = () => {
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

    // Append JSON-LD scripts if available
    if (jsonldOutput && jsonldOutput.scripts.length > 0) {
      markdown += `\n---\n\n<!-- Structured Data (JSON-LD) -->\n\n`;
      markdown += renderJsonLdScripts(jsonldOutput);
      markdown += '\n';
    }

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
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
        <strong>✓ Generado tras tu aprobación.</strong> Este contenido se creó después de que aprobaste
        tanto la oportunidad como la estructura del template.
        {(enhanced || hasEntityProfile) && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-200 text-emerald-900">
            AEO+GEO
          </span>
        )}
      </div>

      {guardContentResult && !guardContentResult.approved && (
        <div className="space-y-6">
          {/* Diagnóstico Accionable */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                Contenido generado con observaciones
              </CardTitle>
              <CardDescription className="text-amber-800">
                El contenido está listo, pero nuestro sistema detectó áreas de mejora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Qué detectamos */}
              <div>
                <p className="font-medium text-amber-900 mb-2">Qué detectamos:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  {guardContentResult.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>

              {/* Señales de riesgo */}
              {guardContentResult.risk_flags.length > 0 && (
                <div>
                  <p className="font-medium text-amber-900 mb-2">Señales de riesgo:</p>
                  <div className="flex flex-wrap gap-2">
                    {guardContentResult.risk_flags.map((flag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900"
                      >
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencia de mejora */}
              {guardContentResult.suggested_fix && (
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="font-medium text-amber-900 mb-1">Sugerencia:</p>
                  <p className="text-amber-800">{guardContentResult.suggested_fix}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opciones de Acción */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Tus opciones</CardTitle>
              <CardDescription className="text-blue-700">
                El contenido está disponible. Elige cómo proceder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {/* Opción 1: Usar como está */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start text-left border-blue-200 hover:bg-blue-100"
                  onClick={handleDownloadContent}
                >
                  <span className="font-medium">Usar como está</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Descargar y editar manualmente
                  </span>
                </Button>

                {/* Opción 2: Regenerar con ajustes */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start text-left border-blue-200 hover:bg-blue-100"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <span className="font-medium flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Regenerando...
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Aplicando mejoras
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Regenerar mejorado</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Aplicar sugerencia automáticamente
                      </span>
                    </>
                  )}
                </Button>

                {/* Opción 3: Cambiar estructura */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start text-left border-blue-200 hover:bg-blue-100"
                  onClick={onBack}
                >
                  <span className="font-medium">Elegir otra estructura</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Volver a seleccionar template
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Label de preview */}
          <p className="text-sm text-muted-foreground">
            Vista previa del contenido (disponible para descarga):
          </p>
        </div>
      )}

      {guardContentResult && guardContentResult.approved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
          <strong>✓ Contenido aprobado.</strong> Este contenido ha pasado la validación de calidad y está listo para usar.
        </div>
      )}

      <BusinessContextBar keyword={keyword} businessType={businessType} intentAnalysis={intentAnalysis} />

      {/* Entity Card (enhanced mode only) */}
      {enhanced && (
        <EntityCardDisplay card={draftAny.entity_card as EntityCard} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Registro de decisiones
            <span className="text-xs text-muted-foreground font-normal">(Aprobado por ti)</span>
          </CardTitle>
          <CardDescription>Tu camino a través del motor de decisiones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-emerald-600 font-semibold">✓</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Ángulo aprobado</p>
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
              <p className="text-sm font-medium text-foreground">Estructura aprobada</p>
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
                title="Copiar contenido al portapapeles"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadContent}
                title="Descargar como archivo Markdown"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Descargado
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
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
            Palabras: {contentDraft.metadata.word_count} | Modelo: {contentDraft.metadata.model}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Secciones del contenido</h3>
        {contentDraft.sections.map((section, index) => {
          const enhancedSection = section as Record<string, unknown>;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{section.heading_text}</CardTitle>
                  {typeof enhancedSection.chunk_id === 'string' && (
                    <div className="flex gap-1">
                      {enhancedSection.is_self_contained === true && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          self-contained
                        </span>
                      )}
                      {Array.isArray(enhancedSection.topic_tags) &&
                        (enhancedSection.topic_tags as string[]).map((tag, ti) => (
                          <span
                            key={ti}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      {typeof enhancedSection.word_count === 'number' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                          {enhancedSection.word_count}w
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Citable Answer Units (enhanced mode only) */}
      {enhanced && (
        <CitableAnswerUnitsDisplay units={draftAny.citable_answer_units as CitableAnswerUnit[]} />
      )}

      {/* Evidence Layer (enhanced mode only) */}
      {enhanced && (
        <EvidenceLayerDisplay evidence={draftAny.evidence_layer as EvidenceLayer} />
      )}

      {/* JSON-LD Preview */}
      {jsonldOutput && jsonldOutput.scripts.length > 0 && (
        <JsonLdPreview jsonldOutput={jsonldOutput} />
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Preguntas frecuentes</h3>
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
          <CardTitle className="text-xl">Llamada a la acción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary-foreground/90 mb-2">{contentDraft.cta.text}</p>
          <p className="text-xs text-primary-foreground/70">Posición: {contentDraft.cta.position}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onReset}>
          Iniciar nuevo análisis
        </Button>
      </div>
    </div>
  );
}
