# SEO Decision Engine - Handoff Document

> **Fecha:** 2026-01-26 (actualizado)
> **Autor:** Claude Opus 4.5
> **Propósito:** Documentación técnica para continuar desarrollo en otra máquina

---

## 1. Executive Summary

**SEO Decision Engine** es un sistema de decisión de contenido AI con aprobación humana (human-in-the-loop). Implementa un **sistema de 4 gates** donde un motor AI sugiere oportunidades de contenido, templates y contenido final, con aprobación humana en puntos críticos.

### Stack Principal
| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Backend | Next.js API Routes (Node.js) |
| LLM | Groq (mixtral-8x7b-32768) |
| Database | Supabase (PostgreSQL) - schema listo, no conectado |
| Validación | Zod schemas |

### Estado Actual
```
[████████████████░░░░] 80% - MVP funcional completo
```
- **Funcional:** UI completa, todos los endpoints LLM live, validación, exports
- **Pendiente:** Conexión DB, auth, tests, n8n webhooks

---

## 2. Arquitectura del Sistema

### Flujo de Datos (4-Layer Gating System)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: INPUT                                                       │
│ Usuario ingresa: keyword + location + business_type                 │
│ → POST /api/analyze-intent (Groq LIVE)                              │
└───────────────────────────────┬─────────────────────────────────────┘
                                ↓
            ╔═══════════════════════════════════╗
            ║ GATE A: OPPORTUNITY GUARD         ║
            ║ POST /api/approve-opportunity     ║
            ║ Validación: duplicados, genérico, ║
            ║ intent mismatch (Groq LIVE)       ║
            ║ → HARD GATE: bloquea si rechaza   ║
            ╚═══════════════════════════════════╝
                                ↓ [APPROVED]
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: TEMPLATE PROPOSAL                                           │
│ POST /api/propose-templates (Groq LIVE)                             │
│ Genera 2-3 templates de contenido dinámicos                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                ↓
            ╔═══════════════════════════════════╗
            ║ GATE B: TEMPLATE GUARD            ║
            ║ POST /api/approve-template        ║
            ║ Validación: fit con opportunity,  ║
            ║ estructura genérica (Groq LIVE)   ║
            ║ → HARD GATE: bloquea si rechaza   ║
            ╚═══════════════════════════════════╝
                                ↓ [APPROVED]
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: CONTENT GENERATION                                          │
│ POST /api/generate-content (Groq LIVE)                              │
│ Genera contenido SEO completo basado en template                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                ↓
            ╔═══════════════════════════════════╗
            ║ CONTENT GUARD (Soft Gate)         ║
            ║ POST /api/approve-content         ║
            ║ E-E-A-T audit (Groq LIVE)         ║
            ║ → SOFT GATE: muestra warnings,    ║
            ║   NO bloquea el contenido         ║
            ╚═══════════════════════════════════╝
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: RESULT                                                      │
│ Usuario puede: Copy to clipboard | Download MD | Reset              │
└─────────────────────────────────────────────────────────────────────┘
```

### Estructura de Archivos

```
seo-decision-engine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-intent/route.ts      ✅ Groq LIVE
│   │   │   ├── approve-opportunity/route.ts ✅ Groq LIVE
│   │   │   ├── propose-templates/route.ts   ✅ Groq LIVE
│   │   │   ├── approve-template/route.ts    ✅ Groq LIVE
│   │   │   ├── generate-content/route.ts    ✅ Groq LIVE
│   │   │   └── approve-content/route.ts     ✅ Groq LIVE
│   │   ├── page.tsx                         # 972 líneas - TODO: refactorizar
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── step-indicator.tsx               ✅ Completo
│   │   ├── confidence-badge.tsx             ✅ Completo
│   │   └── ui/                              # 8 componentes shadcn/ui
│   ├── lib/
│   │   ├── utils.ts                         # cn() helper
│   │   ├── llm.ts                           # LLM wrapper con timeout y validación
│   │   ├── groq.ts                          # Cliente Groq singleton + presets
│   │   ├── api-response.ts                  # Helpers de respuesta HTTP
│   │   ├── rate-limit.ts                    # Rate limiting en memoria
│   │   ├── sanitize.ts                      # Sanitización de inputs
│   │   └── telemetry.ts                     # Hooks de observabilidad
│   └── types/
│       └── schemas.ts                       # 264 líneas - Zod contracts
├── supabase/
│   └── schema.sql                           # DB schema (no conectado)
├── .env.example                             # 107 líneas de config
├── package.json
└── HANDOFF.md                               # Este documento
```

---

## 3. Lo Que Tenemos (Implementado)

### 3.1 Frontend UI ✅

| Componente | Estado | Archivo | Notas |
|------------|--------|---------|-------|
| Input Form | ✅ | page.tsx:460-530 | keyword, location, business_type |
| Gate A Selection | ✅ | page.tsx:532-650 | RadioGroup con 5 opportunities |
| Gate B Selection | ✅ | page.tsx:652-800 | RadioGroup con templates |
| Result View | ✅ | page.tsx:802-970 | Content preview + exports |
| StepIndicator | ✅ | step-indicator.tsx | 4-step progress bar |
| ConfidenceBadge | ✅ | confidence-badge.tsx | Low/Medium/High badges |
| Validation Feedback | ✅ | page.tsx:600-640 | Cards rojo/amarillo |

**Problema conocido:** `page.tsx` tiene 972 líneas - necesita refactorización en componentes más pequeños.

### 3.2 Backend API ✅

| Endpoint | LLM | Estado | Preset (temp) |
|----------|-----|--------|---------------|
| `/api/analyze-intent` | Groq | ✅ LIVE | classification (0.35) |
| `/api/approve-opportunity` | Groq | ✅ LIVE | validation (0.2) |
| `/api/propose-templates` | Groq | ✅ LIVE | generation (0.4) |
| `/api/approve-template` | Groq | ✅ LIVE | validation (0.2) |
| `/api/generate-content` | Groq | ✅ LIVE | creative (0.5) |
| `/api/approve-content` | Groq | ✅ LIVE | validation (0.2) |

### 3.3 Validación (Zod Schemas) ✅

Archivo: `src/types/schemas.ts` (264 líneas)

```typescript
// Schemas principales implementados:
- KeywordInputSchema         // Input del usuario
- OpportunitySchema          // Una oportunidad de contenido
- IntentAnalysisSchema       // Respuesta de analyze-intent
- OpportunityGuardInputSchema   // Input para Gate A
- OpportunityGuardOutputSchema  // Output de Gate A
- TemplateStructureSchema    // Un template
- TemplateProposalSchema     // Respuesta de propose-templates
- TemplateGuardInputSchema   // Input para Gate B
- TemplateGuardOutputSchema  // Output de Gate B
- ContentDraftSchema         // Contenido generado
- ContentGuardInputSchema    // Input para content validation
- ContentGuardOutputSchema   // Output de content validation
```

### 3.4 Database Schema ✅ (SQL listo, no conectado)

```sql
-- Tabla requests: audit log de LLM calls
CREATE TABLE requests (
  id UUID PRIMARY KEY,
  keyword TEXT NOT NULL,
  step TEXT CHECK (step IN ('intent_analysis', 'template_proposal', 'content_generation')),
  model_used TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  validation_passed BOOLEAN DEFAULT true
);

