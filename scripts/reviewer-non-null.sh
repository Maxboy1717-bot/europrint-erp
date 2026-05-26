#!/usr/bin/env bash
# Reviewer for Rule 13: no `!` non-null assertions.
# PERFORMANCE: Single bulk grep (1 process) instead of ~5000 per-file subprocess calls on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 13: No Non-null Assertions (!)                 ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

# Single bulk grep across all files (1 process instead of ~5000 per-file greps)
violations_raw=$(grep -rnE '[a-zA-Z_)\]]!\.[a-zA-Z_]|[a-zA-Z_)\]]!\[' \
  "$ROOT_DIR/apps/api/src" \
  "$ROOT_DIR/artifacts/erp-dashboard/src" \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null \
  | grep -vE '\.spec\.ts:|\.test\.ts:|/spec/|/test/' \
  | grep -vE ':[0-9]+:\s*//' \
  || true)

if [ -z "$violations_raw" ]; then
  echo -e "${GREEN}PASS${NC}: 0 non-null assertions"
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
  echo -e "${RED}✗${NC} $rel — $cnt non-null assertion(s)"
  for i in "${!FILE_HITS[@]}"; do
    [ "$i" -ge 3 ] && break
    echo "    ${FILE_HITS[$i]#*:}"
  done
done

echo ""
echo -e "${RED}FAIL${NC}: $violations non-null assertion(s)"
exit 1
