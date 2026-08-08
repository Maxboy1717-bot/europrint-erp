#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  Legacy ACL Reviewer (PA2-14)
#  Rule: Legacy modules (compatibility/, remaining/, general/) must use
#  IAclTranslator + repository, NOT raw SQL in controllers.
#
#  Scans *.controller.ts files inside the three legacy modules and flags
#  any occurrence of sql.raw / db.execute / runQuery — those calls must
#  move into a repository fronted by an ACL translator under <module>/acl/.
#
#  See:
#   - apps/api/src/modules/shared/domain/acl/i-acl-translator.ts
#   - apps/api/src/modules/compatibility/acl/user-acl.ts (reference)
#   - apps/api/src/modules/remaining/acl/order-acl.ts   (reference)
#   - docs/context-map.md "Legacy / Migration" section
# ════════════════════════════════════════════════════════════════════
set -uo pipefail

RED='\033[0;31m'; YEL='\033[0;33m'; GRN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BASE="$ROOT_DIR/apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Legacy ACL Reviewer (PA2-14)                        ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

COUNT=0
TOTAL_FILES=0
for module in compatibility remaining general; do
  DIR="$BASE/$module"
  if [ ! -d "$DIR" ]; then
    echo -e "  ${YEL}⚠${NC} skip: $module/ not found"
    continue
  fi
  found=$(grep -rln -E "sql\.raw|db\.execute|runQuery" "$DIR" 2>/dev/null \
    | grep -E "\.controller\.ts$" || true)
  if [ -n "$found" ]; then
    n=$(echo "$found" | grep -c . || true)
    COUNT=$((COUNT + n))
    TOTAL_FILES=$((TOTAL_FILES + n))
    echo -e "  ${RED}✗${NC} $module/: raw SQL in controller(s):"
    echo "$found" | sed 's|^|     → |'
  else
    echo -e "  ${GRN}✓${NC} $module/: clean"
  fi
done

echo ""
echo -e "${BOLD}──────────────────────────────────────────────────────${NC}"
# RATCHET: pre-existing legacy controllers with raw SQL — fail only above baseline cap.
MAX_LEGACY_ACL="${MAX_LEGACY_ACL_VIOLATIONS:-3}"
if [ "$COUNT" -gt "$MAX_LEGACY_ACL" ]; then
  echo -e "  ${RED}FAIL: $COUNT controller(s) with raw SQL in legacy modules (exceeds cap of $MAX_LEGACY_ACL).${NC}"
  echo ""
  echo "  Action:"
  echo "    1. Move the SQL into a Repository (apps/api/src/modules/<module>/repositories/)."
  echo "    2. Pair it with an IAclTranslator under <module>/acl/."
  echo "    3. Controller calls repo → translator.toDomain(row) → DTO."
  echo ""
  echo "  See docs/context-map.md ACL section + the two reference translators."
  exit 1
elif [ "$COUNT" -gt 0 ]; then
  echo -e "  ${YEL}WARN: $COUNT controller(s) with raw SQL at/below cap of $MAX_LEGACY_ACL — pre-existing, migrate over time.${NC}"
  echo "  FAIL: 0"
  exit 0
fi
echo -e "  ${GRN}PASS: 0 legacy controller raw-SQL violations${NC}"
echo ""
exit 0
