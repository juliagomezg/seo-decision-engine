# Especificación de Correcciones UX
## SEO Decision Engine - De 15% a >70% North Star Compliance

**Documento:** UX-SPEC-001
**Versión:** 1.0
**Fecha:** 2026-01-26
**Autor:** UX Execution Lead

---

## Resumen Ejecutivo

Este documento especifica las correcciones exactas de UX para resolver las 5 brechas críticas identificadas en la auditoría contra el UX North Star v1.1.

| Brecha | Principio Violado | Cumplimiento Actual | Target |
|--------|-------------------|---------------------|--------|
| Escenario C vacío | Múltiples | 0% | 100% |
| Sin reversibilidad | P1: Reversibilidad | 0% | 100% |
| Reglas ocultas | P3: Reglas antes de evaluar | 0% | 100% |
| Errores terminales | P4: Exploración sin castigo | 0% | 100% |
| Loading vacío | P6: Espera con contenido | 0% | 100% |

---

## Índice de Componentes

1. [P0] Escenario C - Rechazo de Contenido (ResultStep)
2. [P0] ValidationFeedback - Estados de Error Recuperables
3. [P1] Loading States - Espera con Contenido
4. [P1] GateAStep - Reglas Visibles + Reversibilidad
5. [P1] GateBStep - Reglas Visibles + Reversibilidad
6. [P2] InputStep - Criterios Expandidos
7. [P2] Error Banner Global - Recuperación Guiada

---

## 1. [P0] Escenario C - Rechazo de Contenido

**Archivo:** `src/components/workflow/ResultStep.tsx`
**Principios:** P1, P3, P4, P6

### BEFORE (Estado Actual)

Cuando `guardContentResult.approved === false`:
- Se muestra ValidationFeedback con variant="warning"
- Botones Copy/Download deshabilitados
- **PROBLEMA:** Usuario queda en pantalla sin acción útil
- **PROBLEMA:** No hay camino de recuperación claro
- **PROBLEMA:** Genera abandono garantizado

```tsx
// Código actual - líneas ~45-60
{guardContentResult && !guardContentResult.approved && (
  <ValidationFeedback
    title="Revisión recomendada"
    description="El contenido generado podría necesitar ajustes..."
    reasons={guardContentResult.reasons}
    variant="warning"
  />
)}
```

### AFTER (Estado Corregido)

Cuando contenido no pasa validación, mostrar:
1. Diagnóstico accionable con causa específica
2. El contenido generado (visible, no bloqueado)
3. Opciones claras de siguiente paso
4. Valor entregado aunque sea parcial

```tsx
// NUEVO BLOQUE - Reemplaza el ValidationFeedback actual

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

        {/* Sugerencia de mejora */}
        {guardContentResult.suggested_fix && (
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-medium text-amber-900 mb-1">Sugerencia:</p>
            <p className="text-amber-800">{guardContentResult.suggested_fix}</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Opciones de Acción - CRÍTICO */}
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Tus opciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {/* Opción 1: Usar como está */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start text-left"
            onClick={handleUseAsIs}
          >
            <span className="font-medium">Usar como está</span>
            <span className="text-xs text-muted-foreground mt-1">
              Descargar y editar manualmente
            </span>
          </Button>

          {/* Opción 2: Regenerar con ajustes */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start text-left"
            onClick={handleRegenerateWithFix}
          >
            <span className="font-medium">Regenerar mejorado</span>
            <span className="text-xs text-muted-foreground mt-1">
              Aplicar sugerencia automáticamente
            </span>
          </Button>

          {/* Opción 3: Cambiar estructura */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col items-start text-left"
            onClick={() => handleBack('gate_b')}
          >
            <span className="font-medium">Elegir otra estructura</span>
            <span className="text-xs text-muted-foreground mt-1">
              Volver a seleccionar template
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Contenido generado - SIEMPRE VISIBLE */}
    <div className="opacity-90">
      <p className="text-sm text-muted-foreground mb-4">
        Vista previa del contenido (disponible para descarga):
      </p>
      {/* Renderizar contentDraft aquí */}
    </div>
  </div>
)}
```

### Copy Exacto

| Elemento | Copy |
|----------|------|
| Título diagnóstico | "Contenido generado con observaciones" |
| Subtítulo | "El contenido está listo, pero nuestro sistema detectó áreas de mejora." |
| Label razones | "Qué detectamos:" |
| Label sugerencia | "Sugerencia:" |
| Título opciones | "Tus opciones" |
| Botón 1 | "Usar como está" / "Descargar y editar manualmente" |
| Botón 2 | "Regenerar mejorado" / "Aplicar sugerencia automáticamente" |
| Botón 3 | "Elegir otra estructura" / "Volver a seleccionar template" |
| Preview label | "Vista previa del contenido (disponible para descarga):" |

