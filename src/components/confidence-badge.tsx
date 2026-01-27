'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Confidence = 'low' | 'medium' | 'high';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

const CONFIDENCE_CONFIG: Record<
  Confidence,
  { className: string; label: string; tooltip: string; details: string }
> = {
  low: {
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Confianza baja',
    tooltip: 'Viable pero con mayor riesgo',
    details: 'Esta opción puede funcionar, pero tiene más probabilidad de necesitar revisión o ajustes después de la generación. Considera otras opciones si están disponibles.',
  },
  medium: {
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Confianza media',
    tooltip: 'Buena base con ajustes menores',
    details: 'Opción sólida que probablemente requiera solo ajustes menores. Es una elección segura si las opciones de alta confianza no se ajustan a tu objetivo.',
  },
  high: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Confianza alta',
    tooltip: 'Mejor opción recomendada',
    details: 'Alta probabilidad de éxito. Esta opción tiene la mejor alineación con la intención de búsqueda y mayor potencial de diferenciación en el mercado.',
  },
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} cursor-help`}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <p className="font-medium mb-1">{config.tooltip}</p>
          <p className="text-xs text-muted-foreground">{config.details}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
