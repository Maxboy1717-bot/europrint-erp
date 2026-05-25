#!/usr/bin/env bash
# Reviewer for Rule 15: no sensitive data in logs.
# Flags logger.* lines that interpolate variables matching password/token/secret/etc.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 15: No Sensitive Data in Logs                  ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

violations=0
SENSITIVE='(password|passwd|pwd|token|secret|api[_-]?key|jwt|otp|pin|ssn|card[_-]?number|cvv|inn)'

while IFS= read -r file; do
  hits=$(grep -niE "(logger|log|console)\.[a-z]+\(.*\\\$\{[^}]*${SENSITIVE}[^}]*\}" "$file" 2>/dev/null | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count sensitive-data log(s)"
    echo "$hits" | sed 's/^/    /'
    violations=$((violations+count))
  fi
done < <(find "$ROOT_DIR/apps/api/src" \( -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" 2>/dev/null | head -500)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 sensitive-data log(s)"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations sensitive-data log(s)"
  exit 1
fi
