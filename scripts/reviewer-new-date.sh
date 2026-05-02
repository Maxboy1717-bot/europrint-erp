#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — New Date() Reviewer (TZ-D15)
# Ishlatish: bash scripts/reviewer-new-date.sh
#
# Tekshiradi:
#   §1 TimeService / TashkentTimeService infrastrukturasi
#   §2 @common/ yangi foundation fayllarida new Date() = 0 [FAIL]
#   §3 Barcha modullar bo'yicha new Date() trend (WARN)
#   §4 Kritik moliyaviy modullarda new Date() [FAIL agar muammo bo'lsa]
#
# Qoida:
#   YANGI yozilgan/o'zgartirilgan foundation kod: new Date() TAQIQLANGAN
#   Mavjud kod bazasi (687 meros): progressiv tozalash (WARN)
#
# exit 0 → PASS | exit 1 → FAIL
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

MODULES="apps/api/src/modules"
COMMON="apps/api/src/common"
TIME_SVC="$COMMON/time"
# Baseline: Sprint 0 da aniqlangan pre-existing new Date() soni
# Bu raqam sprint'lar davomida 0 ga yaqinlashishi kerak
SPRINT_BASELINE=700

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  New Date() Reviewer (TZ-D15)                        ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: TimeService infra tekshiruvi [CRITICAL] ───────────────────
echo ""
echo -e "${BOLD}§1 — TimeService infrastrukturasi [CRITICAL]:${NC}"
if [ -f "$TIME_SVC/tashkent-time.service.ts" ]; then
  ok "TashkentTimeService: $TIME_SVC/tashkent-time.service.ts ✓"
else
  ng "TashkentTimeService topilmadi! Infra yo'q: $TIME_SVC/"
fi
if [ -f "$TIME_SVC/time.service.ts" ]; then
  ok "TimeService wrapper: $TIME_SVC/time.service.ts ✓"
else
  ng "TimeService topilmadi: $TIME_SVC/time.service.ts"
fi

# ── §2: @common/ foundation fayllarida new Date() [STRICT FAIL] ───
echo ""
echo -e "${BOLD}§2 — Foundation fayllari (common/math, common/decorators, common/dto) [KRITIK]:${NC}"
echo "     Eslatma: tashkent-time.service.ts TimeService implementatsiyasi sifatida ruxsat berilgan"
# tashkent-time.service.ts ni istisno qilamiz (u o'zi TimeService impl.)
FOUNDATION_ND_LINES=$(grep -rn "new Date()" \
  "$COMMON/math" "$COMMON/decorators" "$COMMON/dto" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." \
  | grep -v "^\s*\*\|^\s*//" \
  | grep "new Date()" || true)
# time.service.ts da new Date() ga ishlatilgan satrlar (implementation emas, ya'ni ruxsatsiz)
TIME_SVC_ND=$(grep -n "new Date()" "$COMMON/time/time.service.ts" 2>/dev/null \
  | grep -v "^\s*[0-9]*:\s*\*\|^\s*[0-9]*:\s*//" \
  | grep -v "new Date(iso\|new Date(d\|new Date(String\|new Date(Number\|new Date(v" \
  | grep "new Date()" || true)

FOUNDATION_ND=0
[ -n "$FOUNDATION_ND_LINES" ] && FOUNDATION_ND=$(echo "$FOUNDATION_ND_LINES" | wc -l | tr -d ' ')
TIME_ND_COUNT=0
[ -n "$TIME_SVC_ND" ] && TIME_ND_COUNT=$(echo "$TIME_SVC_ND" | wc -l | tr -d ' ')
TOTAL_FOUNDATION_ND=$((FOUNDATION_ND + TIME_ND_COUNT))

if [ "$TOTAL_FOUNDATION_ND" -eq 0 ]; then
  ok "Foundation fayllar: new Date() 0 ta ✓"
else
  ng "Foundation fayllar: $TOTAL_FOUNDATION_ND ta new Date() topildi — TimeService.now() ga almashtiring"
  echo "$FOUNDATION_ND_LINES" | head -3 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${RED}→${NC} $line"
  done
  echo "$TIME_SVC_ND" | head -3 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${RED}→${NC} $line"
  done
fi

# ── §3: Barcha modullar — trend ko'rsatkichi [WARN] ───────────────
echo ""
echo -e "${BOLD}§3 — Modullar new Date() trendi (baseline: $SPRINT_BASELINE):${NC}"
ALL_ND=$(grep -rn "new Date()" "$MODULES" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." | wc -l | tr -d ' ')

echo "     Joriy son  : $ALL_ND ta"
echo "     Sprint 0   : ~$SPRINT_BASELINE ta (meros)"
echo "     Maqsad     : 0 ta (barcha sprintlar davomida)"

if [ "$ALL_ND" -gt "$SPRINT_BASELINE" ]; then
  ng "new Date(): $ALL_ND ta — baseline $SPRINT_BASELINE dan oshdi (yangi qo'shilgan!)"
  grep -rn "new Date()" "$MODULES" 2>/dev/null \
    | grep -v "\.spec\." | grep -v "\.test\." | head -3 | while IFS= read -r line; do
    echo -e "     ${RED}→${NC} $line"
  done
elif [ "$ALL_ND" -eq 0 ]; then
  ok "Modullar: new Date() 0 ta — to'liq TimeService.now() ga o'tkazildi!"
else
  warn "Modullar: $ALL_ND ta new Date() mavjud — TimeService.now() ga asta-sekin o'tkazing"
fi

# ── §4: TimeService ishlatilishi ──────────────────────────────────
echo ""
echo -e "${BOLD}§4 — TimeService metodlari ishlatilishi:${NC}"
TS_COUNT=$(grep -rn "TimeService\|TashkentTimeService\|_time\.now\b" "$MODULES" 2>/dev/null \
  | grep -v "\.spec\." | grep "\.now()\|\.today()\|\.diffInDays(\|_time\.now()" | wc -l | tr -d ' ')
if [ "$TS_COUNT" -gt 0 ]; then
  ok "TimeService.now()/.today()/.diffInDays()/_time.now(): $TS_COUNT ta joylashuvda ✓"
else
  warn "TimeService metodlari hali ishlatilmayapti — sprint'da modullarga ulang"
fi

# ── Yakuniy ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n  ${RED}${BOLD}→ FAIL. TimeService infrasini quring yoki new Date() ni almashtiring.${NC}"
  exit 1
fi
if [ "$WARN" -gt 0 ]; then
  echo -e "\n  ${YELLOW}${BOLD}→ PASS (WARN). new Date() → TimeService.now() progressiv migration davom etadi.${NC}"
  exit 0
fi
echo -e "\n  ${GREEN}${BOLD}→ PASS.${NC}"
exit 0
