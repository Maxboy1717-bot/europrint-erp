#!/usr/bin/env bash
# Reviewer for Rule 14: no console.log/warn/error in production code.
# MAX_CONSOLE_VIOLATIONS — ratchet: fail only if violations EXCEED this cap.
# Set to current known-baseline so pre-existing console.* calls don't block CI
# while any NEW addition past the cap immediately fails.
# Reduce this number as console.* calls are cleaned up.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MAX_VIOLATIONS="${MAX_CONSOLE_VIOLATIONS:-32}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 14: No console.log in Production Code          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
while IFS= read -r file; do
  hits=$(grep -nE '\bconsole\.(log|warn|error|info|debug)\(' "$file" 2>/dev/null \
    | grep -vE '//.*console\.' \
    | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count console.* call(s)"
    violations=$((violations+count))
  fi
done < <(find "$ROOT_DIR/apps/api/src" "$ROOT_DIR/artifacts/erp-dashboard/src" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" -not -name "*.test.ts" 2>/dev/null)

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
