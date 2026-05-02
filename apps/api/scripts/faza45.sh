#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 4+5 — Asosiy modullar: SQL → Service ga ko'chirish
#  crm, director, hr, finance, pos, iot, mes, wms, mm, qc, sd...
#  Ishlatish: bash apps/api/scripts/faza45.sh
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"

GRN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

hdr()  { echo ""; echo -e "${BLU}${BOLD}── $1 ──${NC}"; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🟡 FAZA 4+5 — Asosiy modullar SQL → Service${NC}"
echo ""

MODULES="crm director hr finance pos iot mes wms mm qc sd lms core security mro logistics"

GRAND_TOTAL=0; GRAND_CLEAN=0

for MOD in $MODULES; do
  DIR="$SRC/modules/$MOD"
  [ -d "$DIR" ] || continue

  CTLS=$(find "$DIR" -name "*.controller.ts" | grep -v "\.spec\." | sort)
  [ -z "$CTLS" ] && continue

  MOD_TOTAL=0; MOD_CLEAN=0
  MOD_ISSUES=""

  while IFS= read -r ctrl; do
    [ -z "$ctrl" ] && continue
    MOD_TOTAL=$((MOD_TOTAL+1))
    GRAND_TOTAL=$((GRAND_TOTAL+1))
    SQL_N=$(grep -cE "\bdb\.(execute|select|insert|update|delete|query)\(" "$ctrl" 2>/dev/null || true)
    SQL_N=${SQL_N:-0}
    CTRL_NAME=$(basename "$ctrl")

    if [ "$SQL_N" -eq 0 ]; then
      MOD_CLEAN=$((MOD_CLEAN+1))
      GRAND_CLEAN=$((GRAND_CLEAN+1))
    else
      MOD_ISSUES="${MOD_ISSUES}|${CTRL_NAME}:${SQL_N}"
    fi
  done < <(echo "$CTLS")

  if [ "$MOD_CLEAN" -eq "$MOD_TOTAL" ]; then
    ok "$MOD/  ($MOD_TOTAL ctrl — hammasi toza)"
  else
    PCT=0; [ $MOD_TOTAL -gt 0 ] && PCT=$((MOD_CLEAN * 100 / MOD_TOTAL))
    fail "$MOD/  ($MOD_CLEAN/$MOD_TOTAL toza, $PCT%)"
    echo "$MOD_ISSUES" | tr '|' '\n' | grep ":" | while IFS=: read -r ctrl sql; do
      echo "       $sql× SQL — $ctrl"
    done
  fi
done

hdr "SQL Mavjud Controllerlar — To'liq Ro'yxat"
grep -rlE "\bdb\.(execute|select|insert|update|delete|query)\(" "$SRC/modules/" --include="*.controller.ts" \
  2>/dev/null | \
  grep -v "compatibility/\|remaining/" | \
  sort | \
  while IFS= read -r f; do
    N=$(grep -cE "\bdb\.(execute|select|insert|update|delete|query)\(" "$f")
    MOD=$(echo "${f#$SRC/modules/}" | awk -F'/' '{print $1}')
    echo "  $N× [$MOD] $(basename "$f")"
  done

hdr "NATIJA"
PCT=0; [ $GRAND_TOTAL -gt 0 ] && PCT=$((GRAND_CLEAN * 100 / GRAND_TOTAL))
echo "  Controller ichida SQL yo'q : $GRAND_CLEAN / $GRAND_TOTAL  ($PCT%)"
echo ""
if [ $GRAND_CLEAN -eq $GRAND_TOTAL ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 4+5 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza6.sh${NC}"
else
  REMAIN=$((GRAND_TOTAL - GRAND_CLEAN))
  info "$REMAIN ta controller hali SQL o'z ichida saqlaydi"
  info "Har birini: SQL → Service, Controller → svc.method() chaqirish"
fi
echo ""