### Validación de Cumplimiento

- [x] P1 Reversibilidad: Opción de volver a gate_b
- [x] P3 Reglas claras: Diagnóstico específico visible
- [x] P4 Sin castigo: Contenido disponible, múltiples salidas
- [x] P6 Valor en espera: Contenido visible aunque imperfecto

---

## 2. [P0] ValidationFeedback - Estados Recuperables

**Archivo:** `src/components/workflow/ValidationFeedback.tsx`
**Principios:** P1, P4

### BEFORE (Estado Actual)

```tsx
// Muestra error/warning pero sin acción de recuperación
<div className={cn("rounded-lg border p-4", variantStyles[variant])}>
  <div className="flex items-start gap-3">
    <Icon />
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
      <ul>{reasons}</ul>
      {suggestedFix && <p>{suggestedFix}</p>}
    </div>
  </div>
</div>
```

**PROBLEMA:** Informa pero no habilita acción.

### AFTER (Estado Corregido)

Agregar prop `actions` para botones de recuperación contextuales.

```tsx
interface ValidationFeedbackProps {
  title: string;
  description: string;
  reasons?: string[];
  riskFlags?: string[];
  suggestedFix?: string;
  variant?: 'error' | 'warning' | 'info';
  // NUEVO
  actions?: {
    label: string;
    description?: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }[];
}

export function ValidationFeedback({
  title,
  description,
  reasons,
  riskFlags,
  suggestedFix,
  variant = 'error',
  actions, // NUEVO
}: ValidationFeedbackProps) {
  return (
    <div className={cn("rounded-lg border p-4", variantStyles[variant])}>
      {/* ... contenido existente ... */}

      {/* NUEVO: Acciones de recuperación */}
      {actions && actions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/10">
          <p className="text-sm font-medium mb-2">Qué puedes hacer:</p>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="h-auto py-2"
              >
                <span>{action.label}</span>
                {action.description && (
                  <span className="text-xs opacity-70 ml-1">
                    ({action.description})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Uso en GateAStep (cuando oportunidad rechazada)

```tsx
<ValidationFeedback
  title="Esta oportunidad necesita ajuste"
  description="El ángulo seleccionado presenta riesgos que podrían afectar el resultado."
  reasons={guardResult.reasons}
  suggestedFix={guardResult.suggested_fix}
  variant="error"
  actions={[
    {
      label: "Elegir otra oportunidad",
      description: "mantener keyword",
      onClick: () => setSelectedOpportunityIndex(null),
    },
    {
      label: "Ajustar keyword",
      description: "nuevo análisis",
      onClick: () => handleBack('input'),
    },
  ]}
/>
```

### Uso en GateBStep (cuando template rechazado)

```tsx
<ValidationFeedback
  title="Esta estructura necesita ajuste"
  description="El template seleccionado no es óptimo para esta oportunidad."
  reasons={guardTemplateResult.reasons}
  suggestedFix={guardTemplateResult.suggested_fix}
  variant="error"
  actions={[
    {
      label: "Elegir otro template",
      description: "mantener oportunidad",
      onClick: () => setSelectedTemplateIndex(null),
    },
    {
      label: "Cambiar oportunidad",
      description: "ver más opciones",
      onClick: () => handleBack('gate_a'),
    },
  ]}
/>
```

### Copy Exacto - Acciones

| Contexto | Copy |
|----------|------|
| Label sección | "Qué puedes hacer:" |
| Gate A - Acción 1 | "Elegir otra oportunidad" / "(mantener keyword)" |
| Gate A - Acción 2 | "Ajustar keyword" / "(nuevo análisis)" |
| Gate B - Acción 1 | "Elegir otro template" / "(mantener oportunidad)" |
| Gate B - Acción 2 | "Cambiar oportunidad" / "(ver más opciones)" |

---

## 3. [P1] Loading States - Espera con Contenido

**Archivos:** `InputStep.tsx`, `GateAStep.tsx`, `GateBStep.tsx`
**Principio:** P6 - Espera con contenido

### BEFORE (Estado Actual)

```tsx
// InputStep
{loading ? (
  <>
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    Analizando intención de búsqueda…
  </>
) : "Analizar intención"}

