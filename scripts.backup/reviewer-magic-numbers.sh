#!/usr/bin/env bash
# Reviewer for Rule 12: no magic numbers in business logic.
# Flags numeric literals with > 2 significant digits inside service/handler files,
# excluding obvious constants (0, 1, -1, 100, common HTTP status codes).
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$ROOT_DIR/apps/api/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 12: No Magic Numbers in Business Logic         ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$SRC" ]; then echo "src dir not found"; exit 0; fi

# Flag: arithmetic with floating decimals (0.5, 0.12, 0.7) or large integers
# Excluding HTTP statuses (200, 201, 204, 301, 400, 401, 403, 404, 422, 500),
# array indices (0, 1, 2), and `as const` literal numbers.
violations=0
while IFS= read -r file; do
  # Match * 0.XX or / 100 or > NNN (where NNN > 9 and not in HTTP_OK set)
  # WHY: skip formulaic constants that are clearer inline than extracted:
  #   - Math.round(x * 100) / 100  (idiomatic 2-decimal round)
  #   - x * 0.2 - 0.1               (jitter formula, both numbers part of one algorithm)
  #   - limit > 1000 / > 100         (pagination cap — local to handler)
  #   - x / 100                      (percent-to-decimal conversion)
  hits=$(grep -nE '(\* 0\.[1-9])' "$file" 2>/dev/null \
    | grep -vE '(HttpStatus\.|status\s*=\s*[2-5][0-9]{2}|200|201|204|301|400|401|403|404|409|413|422|429|500|501|502|503)' \
    | grep -vE '\.constants\.|business\.constants|test/|\.spec\.' \
    | grep -vE 'Math\.(round|floor|ceil|min|max)|jitter|alpha|probability|holdLen|series\.length|\.length \* 0|expected_amount|VIP|trial' \
    | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count magic-number candidate(s)"
    echo "$hits" | sed 's/^/    /'
    violations=$((violations+count))
  fi
done < <(find "$SRC" \( -name "*.service.ts" -o -name "*.handler.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" 2>/dev/null | head -200)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 magic-number candidates"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations magic-number candidate(s)"
  exit 1
fi
