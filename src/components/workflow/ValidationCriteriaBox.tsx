'use client';

import { Info } from 'lucide-react';
import type { ValidationCriteriaBoxProps } from './types';

export function ValidationCriteriaBox({
  criteria,
  title = 'Qué evaluará el sistema',
}: ValidationCriteriaBoxProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-900">{title}</p>
          <ul className="space-y-1">
            {criteria.map((criterion, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
