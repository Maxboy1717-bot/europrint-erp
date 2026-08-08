#!/usr/bin/env bash
# Reviewer for Rule 9: try/catch required around DB calls in repos/services.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$ROOT_DIR/apps/api/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 9: try/catch Required Around DB Calls          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$SRC" ]; then echo "Source dir not found"; exit 0; fi

violations=0
while IFS= read -r file; do
  # File has a DB call that we can detect?
  if grep -qE '(await db\.|await this\.db\.)' "$file" 2>/dev/null; then
    # Accept ANY of:
    #   - explicit try/catch block
    #   - safeCall(...) wrapper
    #   - Result.fromPromise / err()/ok() pattern
    # These all produce a Result<T> outcome without throwing.
    if grep -qE 'try\s*\{|}\s*catch\s*\(|safeCall[<(]|safeAsync[<(]|Result\.from|return\s+Err\(' "$file" 2>/dev/null; then
      continue
    fi
    rel="${file#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel — has DB call but no try/catch nor safeCall"
    violations=$((violations+1))
  fi
done < <(find "$SRC" \( -name "*.repo.ts" -o -name "*.repository.ts" -o -name "*.service.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 try/catch violations"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations file(s) missing try/catch around DB calls"
  exit 1
fi
