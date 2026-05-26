#!/usr/bin/env bash
# Reviewer for Rule 19: delete/approve/reject mutations must be guarded by AlertDialog.
# PERFORMANCE: Two-pass bulk grep (find violating candidates, then check for guard)
#   instead of per-file loops over ~2035 tsx files on Windows.
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

# Pass 1: find files that have destructive onClick mutations (bulk, 1 process)
mapfile -t CANDIDATES < <(
  grep -rlE 'onClick=\{?\s*\(?[^)]*\)?\s*=>\s*(delete|approve|reject|cancel|remove|destroy)[A-Z][a-zA-Z]*Mutation\.mutate\(' \
    "$FE" --include="*.tsx" 2>/dev/null || true
)

# Pass 2: from candidates, check which ones lack AlertDialog/ConfirmDialog
for fp in "${CANDIDATES[@]}"; do
  if ! grep -qE 'AlertDialog|ConfirmDialog' "$fp" 2>/dev/null; then
    rel="${fp#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel — destructive mutate without AlertDialog"
    violations=$((violations+1))
  fi
done

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 unprotected destructive mutations"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations unprotected destructive mutation(s)"
  exit 1
fi
