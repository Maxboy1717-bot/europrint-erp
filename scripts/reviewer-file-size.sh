#!/usr/bin/env bash
# Reviewer for Rule 16: file size limit (900 lines).
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LIMIT=900
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 16: File Size Limit (900 lines)                ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
while IFS= read -r file; do
  lines=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
  if [ "$lines" -gt "$LIMIT" ]; then
    rel="${file#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel — $lines lines"
    violations=$((violations+1))
  fi
done < <(find "$ROOT_DIR/apps/api/src" "$ROOT_DIR/artifacts/erp-dashboard/src" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/generated/*" -not -name "*.spec.ts" -not -name "*.test.ts" -not -name "*.generated.ts" 2>/dev/null | head -2000)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 oversize files"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations file(s) exceed $LIMIT lines"
  exit 1
fi