-- Tabla approvals: decisiones humanas
CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES requests(id),
  gate TEXT CHECK (gate IN ('gate_a', 'gate_b')),
  approved BOOLEAN NOT NULL,
  selected_option_index INTEGER
);

-- Views para analytics
- latest_requests_by_keyword
- approval_rates
- audit_trail
```

---

## 4. Lo Que Falta (Roadmap Day 2+)

### 4.1 Prioridad ALTA - Core Features

| Feature | Archivo(s) | Descripción | Esfuerzo |
|---------|-----------|-------------|----------|
| ~~**Template Generation LLM**~~ | ~~`api/propose-templates/route.ts`~~ | ~~Reemplazar mock con llamada Groq~~ | ✅ DONE |
| ~~**Content Generation LLM**~~ | ~~`api/generate-content/route.ts`~~ | ~~Reemplazar mock con llamada Groq~~ | ✅ DONE |
| **Conexión Supabase** | Nuevo archivo `lib/supabase.ts` | Guardar requests/approvals | 3-4h |
| ~~**Refactor page.tsx**~~ | ~~`page.tsx` → múltiples componentes~~ | ~~Dividir 972 líneas~~ | ✅ DONE |
| **Tests de schemas** | `src/types/__tests__/` | Unit tests para validación Zod | 2h |
| **Extraer useWorkflow hook** | `src/hooks/useWorkflow.ts` | Reducir complejidad de page.tsx | 2h |

### 4.2 Prioridad MEDIA - Estabilización

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Error handling mejorado | Retry logic (MAX_LLM_RETRIES) | 2h |
| ~~**Loading states**~~ | ~~Skeletons durante API calls~~ | ✅ DONE (LoadingOverlay) |
| ~~**Rate limiting**~~ | ~~Prevenir abuse de API~~ | ✅ DONE (10 req/min) |
| ~~**Timeout handling**~~ | ~~LLM_REQUEST_TIMEOUT implementation~~ | ✅ DONE (30s AbortController) |
| Timeout en frontend | AbortController en fetch calls | 1h |

### 4.3 Prioridad BAJA - Nice to Have

| Feature | Descripción |
|---------|-------------|
| n8n webhooks | Usar N8N_*_WEBHOOK_URL en lugar de LLM directo |
| OpenAI/Claude fallback | Alternar providers cuando Groq falla |
| Streaming responses | Server-sent events para content largo |
| Tests (Jest/Vitest) | Unit tests para API routes |
| Auth (NextAuth) | Multi-usuario |
| Analytics dashboard | UI para Supabase views |

---

## 5. Guía por Área de Trabajo

### 5.1 Docs (Documentación)

**Estado actual:**
- README.md: Boilerplate de create-next-app (no útil)
- HANDOFF.md: Este documento
- Inline comments: Buenos en schemas.ts, mínimos en page.tsx

**Tareas pendientes:**
```markdown
[ ] Actualizar README.md con instrucciones reales de setup
[ ] Documentar cada endpoint en formato OpenAPI/Swagger
[ ] Agregar JSDoc a funciones principales en page.tsx
[ ] Crear ARCHITECTURE.md con diagramas
[ ] Documentar prompts de LLM (versionamiento)
```

**Ejemplo de documentación faltante para endpoint:**
```typescript
/**
 * POST /api/analyze-intent
 *
 * Clasifica el intent de búsqueda y genera 5+ oportunidades de contenido.
 *
 * @input KeywordInputSchema { keyword: string, location?: string, business_type?: string }
 * @output IntentAnalysisSchema { query_classification, primary_user_goals, opportunities[] }
 * @llm Groq mixtral-8x7b-32768, temperature: 0.35
 * @errors Zod validation errors, Groq API errors
 */
