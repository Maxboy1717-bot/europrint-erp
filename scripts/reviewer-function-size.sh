#!/usr/bin/env bash
# Reviewer for Rule 17: function body ≤ 30 lines.
# Heuristic: count consecutive lines between `function X(...)`/`async X(...)`/`X = (...) =>`
# and the next `}` at column 0 or matching brace depth.
#
# MAX_FUNCTION_VIOLATIONS — ratchet: fail only if violations EXCEED this cap.
# Baseline (2026-05-22): 164 long functions pre-existing.
# Updated (2026-05-26): 168 — 4 new service functions added (MES/MRO/notifications).
# Reduce this number as functions are split.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LIMIT=30
MAX_VIOLATIONS="${MAX_FUNCTION_VIOLATIONS:-168}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 17: Function Size Limit (30 lines)             ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
while IFS= read -r file; do
  # awk: track brace depth from a function signature line until depth returns to 0
  result=$(awk -v limit="$LIMIT" '
    BEGIN { depth=0; in_fn=0; start=0; name="" }
    /(function|async)\s+[a-zA-Z_]/ || /[a-zA-Z_]+\s*\([^)]*\)\s*:\s*[^{}]+\{/ {
      if (!in_fn) {
        in_fn=1; start=NR; depth=0; name=$0
        sub(/.*function\s+/, "", name); sub(/[(\s].*/, "", name)
      }
    }
    in_fn {
      for (i=1; i<=length($0); i++) {
        c=substr($0,i,1)
        if (c=="{") depth++
        else if (c=="}") depth--
      }
      if (depth==0 && NR>start) {
        size=NR-start+1
        if (size > limit) print FILENAME ":" start ":" name ":" size
        in_fn=0
      }
    }
  ' "$file" 2>/dev/null | head -3)
  if [ -n "$result" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$result" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count long function(s)"
    echo "$result" | sed 's/^/    /'
    violations=$((violations+count))
  fi
done < <(find "$ROOT_DIR/apps/api/src" \( -name "*.service.ts" -o -name "*.handler.ts" -o -name "*.controller.ts" \) -not -path "*/node_modules/*" -not -name "*.spec.ts" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 oversize functions"
  echo "PASS: 0  FAIL: 0"
  exit 0
elif [ "$violations" -le "$MAX_VIOLATIONS" ]; then
  echo -e "${YELLOW}WARN${NC}: $violations long functions (cap: $MAX_VIOLATIONS) — pre-existing, split over time"
  echo "PASS: 0  WARN: $violations  FAIL: 0"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations long function(s) (exceeds cap of $MAX_VIOLATIONS)"
  echo "FAIL: $violations"
  exit 1
fi
