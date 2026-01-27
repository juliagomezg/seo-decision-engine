# SEO Decision Engine

Decision-first SEO content engine with human-in-the-loop approval gates.

## Overview

SEO Decision Engine explores a safer, more intentional way of using LLMs for SEO workflows. Instead of auto-generating content end-to-end, the system enforces **human approval at every critical decision point**, reducing hallucinations, thin content, and brand risk.

**Core principle:** AI proposes. Humans decide.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: INPUT                                                          │
│  User enters: keyword + location + business_type                        │
│  → POST /api/analyze-intent (Groq LLM)                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ↓
              ╔════════════════════════════════════════╗
              ║  GATE A: OPPORTUNITY GUARD             ║
              ║  POST /api/approve-opportunity         ║
              ║  Validates: duplicates, generic,       ║
              ║  intent mismatch (Groq LLM)            ║
              ║  → HARD GATE: blocks if rejected       ║
              ╚════════════════════════════════════════╝
                                 ↓ [APPROVED]
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: TEMPLATE PROPOSAL                                              │
│  POST /api/propose-templates (Groq LLM)                                 │
│  Returns 2-3 content structure templates                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ↓
              ╔════════════════════════════════════════╗
              ║  GATE B: TEMPLATE GUARD                ║
              ║  POST /api/approve-template            ║
              ║  Validates: fit with opportunity,      ║
              ║  structure quality (Groq LLM)          ║
              ║  → HARD GATE: blocks if rejected       ║
              ╚════════════════════════════════════════╝
                                 ↓ [APPROVED]
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: CONTENT GENERATION                                             │
│  POST /api/generate-content (Groq LLM)                                  │
│  Generates full SEO content based on template                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 ↓
              ╔════════════════════════════════════════╗
              ║  CONTENT GUARD (Soft Gate)             ║
              ║  POST /api/approve-content             ║
              ║  E-E-A-T quality audit (Groq LLM)      ║
              ║  → SOFT GATE: warns but doesn't block  ║
              ╚════════════════════════════════════════╝
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: RESULT                                                         │
│  User can: Copy to clipboard | Download Markdown | Start over           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Backend | Next.js API Routes |
| LLM | Groq (mixtral-8x7b-32768) |
| Validation | Zod v4 schemas |

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Groq API key ([get one here](https://console.groq.com/keys))

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd seo-decision-engine

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Required
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Optional (for future features)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

# Configuration (optional)
LLM_GENERATION_MODEL=mixtral-8x7b-32768
PROMPT_VERSION=v1.0.0
DEBUG_MODE=false
```

### Running the App

```bash
# Development
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm run start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## API Documentation

All API routes use POST method and expect JSON body. Responses are validated with Zod schemas.

### POST `/api/analyze-intent`

Classifies search intent and generates content opportunities.

**Request:**
```json
{
  "keyword": "best CRM software",
  "location": "United States",
  "business_type": "saas"
}
```

**Response:** `IntentAnalysisSchema`
```json
{
  "query_classification": "commercial",
  "primary_user_goals": ["compare options", "find pricing"],
  "opportunities": [
    {
      "title": "CRM Comparison Guide",
      "description": "...",
      "confidence": "high",
      "user_goals": ["..."],
      "content_attributes_needed": ["..."],
      "rationale": "..."
    }
  ],
  "metadata": { "model": "...", "prompt_version": "v1.0.0", "timestamp": "..." }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (invalid input)
- `502` - LLM returned invalid JSON
- `504` - Request timeout (30s)
- `500` - Internal error

---

### POST `/api/approve-opportunity`

Validates a selected opportunity (Gate A).

**Request:** `OpportunityGuardInputSchema`
```json
{
  "keyword": "best CRM software",
  "intent_analysis": { ... },
  "selected_opportunity_index": 0,
  "selected_opportunity": { ... }
}
```

**Response:** `OpportunityGuardOutputSchema`
```json
{
  "approved": true,
  "reasons": ["Strong alignment with user intent"],
  "risk_flags": [],
  "suggested_fix": ""
}
```

---

### POST `/api/propose-templates`

Generates content template structures.

**Request:** `TemplateRequestSchema`
```json
{
  "keyword": "best CRM software",
  "selected_opportunity": { ... },
  "selected_opportunity_index": 0
}
```

**Response:** `TemplateProposalSchema`
```json
{
  "templates": [
    {
      "name": "Comparison Guide",
      "slug": "comparison-guide",
      "h1": "...",
      "sections": [...],
      "faqs": [...],
      "cta_suggestion": { "text": "...", "position": "bottom" },
      "schema_org_types": ["FAQPage"],
      "rationale": "..."
    }
  ],
  "metadata": { ... }
}
```

---

### POST `/api/approve-template`

Validates a selected template (Gate B).

**Request:** `TemplateGuardInputSchema`
```json
{
  "keyword": "...",
  "opportunity": { ... },
  "selected_template_index": 0,
  "template": { "name": "...", "description": "...", "structure": [...] }
}
```

**Response:** `TemplateGuardOutputSchema`
```json
{
  "approved": true,
  "reasons": ["..."],
  "risk_flags": [],
  "suggested_fix": ""
}
```

---

### POST `/api/generate-content`

Generates full SEO content based on approved template.

**Request:** `ContentRequestSchema`
```json
{
  "keyword": "...",
  "selected_template": { ... },
  "selected_template_index": 0
}
```

**Response:** `ContentDraftSchema`
```json
{
  "title": "Best CRM Software in 2026",
  "slug": "best-crm-software",
  "h1": "...",
  "meta_description": "...",
  "sections": [
    { "heading_level": "h2", "heading_text": "...", "content": "..." }
  ],
  "faqs": [
    { "question": "...", "answer": "..." }
  ],
  "cta": { "text": "...", "position": "bottom" },
  "metadata": { "word_count": 850, ... }
}
```

---

### POST `/api/approve-content`

Quality validation for generated content (soft gate).

**Request:** `ContentGuardInputSchema`
```json
{
  "keyword": "...",
  "opportunity": { ... },
  "template": { ... },
  "content": { ... }
}
```

**Response:** `ContentGuardOutputSchema`
```json
{
  "approved": true,
  "reasons": ["Content meets E-E-A-T standards"],
  "risk_flags": [],
  "suggested_fix": ""
}
```

## Project Structure

```
seo-decision-engine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-intent/route.ts
│   │   │   ├── approve-opportunity/route.ts
│   │   │   ├── propose-templates/route.ts
│   │   │   ├── approve-template/route.ts
│   │   │   ├── generate-content/route.ts
│   │   │   └── approve-content/route.ts
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── workflow/
│   │   │   ├── InputStep.tsx
│   │   │   ├── GateAStep.tsx
│   │   │   ├── GateBStep.tsx
│   │   │   ├── ResultStep.tsx
│   │   │   ├── ValidationFeedback.tsx
│   │   │   └── BusinessContextBar.tsx
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── step-indicator.tsx
│   │   └── confidence-badge.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── sanitize.ts            # Input sanitization
│   │   ├── rate-limit.ts          # Rate limiting utility
│   │   └── mocks/                 # Mock data (legacy)
│   └── types/
│       └── schemas.ts             # Zod schemas (source of truth)
├── .env.example
├── HANDOFF.md                     # Technical documentation
└── README.md
```

## Key Features

- **4-Layer Gating System** - Human approval at each critical decision
- **LLM-Powered Analysis** - Intent classification, template generation, content creation
- **Strict Validation** - Zod schemas for all inputs/outputs
- **Risk Detection** - Flags for duplicate content, thin content, hallucination risk
- **Safe Error Handling** - No internal details leaked, meaningful HTTP status codes
- **30s Request Timeout** - AbortController on all LLM calls
- **Export Options** - Copy to clipboard or download as Markdown

## Known Limitations

| Area | Limitation | Mitigation |
|------|------------|------------|
| **Rate Limiting** | No production rate limiting on API routes | Use `src/lib/rate-limit.ts` utility in production |
| **Authentication** | No user auth - anyone can use the app | Add NextAuth or Supabase Auth before public deployment |
| **Persistence** | No database - all state is client-side | Content is lost on page refresh; Supabase integration planned |
| **LLM Provider** | Single Groq provider, no fallback | Add secondary provider (OpenAI/Anthropic) for resilience |
| **Concurrency** | No queue system for LLM requests | May hit rate limits under heavy load |
| **Caching** | No response caching | Identical queries re-call LLM every time |
| **i18n** | UI hardcoded in Spanish | Extract strings for multi-language support |

## Architecture Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Groq as sole LLM** | Fast inference, free tier generous | Less model variety; vendor lock-in |
| **Client-side state only** | Simpler architecture, no DB needed | No persistence, no analytics |
| **Hard gates (A/B)** | Prevents low-quality content at source | Adds friction; may block valid content |
| **Zod as source of truth** | Single validation layer for API + types | Tight coupling between schema changes |
| **No SSR for main page** | `'use client'` enables rich interactivity | No SEO for the tool itself (acceptable) |
| **Spanish-only UI** | Target audience is Spanish-speaking SEOs | Limits international adoption |
| **35s frontend timeout** | Balances UX with LLM response variability | Long waits on slow responses |

## Production Notes

- API routes are hardened against invalid LLM output
- LLM clients are lazily initialized (no build-time env dependency)
- Rate limiting utility available at `src/lib/rate-limit.ts`
- Input sanitization available at `src/lib/sanitize.ts`
- All Zod validation errors return generic messages (no detail leakage)

## Contributing

See [HANDOFF.md](./HANDOFF.md) for detailed technical documentation and development roadmap.

## License

MIT
