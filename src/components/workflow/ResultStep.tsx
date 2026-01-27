'use client';

import { useState } from 'react';
import { Copy, Download, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessContextBar } from './BusinessContextBar';
import { BackButton } from './BackButton';
import type { ResultStepProps } from './types';

export function ResultStep({
  contentDraft,
  guardContentResult,
  keyword,
  businessType,
  intentAnalysis,
  selectedOpportunityIndex,
  templateProposal,
  selectedTemplateIndex,
  onReset,
  onBack,
  onRegenerate,
  isRegenerating,
}: ResultStepProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
