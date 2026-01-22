'use client';

import type { BusinessContextBarProps } from './types';
import { BUSINESS_TYPE_LABELS, INTENT_LABELS } from './types';

export function BusinessContextBar({ keyword, businessType, intentAnalysis }: BusinessContextBarProps) {
  return (
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
}