// GateAStep
{loading ? (
  <>
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    Evaluando originalidad y alineación…
  </>
) : "Confirmar selección"}
```

**PROBLEMA:** Solo texto de loading, sin progreso ni valor educativo.

### AFTER (Estado Corregido)

Crear componente `LoadingOverlay` que muestre:
1. Spinner con progreso visual
2. Paso actual de lo que está haciendo
3. Tip educativo rotativo

**Nuevo archivo:** `src/components/workflow/LoadingOverlay.tsx`

```tsx
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  steps: string[];
  tips?: string[];
  currentStep?: number;
}

export function LoadingOverlay({ steps, tips, currentStep = 0 }: LoadingOverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);

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
                "flex items-center gap-3 text-sm",
                i < currentStep && "text-emerald-600",
                i === currentStep && "text-foreground font-medium",
                i > currentStep && "text-muted-foreground"
              )}
            >
              {i < currentStep ? (
                <Check className="w-4 h-4" />
              ) : i === currentStep ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              {step}
            </div>
          ))}
        </div>

        {/* Educational Tip */}
        {tips?.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-1">Mientras esperas:</p>
            <p className="text-sm text-foreground">{tips[tipIndex]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Configuración por Step

**InputStep Loading:**
```tsx
const INPUT_LOADING_STEPS = [
  'Analizando keyword...',
  'Clasificando intención de búsqueda...',
  'Identificando oportunidades...',
  'Evaluando viabilidad...',
];

const INPUT_TIPS = [
  'Una keyword con intención clara genera mejor contenido.',
  'El tipo de negocio ayuda a personalizar las oportunidades.',
  'La ubicación permite detectar oportunidades locales.',
];

// En el render
{loading && (
  <LoadingOverlay
    steps={INPUT_LOADING_STEPS}
    tips={INPUT_TIPS}
    currentStep={loadingStep}
  />
)}
```

**GateAStep Loading:**
```tsx
const GATE_A_LOADING_STEPS = [
  'Verificando originalidad del ángulo...',
  'Evaluando alineación con intención...',
  'Detectando riesgos de duplicación...',
  'Generando propuestas de estructura...',
];

const GATE_A_TIPS = [
  'Un ángulo original te diferencia de la competencia.',
  'La alineación con intención mejora el engagement.',
  'Evitar duplicación protege tu SEO.',
];
```

**GateBStep Loading:**
```tsx
const GATE_B_LOADING_STEPS = [
  'Validando coherencia de estructura...',
  'Verificando profundidad adecuada...',
  'Generando contenido completo...',
  'Evaluando calidad del resultado...',
];

const GATE_B_TIPS = [
  'Una estructura clara mejora la lectura.',
  'Las secciones bien definidas ayudan al SEO.',
  'El contenido profundo genera más autoridad.',
];
```

### Copy Exacto - Loading

| Step | Pasos de Loading |
|------|------------------|
| Input | "Analizando keyword..." → "Clasificando intención de búsqueda..." → "Identificando oportunidades..." → "Evaluando viabilidad..." |
| Gate A | "Verificando originalidad del ángulo..." → "Evaluando alineación con intención..." → "Detectando riesgos de duplicación..." → "Generando propuestas de estructura..." |
| Gate B | "Validando coherencia de estructura..." → "Verificando profundidad adecuada..." → "Generando contenido completo..." → "Evaluando calidad del resultado..." |

| Step | Tips Educativos |
|------|-----------------|
| Input | "Una keyword con intención clara genera mejor contenido." / "El tipo de negocio ayuda a personalizar las oportunidades." / "La ubicación permite detectar oportunidades locales." |
| Gate A | "Un ángulo original te diferencia de la competencia." / "La alineación con intención mejora el engagement." / "Evitar duplicación protege tu SEO." |
| Gate B | "Una estructura clara mejora la lectura." / "Las secciones bien definidas ayudan al SEO." / "El contenido profundo genera más autoridad." |

---

## 4. [P1] GateAStep - Reglas Visibles

**Archivo:** `src/components/workflow/GateAStep.tsx`
**Principios:** P1, P3

### BEFORE (Estado Actual)

- ValidationCriteriaBox existe pero está colapsado/poco visible
- Usuario no sabe qué criterios aplicará el sistema ANTES de elegir
- Rechazo se siente arbitrario

### AFTER (Estado Corregido)

1. Mostrar criterios de forma prominente ANTES de la selección
2. Cada oportunidad muestra indicadores de riesgo visibles
3. Agregar tooltip explicativo en cada criterio

**Nuevo bloque antes del RadioGroup:**

```tsx
{/* REGLAS VISIBLES - Antes de elegir */}
<Card className="border-blue-200 bg-blue-50 mb-6">
  <CardHeader className="pb-2">
    <CardTitle className="text-blue-900 text-base flex items-center gap-2">
      <Info className="w-4 h-4" />
      Cómo evaluamos tu selección
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-blue-800 mb-3">
      Al confirmar, verificaremos que la oportunidad elegida cumpla:
    </p>
    <div className="grid gap-2 md:grid-cols-3">
      {VALIDATION_CRITERIA_DETAILED.map((criterion, i) => (
        <div
          key={i}
          className="flex items-start gap-2 bg-white/50 rounded p-2"
        >
          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">{criterion.title}</p>
            <p className="text-xs text-blue-700">{criterion.description}</p>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-blue-600 mt-3">
      Si no pasa algún criterio, te mostraremos qué ajustar y podrás elegir otra opción.
    </p>
  </CardContent>
</Card>

// Constante
const VALIDATION_CRITERIA_DETAILED = [
  {
    title: 'Originalidad',
    description: 'El ángulo debe diferenciarse del contenido existente.',
  },
  {
    title: 'Alineación',
    description: 'Debe coincidir con la intención de búsqueda detectada.',
  },
  {
    title: 'Sin duplicación',
    description: 'No debe replicar patrones genéricos del mercado.',
  },
];
```

**Indicadores de riesgo en cada card de oportunidad:**

```tsx
// Dentro de cada RadioGroupItem card
<div className="flex items-center gap-2 mt-2">
  <ConfidenceBadge confidence={opportunity.confidence} />
  {opportunity.risk_indicators && opportunity.risk_indicators.length > 0 && (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {opportunity.risk_indicators.length} riesgo(s)
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="text-xs">
          {opportunity.risk_indicators.map((risk, i) => (
            <li key={i}>• {risk}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )}
</div>
```

### Copy Exacto

| Elemento | Copy |
|----------|------|
| Título caja | "Cómo evaluamos tu selección" |
| Intro | "Al confirmar, verificaremos que la oportunidad elegida cumpla:" |
| Criterio 1 | "Originalidad" / "El ángulo debe diferenciarse del contenido existente." |
| Criterio 2 | "Alineación" / "Debe coincidir con la intención de búsqueda detectada." |
| Criterio 3 | "Sin duplicación" / "No debe replicar patrones genéricos del mercado." |
| Footer | "Si no pasa algún criterio, te mostraremos qué ajustar y podrás elegir otra opción." |
| Badge riesgo | "{n} riesgo(s)" |

---

## 5. [P1] GateBStep - Reglas Visibles

**Archivo:** `src/components/workflow/GateBStep.tsx`
**Principios:** P1, P3

### AFTER (Estado Corregido)

Mismo patrón que GateAStep.

```tsx
const VALIDATION_CRITERIA_DETAILED = [
  {
    title: 'Coherencia',
    description: 'La estructura debe alinearse con la oportunidad elegida.',
  },
  {
    title: 'Profundidad',
    description: 'El nivel de detalle debe ser adecuado para la intención.',
  },
  {
    title: 'Sin patrón genérico',
    description: 'La estructura no debe ser un template común del mercado.',
  },
];
```

### Copy Exacto

| Elemento | Copy |
|----------|------|
| Criterio 1 | "Coherencia" / "La estructura debe alinearse con la oportunidad elegida." |
| Criterio 2 | "Profundidad" / "El nivel de detalle debe ser adecuado para la intención." |
| Criterio 3 | "Sin patrón genérico" / "La estructura no debe ser un template común del mercado." |

---

## 6. [P2] InputStep - Criterios Expandidos

**Archivo:** `src/components/workflow/InputStep.tsx`
**Principio:** P3

### BEFORE

```tsx
const ANALYSIS_CRITERIA = [
  'Clasificar la intención de búsqueda',
  'Identificar oportunidades de contenido',
  'Evaluar viabilidad según tu tipo de negocio',
];
```

### AFTER

Expandir con descripciones para mayor claridad.

```tsx
const ANALYSIS_CRITERIA_DETAILED = [
  {
    title: 'Clasificar intención',
    description: 'Determinar si buscan información, comprar, comparar o navegar.',
  },
  {
    title: 'Identificar oportunidades',
    description: 'Encontrar ángulos únicos que no estén saturados.',
  },
  {
    title: 'Evaluar viabilidad',
    description: 'Verificar que el contenido sea relevante para tu negocio.',
  },
];
```

---

## 7. [P2] Error Banner Global - Recuperación Guiada

**Archivo:** `src/app/page.tsx`
**Principios:** P1, P4

### BEFORE

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
    <strong>Error:</strong> {error}
  </div>
)}
```

### AFTER

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Algo no salió como esperábamos
        </p>
        <p className="text-sm mt-1">{error}</p>
      </div>
      <div className="flex gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setError(null)}
        >
          Descartar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
        >
          Reintentar
        </Button>
      </div>
    </div>
    <p className="text-xs mt-2 text-red-600">
      Tu progreso anterior está guardado. Puedes reintentar o continuar desde donde estabas.
    </p>
  </div>
)}
```

