#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 2 — compatibility/ module → Controller+Service
#  Ishlatish: bash apps/api/scripts/faza2.sh
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
COMPAT="$SRC/modules/compatibility"

GRN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

hdr()  { echo ""; echo -e "${BLU}${BOLD}── $1 ──${NC}"; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🔴 FAZA 2 — compatibility/ → Controller+Service${NC}"
echo ""

DONE=0; TOTAL=0; PENDING=()

hdr "Controller → Service holati"
while IFS= read -r ctrl; do
  TOTAL=$((TOTAL+1))
  NAME=$(basename "$ctrl" .controller.ts)
  SVC="${COMPAT}/${NAME}.service.ts"
  SQL_IN_CTRL=$(grep -c "db\.execute" "$ctrl" 2>/dev/null); SQL_IN_CTRL=${SQL_IN_CTRL:-0}
  HAS_ZOD=$(grep -q "createZodDto\|z\.object" "$ctrl" 2>/dev/null && echo "✅Zod" || echo "❌Zod")
  HAS_SVC_INJECT=$(grep -qE "constructor.*Svc|private.*svc|private.*Service" "$ctrl" 2>/dev/null \
    && echo "✅Inject" || echo "❌Inject")

  if [ -f "$SVC" ] && [ "$SQL_IN_CTRL" -eq 0 ]; then
    DONE=$((DONE+1))
    ok "${NAME}"
    echo "       SQL_ctrl:0 | $HAS_ZOD | $HAS_SVC_INJECT"
  elif [ -f "$SVC" ] && [ "$SQL_IN_CTRL" -gt 0 ]; then
    fail "${NAME} — service bor lekin ctrl ichida hali $SQL_IN_CTRL SQL bor"
    PENDING+=("$NAME")
  else
    fail "${NAME} — service yo'q | SQL_ctrl:$SQL_IN_CTRL | $HAS_ZOD | $HAS_SVC_INJECT"
    PENDING+=("$NAME")
  fi
done < <(find "$COMPAT" -name "*.controller.ts" | sort)

hdr "Bajarish kerak bo'lgan ishlar"
if [ ${#PENDING[@]} -eq 0 ]; then
  echo -e "  ${GRN}${BOLD}🎉 compatibility/ to'liq tayyor!${NC}"
else
  echo "  Har bir controller uchun:"
  echo "    1. <name>.service.ts fayl yaratish"
  echo "    2. Controller SQL → Service ga ko'chirish"
  echo "    3. Zod DTO qo'shish (@Body bo'lsa)"
  echo "    4. try/catch → NestJS exception"
  echo "    5. compatibility.module.ts ga service qo'shish"
  echo ""
  for name in "${PENDING[@]}"; do
    echo -e "  ${RED}→${NC}  $name"
    CTRL_FILE="$COMPAT/${name}.controller.ts"
    if [ -f "$CTRL_FILE" ]; then
      SQL_N=$(grep -c "db\.execute" "$CTRL_FILE" 2>/dev/null); SQL_N=${SQL_N:-0}
      BODY_N=$(grep -c "@Body()" "$CTRL_FILE" 2>/dev/null); BODY_N=${BODY_N:-0}
      ENDPOINTS=$(grep -c "@Get\|@Post\|@Put\|@Patch\|@Delete" "$CTRL_FILE" 2>/dev/null); ENDPOINTS=${ENDPOINTS:-0}
      echo "       $ENDPOINTS endpoint | $SQL_N SQL | $BODY_N @Body"
    fi
  done
fi

hdr "NATIJA"
echo ""
echo "  Tayyor   : $DONE / $TOTAL"
PCT=0; [ $TOTAL -gt 0 ] && PCT=$((DONE * 100 / TOTAL))
echo "  Progress : $PCT%"
echo ""

DONE_BARS=$((PCT / 5)); EMPTY=$((20 - DONE_BARS))
BAR="["
for i in $(seq 1 $DONE_BARS 2>/dev/null || true); do BAR="${BAR}█"; done
for i in $(seq 1 $EMPTY 2>/dev/null || true); do BAR="${BAR}░"; done
echo -e "  ${GRN}${BAR}] $PCT%${NC}"
echo ""
if [ $DONE -eq $TOTAL ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 2 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza3.sh${NC}"
else
  info "AI agent bilan har bir controllerni bitta-bitta qayta yozing"
  info "Namuna: pip.controller.ts + pip.service.ts"
fi
echo ""
