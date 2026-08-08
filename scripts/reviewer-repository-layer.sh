#!/usr/bin/env bash
# Reviewer for Rule 10: Repository only does DB I/O; no business logic.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$ROOT_DIR/apps/api/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 10: Repository Layer Only                      ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$SRC" ]; then echo "Source dir not found"; exit 0; fi

violations=0
while IFS= read -r file; do
  # Business-logic markers inside a repo, but NOT inside SQL template strings.
  # SQL aggregates like `SUM(x) * 0.05` and `value / 100` are legitimate query
  # syntax; the rule targets JavaScript-side post-processing.
  # Filter: track whether each line is inside an open `sql\`...\`` template
  # literal (multi-line aware — a single-line-only grep misses continuation
  # lines of a wrapped SQL string, e.g. a weighted-average ROUND(...) spread
  # across 3 lines) and only flag matches found OUTSIDE such a block.
  computed=$(awk '
    BEGIN { inSql = 0 }
    {
      line = $0
      if (!inSql && match(line, /sql`/)) { inSql = 1; line = substr(line, RSTART + RLENGTH) }
      if (inSql) {
        if (match(line, /`/)) { inSql = 0 }
        next
      }
      if (line ~ /(\* 0\.[0-9]|reduce\([^)]*\+)/) print NR
    }
  ' "$file" 2>/dev/null | wc -l | tr -d ' ')
  if [ -n "$computed" ] && [ "$computed" -gt 0 ]; then
    rel="${file#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel — repository contains $computed JS calc lines (move to service)"
    violations=$((violations+1))
  fi
done < <(find "$SRC" \( -name "*.repo.ts" -o -name "*.repository.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -name "*.spec.ts" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 repository-layer violations"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations repository file(s) contain business logic"
  exit 1
fi
