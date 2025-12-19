-- ============================================
-- SUPABASE SCHEMA FOR SEO DECISION ENGINE
-- ============================================
-- Created: Day 1
-- Purpose: Audit trail for all LLM requests and human approvals
-- No auth, no RLS, single-user demo mode
-- ============================================

-- Drop existing tables if re-running (careful in production!)
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS requests;

-- ============================================
-- TABLE: requests
-- Purpose: Log every LLM request/response with full audit trail
-- ============================================

CREATE TABLE requests (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_name TEXT NOT NULL DEFAULT 'demo',

  -- User Input Context
  keyword TEXT NOT NULL,
  location TEXT,
  business_type TEXT,

  -- Workflow Tracking
  step TEXT NOT NULL CHECK (step IN ('intent_analysis', 'template_proposal', 'content_generation')),

  -- AI Provenance
  model_used TEXT NOT NULL,
  prompt_version TEXT NOT NULL,

  -- Input/Output (stored as JSONB for flexibility)
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,

  -- Validation Status
  validation_passed BOOLEAN NOT NULL DEFAULT true,
  validation_errors JSONB
);

-- Indexes for common queries
CREATE INDEX idx_requests_keyword ON requests(keyword);
CREATE INDEX idx_requests_step ON requests(step);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_validation_passed ON requests(validation_passed);

-- Optional: Composite index for keyword + step queries
CREATE INDEX idx_requests_keyword_step ON requests(keyword, step);

-- Comment for documentation
COMMENT ON TABLE requests IS 'Audit log for all LLM requests and responses';
COMMENT ON COLUMN requests.step IS 'Pipeline stage: intent_analysis | template_proposal | content_generation';
COMMENT ON COLUMN requests.validation_passed IS 'Whether Zod validation passed on output_data';

-- ============================================
-- TABLE: approvals
-- Purpose: Log human decisions at approval gates
-- ============================================

CREATE TABLE approvals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_name TEXT NOT NULL DEFAULT 'demo',

  -- Context
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  gate TEXT NOT NULL CHECK (gate IN ('gate_a', 'gate_b')),

  -- Decision
  approved BOOLEAN NOT NULL,
  selected_option_index INTEGER CHECK (selected_option_index >= 0),
  rejection_reason TEXT,

  -- Metadata (e.g., user notes, confidence level, etc.)
  decision_metadata JSONB
);

-- Indexes for common queries
CREATE INDEX idx_approvals_request_id ON approvals(request_id);
CREATE INDEX idx_approvals_gate ON approvals(gate);
CREATE INDEX idx_approvals_approved ON approvals(approved);
CREATE INDEX idx_approvals_created_at ON approvals(created_at DESC);

-- Comment for documentation
COMMENT ON TABLE approvals IS 'Human decisions at approval gates';
COMMENT ON COLUMN approvals.gate IS 'Approval gate: gate_a (opportunity selection) | gate_b (template selection)';
COMMENT ON COLUMN approvals.selected_option_index IS 'Zero-based index of selected option from array (null if rejected)';

-- ============================================
-- OPTIONAL: Helpful views for analytics
-- ============================================

-- View: Latest requests per keyword
CREATE OR REPLACE VIEW latest_requests_by_keyword AS
SELECT DISTINCT ON (keyword, step)
  id,
  keyword,
  step,
  model_used,
  prompt_version,
  validation_passed,
  created_at
FROM requests
ORDER BY keyword, step, created_at DESC;

-- View: Approval rates by gate
CREATE OR REPLACE VIEW approval_rates AS
SELECT
  gate,
  COUNT(*) as total_decisions,
  SUM(CASE WHEN approved THEN 1 ELSE 0 END) as approvals,
  SUM(CASE WHEN NOT approved THEN 1 ELSE 0 END) as rejections,
  ROUND(100.0 * SUM(CASE WHEN approved THEN 1 ELSE 0 END) / COUNT(*), 2) as approval_rate_pct
FROM approvals
GROUP BY gate;

-- View: Full audit trail (requests + approvals)
CREATE OR REPLACE VIEW audit_trail AS
SELECT
  r.id as request_id,
  r.created_at as request_created_at,
  r.keyword,
  r.location,
  r.business_type,
  r.step,
  r.model_used,
  r.prompt_version,
  r.validation_passed,
  a.id as approval_id,
  a.created_at as approval_created_at,
  a.gate,
  a.approved,
  a.selected_option_index,
  a.rejection_reason
FROM requests r
LEFT JOIN approvals a ON r.id = a.request_id
ORDER BY r.created_at DESC, a.created_at DESC;

-- ============================================
-- INITIAL DATA (optional, for testing)
-- ============================================

-- You can insert test data here if needed
-- Example:
-- INSERT INTO requests (keyword, step, model_used, prompt_version, input_data, output_data)
-- VALUES ('test keyword', 'intent_analysis', 'gpt-4', 'v1.0.0', '{}', '{}');
