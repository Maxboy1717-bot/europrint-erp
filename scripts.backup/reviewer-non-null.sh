#!/usr/bin/env bash
# Reviewer for Rule 13: no `!` non-null assertions.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 13: No Non-null Assertions (!)                 ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
while IFS= read -r file; do
  # Match patterns: `identifier!.x`, `]!`, `)!.`, `>!.`
  hits=$(grep -nE '[a-zA-Z_)\]]!\.[a-zA-Z_]|[a-zA-Z_)\]]!\[' "$file" 2>/dev/null \
    | grep -vE 'test/|\.spec\.|\.test\.|//.*!|\s*//.*!.*' \
    | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count non-null assertion(s)"
    echo "$hits" | sed 's/^/    /'
    violations=$((violations+count))
  fi
done < <(find "$ROOT_DIR/apps/api/src" "$ROOT_DIR/artifacts/erp-dashboard/src" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" -not -name "*.test.ts" 2>/dev/null | head -500)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 non-null assertions"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations non-null assertion(s)"
  exit 1
fi
