#!/usr/bin/env bash
# Reviewer for Rule 20: every frontend form uses zodResolver.
# PERFORMANCE: Two-pass bulk grep instead of per-file loops over ~2562 FE files on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FE="$ROOT_DIR/artifacts/erp-dashboard/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 20: Frontend Forms Require Zod                 ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$FE" ]; then echo "frontend dir not found"; exit 0; fi

violations=0

# Pass 1: find files that use useForm() (bulk, 1 process)
mapfile -t CANDIDATES < <(
  grep -rlE '\buseForm\s*\(' \
    "$FE" --include="*.tsx" --include="*.ts" \
    --exclude="*.test.ts" --exclude="*.test.tsx" \
    2>/dev/null || true
)

# Pass 2: from candidates, check which ones lack zodResolver
for fp in "${CANDIDATES[@]}"; do
  if ! grep -qE 'zodResolver' "$fp" 2>/dev/null; then
    rel="${fp#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel — useForm without zodResolver"
    violations=$((violations+1))
  fi
done

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 forms without Zod"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations form(s) lack zodResolver"
  exit 1
fi
