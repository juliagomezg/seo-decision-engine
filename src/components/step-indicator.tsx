import { CheckCircle2 } from 'lucide-react'

type Step = 'input' | 'gate_a' | 'gate_b' | 'result'

interface StepIndicatorProps {
  currentStep: Step
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps: { key: Step; label: string }[] = [
    { key: 'input', label: 'Intent Analysis' },
    { key: 'gate_a', label: 'Approve Opportunity' },
    { key: 'gate_b', label: 'Approve Template' },
    { key: 'result', label: 'Generated Content' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <ol className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isActive = isCompleted || isCurrent

        return (
          <li key={step.key} className="flex items-center" aria-current={isCurrent ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 md:w-16 h-px mx-2 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