```

### 5.2 Engine Bugs

**Bugs conocidos:**

| Bug | Severidad | Ubicación | Descripción |
|-----|-----------|-----------|-------------|
| ~~Mock data estático~~ | ~~Alta~~ | ~~`lib/mocks/*.ts`~~ | ✅ FIXED - Todos los endpoints son LLM live |
| No retry en LLM fail | Media | Todos los routes | MAX_LLM_RETRIES no implementado |
| ~~State leak en reset~~ | ~~Baja~~ | ~~page.tsx:handleReset~~ | ✅ FIXED - Reset limpia todo el estado |
| ~~Copy sin feedback visual~~ | ~~Baja~~ | ~~ResultStep.tsx~~ | ✅ FIXED - Muestra "Copiado" |
| Sin timeout en fetch frontend | Media | page.tsx | Frontend puede quedar stuck si backend no responde |
| Índice sin validación de bounds | Media | page.tsx | selectedOpportunityIndex podría ser inválido |

**Debugging tips:**
```typescript
// En cualquier route.ts, agregar logging:
console.log('[analyze-intent] Input:', JSON.stringify(body));
console.log('[analyze-intent] Groq response:', JSON.stringify(result));

// Para errores de Zod:
const parsed = IntentAnalysisSchema.safeParse(data);
if (!parsed.success) {
  console.error('[analyze-intent] Validation errors:', parsed.error.issues);
}
```

**Pattern para fix de retry:**
```typescript
// utils/retry.ts (crear)
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Unreachable');
}
```

### 5.3 Backend API Stabilization

**✅ Todos los endpoints ahora usan Groq LLM live.**

**Arquitectura de LLM implementada:**

```typescript
// src/lib/groq.ts - Presets por caso de uso
export const LLM_PRESETS = {
  classification: { temperature: 0.35, maxTokens: 2000 },  // Intent analysis
  validation: { temperature: 0.2, maxTokens: 1200 },       // Gates (determinístico)
  generation: { temperature: 0.4, maxTokens: 4000 },       // Templates
  creative: { temperature: 0.5, maxTokens: 6000 },         // Contenido
};

// src/lib/llm.ts - Wrapper unificado
await callLLM({
  prompt,
  schema: ZodSchema,        // Validación automática de output
  preset: "validation",     // Selecciona temperatura/tokens
  timeoutMs: 30000,         // AbortController
  requestId,                // Para telemetry
});
```

**Error handling robusto:**
- `LLMTimeoutError` → 504
- `LLMInvalidJSONError` → 502
- `LLMOutputValidationError` → 502
- `LLMUpstreamError` → 502
- `GroqConfigError` → 500

**Próximos pasos para backend:**
- [ ] Implementar retry logic con backoff exponencial
- [ ] Considerar Redis para rate limiting distribuido
- [ ] Agregar circuit breaker para Groq outages

### 5.4 Frontend UI Gates Validations

**Flujo de validación actual:**

```
User selects opportunity
        ↓
handleApproveOpportunity() [page.tsx:235]
        ↓
POST /api/approve-opportunity
        ↓
┌─────────────────────┐
│ approved: true      │ → Continúa a template proposal
├─────────────────────┤
│ approved: false     │ → Muestra ValidationFeedback (rojo)
│ + reasons[]         │   Usuario debe seleccionar otro
│ + risk_flags[]      │
│ + suggested_fix     │
└─────────────────────┘
```

**Componente ValidationFeedback (actual):**
```tsx
{guardResult && !guardResult.approved && (
  <Card className="bg-red-50 border-red-200">
    <CardContent className="pt-4">
      <p className="font-medium text-red-800">Opportunity Rejected</p>
      <ul className="list-disc pl-5 text-red-700">
        {guardResult.reasons.map((reason, i) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
      {guardResult.suggested_fix && (
        <p className="mt-2 text-red-600">
          Suggestion: {guardResult.suggested_fix}
        </p>
      )}
    </CardContent>
  </Card>
)}
```

**Mejoras sugeridas:**

1. **Agregar risk_flags como badges:**
```tsx
<div className="flex gap-2 mt-2">
  {guardResult.risk_flags.map((flag) => (
    <Badge key={flag} variant="destructive">{flag}</Badge>
  ))}
</div>
```

2. **Soft gate para content (amarillo en vez de rojo):**
```tsx
// Ya implementado pero podría mejorarse:
<Card className={guardContentResult.approved
  ? "bg-green-50 border-green-200"
  : "bg-yellow-50 border-yellow-200"}>
```

3. **Loading states mejorados:**
```tsx
{loading && (
  <div className="flex items-center gap-2">
    <Loader2 className="animate-spin" />
    <span>Validating opportunity with AI...</span>
  </div>
)}
```

### 5.5 Architecture

**Problemas actuales:**
1. **Monolito en page.tsx** - 972 líneas, difícil de mantener
2. **No hay state management** - Todo en useState local
3. **No hay data fetching library** - Fetch manual sin cache
4. **No hay error boundary** - Errores crashean toda la app

**Refactorización sugerida:**

```
src/
├── app/
│   └── page.tsx                    # Solo layout y composición
├── components/
│   ├── workflow/
│   │   ├── InputStep.tsx           # Step 1
│   │   ├── GateAStep.tsx           # Step 2 (opportunity selection)
│   │   ├── GateBStep.tsx           # Step 3 (template selection)
│   │   ├── ResultStep.tsx          # Step 4
│   │   └── ValidationFeedback.tsx  # Shared validation display
│   ├── ui/                         # shadcn (ya existe)
│   └── shared/
│       ├── BusinessContextBar.tsx
│       └── DecisionLog.tsx
├── hooks/
│   ├── useAnalyzeIntent.ts         # API call + state
│   ├── useApproveOpportunity.ts
│   ├── useProposeTemplates.ts
│   └── useWorkflowState.ts         # State machine para steps
├── lib/
│   ├── api-client.ts               # Centralized fetch wrapper
│   └── supabase.ts                 # DB client
└── types/
    └── schemas.ts                  # Ya existe
```

**State machine sugerido (usando useReducer):**
```typescript
type WorkflowState =
  | { step: 'input' }
  | { step: 'gate_a'; intentAnalysis: IntentAnalysis }
  | { step: 'gate_b'; opportunity: Opportunity; templates: TemplateProposal }
  | { step: 'result'; content: ContentDraft; feedback: ContentGuardOutput };

type WorkflowAction =
  | { type: 'ANALYZE_SUCCESS'; payload: IntentAnalysis }
  | { type: 'APPROVE_OPPORTUNITY'; payload: TemplateProposal }
  | { type: 'APPROVE_TEMPLATE'; payload: ContentDraft }
  | { type: 'RESET' };
```

---

## 6. Environment Variables

```bash
# .env.local (requeridas)
GROQ_API_KEY=gsk_xxxxx                    # OBLIGATORIO

# .env.local (opcionales Day 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

# .env.local (configuración)
LLM_GENERATION_MODEL=mixtral-8x7b-32768   # Default
PROMPT_VERSION=v1.0.0
MAX_LLM_RETRIES=2                         # No implementado aún
DEBUG_MODE=false
```

---

## 7. Comandos de Desarrollo

```bash
# Setup inicial
git clone <repo>
cd seo-decision-engine
npm install
cp .env.example .env.local
# Editar .env.local con GROQ_API_KEY

# Desarrollo
npm run dev          # http://localhost:3000

# Build
npm run build
npm run start

# Lint
npm run lint
```

---

## 8. Resumen de Prioridades

### Sprint 1: Funcionalidad Core ✅ COMPLETADO
```
[x] Reemplazar mock en /api/propose-templates con Groq
[x] Reemplazar mock en /api/generate-content con Groq
[ ] Conectar Supabase para persistencia (pendiente)
```

### Sprint 2: Estabilización ✅ MAYORMENTE COMPLETADO
```
[ ] Implementar retry logic en API calls (pendiente)
[x] Mejorar error handling con mensajes específicos
[x] Agregar loading overlays (LoadingOverlay.tsx)
[x] Rate limiting básico (10 req/min por IP)
[x] Timeout handling (30s AbortController)
```

### Sprint 3: Refactorización ✅ PARCIALMENTE COMPLETADO
```
[x] Dividir page.tsx en componentes (workflow/ directory)
[ ] Crear custom hooks para API calls (useWorkflow pendiente)
[ ] Implementar state machine para workflow (opcional)
[ ] Agregar tests básicos (EN PROGRESO)
```

### Sprint 4: Features Adicionales
```
[ ] n8n webhook integration
[ ] Multi-provider LLM (OpenAI fallback)
[ ] Analytics dashboard
[ ] Auth system
```

---

## 9. Contacto y Recursos

**Repositorio:** (agregar URL de GitHub)

**Tecnologías principales:**
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Zod Validation](https://zod.dev/)
- [Supabase Docs](https://supabase.com/docs)

**Modelos LLM recomendados:**
- `mixtral-8x7b-32768` - Balance velocidad/calidad (actual)
- `llama-3.1-70b-versatile` - Mayor calidad, más lento
- `llama-3.1-8b-instant` - Muy rápido, menor calidad

---

*Documento generado automáticamente por Claude Opus 4.5*
*Última actualización: 2026-01-26*
