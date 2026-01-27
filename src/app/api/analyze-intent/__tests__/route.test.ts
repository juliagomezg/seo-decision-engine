import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoist everything that needs to be used in vi.mock factories
const {
  mockCallLLM,
  mockCheckRateLimit,
  LLMTimeoutError,
  LLMInvalidJSONError,
  LLMOutputValidationError,
  LLMUpstreamError,
  GroqConfigError,
} = vi.hoisted(() => {
  class LLMTimeoutError extends Error {
    readonly code = 'TIMEOUT' as const;
    constructor(message = 'Request timeout') {
      super(message);
      this.name = 'LLMTimeoutError';
    }
  }

  class LLMInvalidJSONError extends Error {
    readonly code = 'LLM_INVALID_JSON' as const;
    constructor(message = 'LLM returned invalid JSON') {
      super(message);
      this.name = 'LLMInvalidJSONError';
    }
  }

  class LLMOutputValidationError extends Error {
    readonly code = 'LLM_OUTPUT_VALIDATION' as const;
    constructor() {
      super('LLM output failed schema validation');
      this.name = 'LLMOutputValidationError';
    }
  }

  class LLMUpstreamError extends Error {
    readonly code = 'UPSTREAM_ERROR' as const;
    constructor(message = 'Upstream error') {
      super(message);
      this.name = 'LLMUpstreamError';
    }
  }

  class GroqConfigError extends Error {
    readonly code = 'MISSING_GROQ_API_KEY' as const;
    constructor(message = 'GROQ_API_KEY is not set') {
      super(message);
      this.name = 'GroqConfigError';
    }
  }

  return {
    mockCallLLM: vi.fn(),
    mockCheckRateLimit: vi.fn(() => true),
    LLMTimeoutError,
    LLMInvalidJSONError,
    LLMOutputValidationError,
    LLMUpstreamError,
    GroqConfigError,
  };
});

vi.mock('server-only', () => ({}));

vi.mock('@/lib/llm', () => ({
  callLLM: mockCallLLM,
  LLMTimeoutError,
  LLMInvalidJSONError,
  LLMOutputValidationError,
  LLMUpstreamError,
  GroqConfigError,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/telemetry', () => ({
  installTelemetry: vi.fn(),
}));

import { POST } from '../route';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/analyze-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue(true);
  });

  describe('input validation', () => {
    it('returns 400 for missing keyword', async () => {
      const req = createRequest({});
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 for empty keyword', async () => {
      const req = createRequest({ keyword: '' });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for whitespace-only keyword', async () => {
      const req = createRequest({ keyword: '   ' });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for keyword over 200 chars', async () => {
      const req = createRequest({ keyword: 'a'.repeat(201) });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid business_type', async () => {
      const req = createRequest({ keyword: 'crm', business_type: 'invalid' });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('successful response', () => {
    it('returns 200 with valid input and calls LLM', async () => {
      const mockResponse = {
        query_classification: 'commercial',
        primary_user_goals: ['compare options'],
        opportunities: Array.from({ length: 5 }, (_, i) => ({
          title: `Opportunity ${i + 1}`,
          description: `Description for opportunity ${i + 1} with enough length to pass validation.`,
          confidence: 'medium' as const,
          user_goals: ['goal 1'],
          content_attributes_needed: ['attr 1'],
          rationale: `Rationale for opportunity ${i + 1} with enough length.`,
          risk_indicators: [],
        })),
        metadata: {
          model: 'mixtral-8x7b-32768',
          prompt_version: 'v1.0.0',
          timestamp: new Date().toISOString(),
        },
      };

      mockCallLLM.mockResolvedValue(mockResponse);

      const req = createRequest({ keyword: 'best crm software' });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockCallLLM).toHaveBeenCalledOnce();
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          preset: 'classification',
        })
      );
    });
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockCheckRateLimit.mockReturnValueOnce(false);

      const req = createRequest({ keyword: 'test' });
      const res = await POST(req);

      expect(res.status).toBe(429);
    });
  });

  describe('LLM error handling', () => {
    it('returns 504 on LLM timeout', async () => {
      mockCallLLM.mockRejectedValueOnce(new LLMTimeoutError());

      const req = createRequest({ keyword: 'test keyword' });
      const res = await POST(req);

      expect(res.status).toBe(504);
    });

    it('returns 502 on invalid LLM JSON', async () => {
      mockCallLLM.mockRejectedValueOnce(new LLMInvalidJSONError());

      const req = createRequest({ keyword: 'test keyword' });
      const res = await POST(req);

      expect(res.status).toBe(502);
    });
  });
});