### Copy Exacto

| Elemento | Copy |
|----------|------|
| Título | "Algo no salió como esperábamos" |
| Botón 1 | "Descartar" |
| Botón 2 | "Reintentar" |
| Footer | "Tu progreso anterior está guardado. Puedes reintentar o continuar desde donde estabas." |

---

## Checklist de Implementación

### Prioridad 0 (Crítico) ✅ COMPLETADO

- [x] `ResultStep.tsx` - Escenario C con opciones de recuperación
- [x] `ValidationFeedback.tsx` - Agregar prop `actions`
- [x] Integrar acciones en GateAStep cuando rechazo
- [x] Integrar acciones en GateBStep cuando rechazo

### Prioridad 1 (Alto) ✅ COMPLETADO

- [x] Crear `LoadingOverlay.tsx`
- [x] Integrar LoadingOverlay en InputStep
- [x] Integrar LoadingOverlay en GateAStep
- [x] Integrar LoadingOverlay en GateBStep
- [x] GateAStep - Caja de criterios visible antes de selección
- [x] GateBStep - Caja de criterios visible antes de selección
- [ ] Agregar indicadores de riesgo en cards de oportunidades (requiere cambio en API)

### Prioridad 2 (Medio) ✅ COMPLETADO

- [x] InputStep - Criterios expandidos con descripciones
- [x] Error banner global con recuperación
- [x] Tooltips explicativos en badges de confianza

