#!/usr/bin/env bash
# Reviewer for Rule 20: every frontend form uses zodResolver.
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
while IFS= read -r file; do
  # File uses useForm() but doesn't import zodResolver
  if grep -qE '\buseForm\s*\(' "$file" 2>/dev/null; then
    if ! grep -qE 'zodResolver' "$file" 2>/dev/null; then
      rel="${file#$ROOT_DIR/}"
      echo -e "${RED}✗${NC} $rel — useForm without zodResolver"
      violations=$((violations+1))
    fi
  fi
done < <(find "$FE" \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.test.ts" -not -name "*.test.tsx" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 forms without Zod"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations form(s) lack zodResolver"
  exit 1
fi
