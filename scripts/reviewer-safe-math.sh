#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Safe Math Reviewer (TZ-D03)
# Ishlatish: bash scripts/reviewer-safe-math.sh
#
# Tekshiradi:
#   §1 math-utils.ts mavjudligi + safeDiv/safeNum funksiyalari
#   §2 parseFloat(String(  →  safeNum() ishlatilishi shart (FAIL)
#   §3 Himoyasiz bo'linma a/b — a yoki b DB dan keladigan qiymat (WARN)
#   §4 safeNum() ishlatilishi sanovi
#
# Qoidalar:
#   ✗ TAQIQLANGAN : parseFloat(String(x))
#   ✗ TAQIQLANGAN : variable / variable (DB qiymati)
#   ✓ MAJBURIY    : safeNum(x), safeDiv(a, b)
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
MATH_UTILS="$COMMON/math/math-utils.ts"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Safe Math Reviewer (TZ-D03)                         ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: math-utils.ts mavjudligi ──────────────────────────────────
echo ""
echo -e "${BOLD}§1 — math-utils.ts mavjudligi [CRITICAL]:${NC}"
if [ -f "$MATH_UTILS" ]; then
  HAS_SAFE_DIV=$(grep -c "export const safeDiv" "$MATH_UTILS" 2>/dev/null || echo 0)
  HAS_SAFE_NUM=$(grep -c "export const safeNum" "$MATH_UTILS" 2>/dev/null || echo 0)
  HAS_SAFE_AVG=$(grep -c "export const safeAvg" "$MATH_UTILS" 2>/dev/null || echo 0)
  HAS_PCT=$(grep -c "export const pct" "$MATH_UTILS" 2>/dev/null || echo 0)
  if [ "$HAS_SAFE_DIV" -gt 0 ] && [ "$HAS_SAFE_NUM" -gt 0 ]; then
    ok "math-utils.ts: safeDiv ✓ safeNum ✓ safeAvg=$HAS_SAFE_AVG pct=$HAS_PCT"
  else
    ng "math-utils.ts: safeDiv=$HAS_SAFE_DIV, safeNum=$HAS_SAFE_NUM — ikkalasi ham kerak!"
  fi
else
  ng "math-utils.ts topilmadi: $MATH_UTILS"
fi

# ── §2: parseFloat(String( qoldiqlari [FAIL gate] ─────────────────
echo ""
echo -e "${BOLD}§2 — parseFloat(String( qoldiqlari [KRITIK]:${NC}"
PFS_LINES=$(grep -rn "parseFloat(String(" "$MODULES" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." | grep "parseFloat(String(" || true)
PFS_COUNT=0
[ -n "$PFS_LINES" ] && PFS_COUNT=$(echo "$PFS_LINES" | wc -l | tr -d ' ') || PFS_COUNT=0

if [ "$PFS_COUNT" -eq 0 ]; then
  ok "parseFloat(String(: 0 ta — barcha joylar safeNum() ga o'tkazildi ✓"
else
  ng "parseFloat(String(: $PFS_COUNT ta topildi — BARCHA safeNum() ga almashtirilishi shart"
  echo "$PFS_LINES" | head -5 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${RED}→${NC} $line"
  done
fi

# ── §3: Himoyasiz bo'linma a/b tekshiruvi [WARN gate] ─────────────
echo ""
echo -e "${BOLD}§3 — Himoyasiz bo'linma (a/b) tekshiruvi [WARN]:${NC}"
echo "     Qoida: DB dan kelgan qiymatlar bo'linmada safeDiv() ishlatilishi kerak"

# Xavfli pattern: row.field / something yoki r[0].total / n
UNSAFE_DIV_LINES=$(grep -rn \
  -e "\b\(r\[0\]\?\.\|row\.\|result\[0\]\?\.\|data\.\|record\.\)\w\+\s*\/\s*[^/0-9 ]" \
  "$MODULES" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." \
  | grep -v "safeDiv" | grep -v "\/\/" \
  | head -10 || true)

UNSAFE_DIV_COUNT=0
[ -n "$UNSAFE_DIV_LINES" ] && UNSAFE_DIV_COUNT=$(echo "$UNSAFE_DIV_LINES" | grep -v "^$" | wc -l | tr -d ' ') || true

if [ "$UNSAFE_DIV_COUNT" -eq 0 ]; then
  ok "Himoyasiz DB bo'linma topilmadi ✓"
else
  warn "$UNSAFE_DIV_COUNT ta potensial himoyasiz bo'linma topildi — safeDiv() ni ko'rib chiqing"
  echo "$UNSAFE_DIV_LINES" | head -5 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${YELLOW}→${NC} $line"
  done
fi

# ── §4: safeNum/safeDiv ishlatilishi sanovi ───────────────────────
echo ""
echo -e "${BOLD}§4 — safeNum/safeDiv ishlatilishi:${NC}"
SAFE_NUM_COUNT=$(grep -rn "safeNum(" "$MODULES" 2>/dev/null | wc -l | tr -d ' ')
SAFE_DIV_COUNT=$(grep -rn "safeDiv(" "$MODULES" 2>/dev/null | wc -l | tr -d ' ')

if [ "$SAFE_NUM_COUNT" -gt 0 ]; then
  ok "safeNum(): $SAFE_NUM_COUNT ta joylashuvda ishlatilmoqda ✓"
else
  warn "safeNum() hech qayerda ishlatilmayapti — math-utils ni import qiling"
fi

if [ "$SAFE_DIV_COUNT" -gt 0 ]; then
  ok "safeDiv(): $SAFE_DIV_COUNT ta joylashuvda ishlatilmoqda ✓"
else
  warn "safeDiv() hech qayerda ishlatilmayapti — bo'linmalarda safeDiv ishlatilsin"
fi

# ── Yakuniy ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n  ${RED}${BOLD}→ FAIL. parseFloat(String() → safeNum() ga almashtiring.${NC}"
  exit 1
fi
echo -e "\n  ${GREEN}${BOLD}→ PASS.${NC}"
exit 0
