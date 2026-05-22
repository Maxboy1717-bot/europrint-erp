#!/usr/bin/env bash
# Reviewer for Rule 19: delete/approve/reject mutations must be guarded by AlertDialog.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FE="$ROOT_DIR/artifacts/erp-dashboard/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 19: Mutations Require AlertDialog              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$FE" ]; then echo "frontend dir not found"; exit 0; fi

violations=0
# Flag direct delete/approve/reject/cancel mutate() calls inside onClick without AlertDialog in the file
while IFS= read -r file; do
  # Check that an onClick lambda calls a destructive verb mutation directly,
  # AND the file has no AlertDialog/ConfirmDialog component.
  if grep -qE 'onClick=\{?\s*\(?[^)]*\)?\s*=>\s*(delete|approve|reject|cancel|remove|destroy)[A-Z][a-zA-Z]*Mutation\.mutate\(' "$file" 2>/dev/null; then
    if ! grep -qE 'AlertDialog|ConfirmDialog' "$file" 2>/dev/null; then
      rel="${file#$ROOT_DIR/}"
      echo -e "${RED}✗${NC} $rel — destructive mutate without AlertDialog"
      violations=$((violations+1))
    fi
  fi
done < <(find "$FE" -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 unprotected destructive mutations"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations unprotected destructive mutation(s)"
  exit 1
fi
