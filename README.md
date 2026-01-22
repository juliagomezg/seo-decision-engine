# SEO Decision Engine

Decision-first SEO content engine with human-in-the-loop approval gates.

## Overview
SEO Decision Engine explores a safer, more intentional way of using LLMs for SEO workflows.

Instead of auto-generating content end-to-end, the system enforces **human approval at every critical decision point**, reducing hallucinations, thin content, and brand risk.

This project prioritizes **decision quality, validation, and production safety** over raw content generation.

## Core Idea
**AI proposes. Humans decide.**

Every step in the workflow is gated, validated, and explicitly approved before moving forward.

## Workflow
Intent → Opportunity → Template → Content

Each gate is independently validated using strict schemas and quality checks.

## Key Features
- LLM-powered intent classification
- Human approval of content opportunities (Gate A)
- Template structure validation (Gate B)
- Content quality and E-E-A-T guardrails
- Strict runtime schema validation with Zod
- Safe handling of malformed LLM responses
- Explicit HTTP error semantics for frontend reliability

## Architecture Principles
- Decision-first, not content-first
- Human-in-the-loop by design
- Explicit validation at every boundary
- Production-safe error handling
- No build-time dependency on environment variables
- Cost-aware and deterministic LLM usage

## Tech Stack
- Next.js (App Router)
- TypeScript
- Zod v4
- Groq LLM API
- Server-side API routes
- Schema-driven contracts

## Production Notes
- API routes are hardened against invalid LLM output
- LLM clients are lazily initialized to avoid build-time crashes
- Runtime failures return meaningful HTTP status codes
- Some endpoints intentionally return mock data for MVP stages

## Local Development
```bash
npm install
npm run dev
Note: LLM-backed endpoints require GROQ_API_KEY at runtime.

Technical Documentation
For a deeper technical overview, architecture details, and development roadmap,
see HANDOFF.md.

Status
This project is under active iteration and is intentionally focused on
architecture, safety, and decision quality rather than content volume.