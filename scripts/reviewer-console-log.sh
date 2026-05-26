#!/usr/bin/env bash
# Reviewer for Rule 14: no console.log/warn/error in production code.
# MAX_CONSOLE_VIOLATIONS — ratchet: fail only if violations EXCEED this cap.
# PERFORMANCE: Single bulk grep (1 process) instead of ~5000 per-file subprocess calls on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 2026-05-25 baseline: 44 (backfill-org-functions.ts script has 15, legitimate CLI output;
#   remaining ~29 are error-catch guards in FE). Reduce as they are cleaned up.
MAX_VIOLATIONS="${MAX_CONSOLE_VIOLATIONS:-50}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 14: No console.log in Production Code          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# Single bulk grep across all files (1 process instead of ~5000 per-file greps)
violations_raw=$(grep -rnE '\bconsole\.(log|warn|error|info|debug)\(' \
  "$ROOT_DIR/apps/api/src" \
  "$ROOT_DIR/artifacts/erp-dashboard/src" \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null \
  | grep -vE '\.spec\.ts:|\.test\.ts:|/spec/|/test/' \
  | grep -vE ':[0-9]+:\s*//' \
  | grep -vE '//.*console\.' \
  || true)

violations=0

if [ -n "$violations_raw" ]; then
  # Group by file and display
  mapfile -t VIOL_FILES < <(echo "$violations_raw" | awk -F: '{print $1}' | sort -u)
  for fp in "${VIOL_FILES[@]}"; do
    rel="${fp#$ROOT_DIR/}"
    mapfile -t FILE_HITS < <(echo "$violations_raw" | grep -F "${fp}:")
    cnt=${#FILE_HITS[@]}
    violations=$((violations + cnt))
    echo -e "${RED}✗${NC} $rel — $cnt console.* call(s)"
  done
fi

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 console.* calls"
  echo "PASS: 0  FAIL: 0"
  exit 0
elif [ "$violations" -le "$MAX_VIOLATIONS" ]; then
  echo -e "${YELLOW}WARN${NC}: $violations console.* calls (cap: $MAX_VIOLATIONS) — pre-existing, reduce over time"
  echo "PASS: 0  WARN: $violations  FAIL: 0"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations console.* calls (exceeds cap of $MAX_VIOLATIONS)"
  echo "FAIL: $violations"
  exit 1
fi
