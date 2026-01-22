'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ValidationFeedbackProps } from './types';

export function ValidationFeedback({
  title,
  description,
  reasons,
  riskFlags,
  suggestedFix,
  variant,
}: ValidationFeedbackProps) {
  const isError = variant === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = isError ? 'border-red-200' : 'border-yellow-200';
  const titleColor = isError ? 'text-red-900' : 'text-yellow-900';
  const descColor = isError ? 'text-red-700' : 'text-yellow-700';
  const textColor = isError ? 'text-red-800' : 'text-yellow-800';
  const dotColor = isError ? 'text-red-600' : 'text-yellow-600';
  const badgeBg = isError ? 'bg-red-200' : 'bg-yellow-200';
  const badgeText = isError ? 'text-red-900' : 'text-yellow-900';
  const fixBg = isError ? 'bg-red-100' : 'bg-yellow-100';

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`${titleColor} flex items-center gap-2`}>
          <span className="text-xl">⚠️</span>
          {title}
        </CardTitle>
        <CardDescription className={descColor}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className={`text-sm font-medium ${titleColor} mb-2`}>Reasons:</p>
          <ul className="space-y-1">
            {reasons.map((reason, i) => (
              <li key={i} className={`text-sm ${textColor} flex items-start gap-2`}>
                <span className={`${dotColor} mt-0.5`}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        {riskFlags.length > 0 && (
          <div>
            <p className={`text-sm font-medium ${titleColor} mb-2`}>Risk Flags:</p>
            <div className="flex flex-wrap gap-2">
              {riskFlags.map((flag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeBg} ${badgeText}`}
                >
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        {suggestedFix && (
          <div>
            <p className={`text-sm font-medium ${titleColor} mb-1`}>Suggested Fix:</p>
            <p className={`text-sm ${textColor} ${fixBg} rounded px-3 py-2`}>{suggestedFix}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
