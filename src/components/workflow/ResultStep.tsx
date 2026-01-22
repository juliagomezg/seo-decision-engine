'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessContextBar } from './BusinessContextBar';
import { ValidationFeedback } from './ValidationFeedback';
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
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
        <strong>✓ Generated after two human approval gates.</strong> This content was created only after you
        approved both the opportunity and template structure.
      </div>

      {guardContentResult && !guardContentResult.approved && (
        <ValidationFeedback
          title="Content needs revision"
          description="The generated content did not pass quality validation. Review the feedback below and regenerate or manually improve the content before exporting."
          reasons={guardContentResult.reasons}
          riskFlags={guardContentResult.risk_flags}
          suggestedFix={guardContentResult.suggested_fix}
          variant="warning"
        />
      )}

      {guardContentResult && guardContentResult.approved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
          <strong>✓ Content approved.</strong> This content has passed quality validation and is ready for export.
        </div>
      )}

      <BusinessContextBar keyword={keyword} businessType={businessType} intentAnalysis={intentAnalysis} />

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
                title={guardContentResult?.approved ? 'Copy content to clipboard' : 'Fix content issues before exporting'}
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
                title={guardContentResult?.approved ? 'Download as Markdown file' : 'Fix content issues before exporting'}
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
        <Button variant="outline" onClick={onReset}>
          Start New Analysis
        </Button>
      </div>
    </div>
  );
}
