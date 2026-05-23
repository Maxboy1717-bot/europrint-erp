#!/usr/bin/env bash
# Reviewer for Rule 18: no `any` type.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 18: No \`any\` Type                              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
# Match: `: any` (annotation), `as any` (cast), `<any>` (generic), `any[]`
while IFS= read -r file; do
  hits=$(grep -nE ':\s*any(\b|\[)|<any>|as any\b|Array<any>' "$file" 2>/dev/null \
    | grep -vE '//.*any|/\*.*any|\.spec\.|\.test\.|test/' \
    | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count any-usage"
    violations=$((violations+count))
  fi
done < <(find "$ROOT_DIR/apps/api/src" "$ROOT_DIR/artifacts/erp-dashboard/src" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" -not -name "*.test.ts" -not -name "*.d.ts" 2>/dev/null | head -1500)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 \`any\` uses"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations \`any\` use(s)"
  exit 1
fi