---

## Métricas de Validación Post-Implementación

| Principio | Métrica | Target |
|-----------|---------|--------|
| P1 Reversibilidad | % pantallas con acción de retroceso | 100% |
| P3 Reglas visibles | % gates con criterios pre-selección | 100% |
| P4 Sin castigo | % estados de error con recuperación | 100% |
| P6 Espera con contenido | % loadings con progreso + tips | 100% |
| Escenario C | Tasa de abandono en rechazo | <30% (vs 100% actual) |

---

## Anexo: Resumen de Copy por Contexto

### Mensajes de Error/Rechazo

| Contexto | Título | Descripción |
|----------|--------|-------------|
| Gate A rechazado | "Esta oportunidad necesita ajuste" | "El ángulo seleccionado presenta riesgos que podrían afectar el resultado." |
| Gate B rechazado | "Esta estructura necesita ajuste" | "El template seleccionado no es óptimo para esta oportunidad." |
| Contenido con observaciones | "Contenido generado con observaciones" | "El contenido está listo, pero nuestro sistema detectó áreas de mejora." |
| Error global | "Algo no salió como esperábamos" | [mensaje dinámico del error] |

### Mensajes de Éxito

| Contexto | Copy |
|----------|------|
| Gate A aprobado | (transición silenciosa a Gate B) |
| Gate B aprobado | (transición silenciosa a Result) |
| Contenido aprobado | "✓ Contenido aprobado. Este contenido ha pasado la validación de calidad y está listo para usar." |

### Labels de Acción

| Acción | Label | Descripción secundaria |
|--------|-------|------------------------|
| Volver | "Volver" | - |
| Confirmar volver | "Volver" | - |
| Cancelar volver | "Cancelar" | - |
| Usar contenido as-is | "Usar como está" | "Descargar y editar manualmente" |
| Regenerar contenido | "Regenerar mejorado" | "Aplicar sugerencia automáticamente" |
| Cambiar estructura | "Elegir otra estructura" | "Volver a seleccionar template" |
| Elegir otra oportunidad | "Elegir otra oportunidad" | "mantener keyword" |
| Ajustar keyword | "Ajustar keyword" | "nuevo análisis" |
| Elegir otro template | "Elegir otro template" | "mantener oportunidad" |
| Cambiar oportunidad | "Cambiar oportunidad" | "ver más opciones" |

---

*Documento generado para ejecución directa. Cada sección contiene código implementable y copy final.*
