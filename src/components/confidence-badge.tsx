import { Badge } from '@/components/ui/badge'

type Confidence = 'low' | 'medium' | 'high'

interface ConfidenceBadgeProps {
  confidence: Confidence
}

const CONFIDENCE_CONFIG: Record<Confidence, { className: string; label: string }> = {
  low: { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Low confidence' },
  medium: { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Medium confidence' },
  high: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'High confidence' },
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
