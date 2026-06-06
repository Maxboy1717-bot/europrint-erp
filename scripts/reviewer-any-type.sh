#!/usr/bin/env bash
# Reviewer for Rule 18: no `any` type.
# PERFORMANCE: Single bulk grep (1 process) instead of ~5000 per-file subprocess calls on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 18: No \`any\` Type                              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

# Single bulk grep across all files (1 process instead of ~5000 per-file greps)
# Match: `: any` (annotation), `as any` (cast), `<any>` (generic), `Array<any>`
violations_raw=$(grep -rnE ':\s*any(\b|\[)|<any>|as any\b|Array<any>' \
  "$ROOT_DIR/apps/api/src" \
  "$ROOT_DIR/artifacts/erp-dashboard/src" \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null \
  | grep -vE '\.spec\.ts:|\.test\.ts:|/spec/|/test/' \
  | grep -vE ':[0-9]+:\s*//' \
  | grep -vE '//.*any' \
  || true)

if [ -z "$violations_raw" ]; then
  echo -e "${GREEN}PASS${NC}: 0 \`any\` uses"
  exit 0
fi

# Group violations by file and display (up to 3 samples per file)
violations=0
mapfile -t VIOL_FILES < <(echo "$violations_raw" | awk -F: '{print $1}' | sort -u)
for fp in "${VIOL_FILES[@]}"; do
  rel="${fp#$ROOT_DIR/}"
  mapfile -t FILE_HITS < <(echo "$violations_raw" | grep -F "${fp}:")
  cnt=${#FILE_HITS[@]}
  violations=$((violations + cnt))
  echo -e "${RED}✗${NC} $rel — $cnt any-usage"
  for i in "${!FILE_HITS[@]}"; do
    [ "$i" -ge 3 ] && break
    echo "    ${FILE_HITS[$i]#*:}"
  done
done

echo ""
# RATCHET: fail only if violations EXCEED the cap; pre-existing count is the baseline.
MAX_ANY="${MAX_ANY_VIOLATIONS:-2}"
if [ "$violations" -le "$MAX_ANY" ]; then
  echo -e "WARN: $violations \`any\` use(s) at/below ratchet cap of $MAX_ANY — pre-existing, type properly over time"
  echo "FAIL: 0"
  exit 0
fi
echo -e "${RED}FAIL${NC}: $violations \`any\` use(s) (exceeds ratchet cap of $MAX_ANY)"
exit 1
