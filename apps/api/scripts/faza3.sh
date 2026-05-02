#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 3 — remaining/ module → Controller+Service
#  Ishlatish: bash apps/api/scripts/faza3.sh
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
REMAIN="$SRC/modules/remaining"

GRN='\033[0;32m'; RED='\033[0;31m'; BLU='\033[0;34m'
CYN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

hdr()  { echo ""; echo -e "${BLU}${BOLD}── $1 ──${NC}"; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🔴 FAZA 3 — remaining/ → Controller+Service${NC}"
echo ""

DONE=0; TOTAL=0; PENDING=()

hdr "remaining/ holati"
while IFS= read -r ctrl; do
  TOTAL=$((TOTAL+1))
  NAME=$(basename "$ctrl" .controller.ts)
  SVC="${REMAIN}/${NAME}.service.ts"
  SQL_IN_CTRL=$(grep -c "db\.execute" "$ctrl" 2>/dev/null); SQL_IN_CTRL=${SQL_IN_CTRL:-0}

  if [ -f "$SVC" ] && [ "$SQL_IN_CTRL" -eq 0 ]; then
    DONE=$((DONE+1))
    ok "${NAME}"
  else
    fail "${NAME} — SQL_ctrl:$SQL_IN_CTRL | service:$([ -f "$SVC" ] && echo bor || echo YOQ)"
    PENDING+=("$NAME")
  fi
done < <(find "$REMAIN" -name "*.controller.ts" 2>/dev/null | sort)

if [ ${#PENDING[@]} -gt 0 ]; then
  hdr "Bajarish kerak"
  for name in "${PENDING[@]}"; do
    echo -e "  ${RED}→${NC}  $name"
    CTRL_FILE="$REMAIN/${name}.controller.ts"
    if [ -f "$CTRL_FILE" ]; then
      SQL_N=$(grep -c "db\.execute" "$CTRL_FILE" 2>/dev/null); SQL_N=${SQL_N:-0}
      EP=$(grep -c "@Get\|@Post\|@Put\|@Patch\|@Delete" "$CTRL_FILE" 2>/dev/null); EP=${EP:-0}
      echo "       $EP endpoint | $SQL_N SQL"
    fi
  done
fi

hdr "NATIJA"
PCT=0; [ $TOTAL -gt 0 ] && PCT=$((DONE * 100 / TOTAL))
echo "  Tayyor: $DONE / $TOTAL  ($PCT%)"
echo ""
if [ $DONE -eq $TOTAL ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 3 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza45.sh${NC}"
else
  info "Namuna: pip.controller.ts + pip.service.ts arxitekturasi"
fi
echo ""
