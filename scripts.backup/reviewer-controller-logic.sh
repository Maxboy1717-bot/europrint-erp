#!/usr/bin/env bash
# Reviewer for Rule 6: Controllers must be transport-only.
# Flags controllers that contain .reduce/.filter/.map chains, raw db.* calls,
# or Date arithmetic — those belong in a service.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CTRL_DIR="$ROOT_DIR/apps/api/src/modules"
FAIL=0; PASS=0
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 6: Controller is Transport Only                ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$CTRL_DIR" ]; then
  echo "Controller dir not found: $CTRL_DIR"; exit 0
fi

violations=0
while IFS= read -r file; do
  # Check for db.* calls inside controllers (excluding constructor injection)
  db_calls=$(grep -nE 'this\.(db|drizzle)\.' "$file" 2>/dev/null | grep -v 'constructor\|@Inject' | head -3)
  reduce_chain=$(grep -nE '\.reduce\([^)]*=>' "$file" 2>/dev/null | head -3)
  filter_map=$(grep -nE '\.filter\([^)]*\)\.map\(' "$file" 2>/dev/null | head -3)
  date_arith=$(grep -nE 'new Date\([^)]*\)\s*[-+]\s*new Date' "$file" 2>/dev/null | head -3)
  if [ -n "$db_calls" ] || [ -n "$reduce_chain" ] || [ -n "$filter_map" ] || [ -n "$date_arith" ]; then
    rel="${file#$ROOT_DIR/}"
    echo -e "${RED}✗${NC} $rel"
    [ -n "$db_calls" ]    && echo "  db.* call: $db_calls"
    [ -n "$reduce_chain" ] && echo "  reduce chain: $reduce_chain"
    [ -n "$filter_map" ]   && echo "  filter().map(): $filter_map"
    [ -n "$date_arith" ]   && echo "  Date arithmetic: $date_arith"
    violations=$((violations+1))
  fi
done < <(find "$CTRL_DIR" -name "*.controller.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 controller-logic violations"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations controller(s) contain business logic"
  exit 1
fi
