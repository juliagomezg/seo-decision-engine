'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  steps: string[];
  tips?: string[];
  currentStep?: number;
  /** Si true, avanza automáticamente por los pasos */
  autoProgress?: boolean;
  /** Intervalo en ms entre pasos (default 1500) */
  stepInterval?: number;
}

export function LoadingOverlay({
  steps,
  tips,
  currentStep: externalStep,
  autoProgress = true,
  stepInterval = 1500,
}: LoadingOverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [internalStep, setInternalStep] = useState(0);

  const currentStep = externalStep ?? internalStep;

  // Auto-progress through steps
  useEffect(() => {
    if (!autoProgress || externalStep !== undefined) return;
    const interval = setInterval(() => {
      setInternalStep((i) => (i < steps.length - 1 ? i + 1 : i));
    }, stepInterval);
    return () => clearInterval(interval);
  }, [autoProgress, externalStep, steps.length, stepInterval]);

  // Rotate tips
  useEffect(() => {
    if (!tips?.length) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-xl p-8 max-w-md w-full mx-4 shadow-lg">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>

        {/* Progress Steps */}
        <div className="space-y-2 mb-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 text-sm transition-colors duration-300',
                i < currentStep && 'text-emerald-600',
                i === currentStep && 'text-foreground font-medium',
                i > currentStep && 'text-muted-foreground'
              )}
            >
              {i < currentStep ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 shrink-0" />
              )}
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Educational Tip */}
        {tips && tips.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-1">Mientras esperas:</p>
            <p className="text-sm text-foreground transition-opacity duration-300">
              {tips[tipIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
