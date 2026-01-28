#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m"

ok()   { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
fail() { echo -e "${RED}❌ $*${NC}"; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

echo "============================================================"
echo "VERIFY RFC — P2 DRY API Routes + P3 Telemetry"
echo "Root: $ROOT"
echo "============================================================"

need_cmd node
need_cmd npm
need_cmd rg

# ------------------------------------------------------------
# 0) Sanity
# ------------------------------------------------------------
[[ -f package.json ]] || fail "package.json not found (run from project root)."
ok "Sanity: package.json found"

# ------------------------------------------------------------
# 1) Lint + Build
# ------------------------------------------------------------
echo
echo "== 1) Lint + Build"
npm run lint >/dev/null && ok "npm run lint: PASS" || fail "npm run lint: FAIL"
npm run build >/dev/null && ok "npm run build: PASS" || fail "npm run build: FAIL"

# ------------------------------------------------------------
# 2) DRY Invariants
#   - No Groq SDK in routes
#   - AbortController isolated to llm.ts
#   - JSON.parse isolated to llm.ts
# ------------------------------------------------------------
echo
echo "== 2) DRY Invariants"

# 2.1 new Groq in routes
if rg -n --fixed-strings 'new Groq(' src/app/api >/dev/null; then
  fail "Invariant FAIL: found 'new Groq(' inside src/app/api"
else
  ok "Invariant: no 'new Groq(' in routes"
fi

# 2.2 AbortController location
ABORT_FILES="$(rg -l --fixed-strings 'AbortController' src || true)"
if [[ -z "${ABORT_FILES// /}" ]]; then
  fail "Invariant FAIL: AbortController not found anywhere (expected in src/lib/llm.ts)"
fi

# Expect only llm.ts
if [[ "$ABORT_FILES" == "src/lib/llm.ts" ]]; then
  ok "Invariant: AbortController only in src/lib/llm.ts"
else
  echo "$ABORT_FILES" | sed 's/^/  - /'
  fail "Invariant FAIL: AbortController found outside src/lib/llm.ts"
fi

# 2.3 JSON.parse location
JSON_FILES="$(rg -l --fixed-strings 'JSON.parse' src || true)"
if [[ -z "${JSON_FILES// /}" ]]; then
  fail "Invariant FAIL: JSON.parse not found anywhere (expected in src/lib/llm.ts)"
fi

if [[ "$JSON_FILES" == "src/lib/llm.ts" ]]; then
  ok "Invariant: JSON.parse only in src/lib/llm.ts"
else
  echo "$JSON_FILES" | sed 's/^/  - /'
  fail "Invariant FAIL: JSON.parse found outside src/lib/llm.ts"
fi

# ------------------------------------------------------------
# 3) Security: No leak of error.issues in HTTP responses
#   We intentionally DO NOT fail on internal storage inside llm.ts.
#   We fail if .issues appears in routes or api-response (response shaping).
# ------------------------------------------------------------
echo
echo "== 3) Security — no ZodError.issues leak to client"

# Search for ".issues" specifically in response paths (routes + api-response)
LEAK_FILES="$(rg -n '\.issues' src/app/api src/lib/api-response.ts || true)"
if [[ -z "${LEAK_FILES// /}" ]]; then
  ok "No '.issues' found in routes/api-response (no leak path)"
else
  echo "$LEAK_FILES"
  fail "Leak risk: '.issues' found in routes/api-response"
fi

# Optional: show if stored internally (informational only)
INTERNAL_ISSUES="$(rg -n '\.issues' src/lib/llm.ts || true)"
if [[ -n "${INTERNAL_ISSUES// /}" ]]; then
  warn "Note: '.issues' exists in llm.ts (internal only) — acceptable by design"
fi

# ------------------------------------------------------------
# 4) Telemetry installed in 6/6 routes
#   Count unique files containing installTelemetry()
# ------------------------------------------------------------
echo
echo "== 4) Telemetry installation"

TELEMETRY_FILES_COUNT="$(rg -l --fixed-strings 'installTelemetry(' src/app/api | wc -l | tr -d ' ')"
echo "Telemetry usage files: $TELEMETRY_FILES_COUNT"

if [[ "$TELEMETRY_FILES_COUNT" -eq 6 ]]; then
  ok "Telemetry: installTelemetry() present in 6/6 routes"
else
  warn "Expected 6 routes with installTelemetry(), got: $TELEMETRY_FILES_COUNT"
  echo "Files:"
  rg -l --fixed-strings 'installTelemetry(' src/app/api | sed 's/^/  - /'
  # not necessarily a hard fail; you decide. I'll keep it strict:
  fail "Telemetry check FAIL"
fi

# ------------------------------------------------------------
# 5) Handlers wired (smoke)
# ------------------------------------------------------------
echo
echo "== 5) Telemetry handlers wiring (smoke)"

if rg -n 'setLLMEventHandler' src/lib >/dev/null; then
  ok "Found setLLMEventHandler in src/lib"
else
  fail "Missing setLLMEventHandler in src/lib"
fi

if rg -n 'setApiErrorHandler' src/lib >/dev/null; then
  ok "Found setApiErrorHandler in src/lib"
else
  fail "Missing setApiErrorHandler in src/lib"
fi

# ------------------------------------------------------------
# 6) Optional: run tests
# ------------------------------------------------------------
echo
echo "== 6) Tests (optional but recommended)"
npm run test:run >/dev/null && ok "npm run test:run: PASS" || fail "npm run test:run: FAIL"

echo
echo "============================================================"
ok "ALL CHECKS PASSED — Ready to merge/deploy"
echo "============================================================"





