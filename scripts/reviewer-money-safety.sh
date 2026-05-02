#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
PASS_COUNT=0; FAIL_COUNT=0; WARN_COUNT=0

ok()   { echo -e "  ${GREEN}✓${NC}  $1"; ((PASS_COUNT++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $1"; ((FAIL_COUNT++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; ((WARN_COUNT++)) || true; }

MODULES="apps/api/src/modules"
COMMON="apps/api/src/common"
MONEY_VO="$COMMON/money/money.vo.ts"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    reviewer-money-safety.sh  — Sprint 1              ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"

# ── §1: Money VO Decimal.js mavjudligi ────────────────────────
echo ""
echo -e "${BOLD}§1 — Money VO (Decimal.js) tekshiruvi [FAIL agar yo'q bo'lsa]:${NC}"
if [ -f "$MONEY_VO" ]; then
  ok "Money VO mavjud: $MONEY_VO"
else
  ng "Money VO topilmadi: $MONEY_VO"
fi
if grep -q "from 'decimal.js'" "$MONEY_VO" 2>/dev/null; then
  ok "Decimal.js import: ✓"
else
  ng "Decimal.js import yo'q — Money VO float ishlatmasligi kerak"
fi
if grep -q "ROUND_HALF_EVEN" "$MONEY_VO" 2>/dev/null; then
  ok "ROUND_HALF_EVEN (banker's rounding): ✓"
else
  ng "ROUND_HALF_EVEN topilmadi — yuvarlash qoidasi noto'g'ri"
fi
if grep -q "CurrencyMismatchError" "$MONEY_VO" 2>/dev/null; then
  ok "CurrencyMismatchError himoyasi: ✓"
else
  ng "CurrencyMismatchError yo'q — valyuta tekshiruvi bo'lishi kerak"
fi

# ── §2: Hardcoded cost ratio (0.65) TAQIQLANGAN ───────────────
echo ""
echo -e "${BOLD}§2 — Hardcoded cost ratio taqiqlanish tekshiruvi [FAIL]:${NC}"
HC_LINES=$(grep -rn "\b0\.65\b" "$MODULES" "$COMMON" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." | grep -v "^#\|^\s*//" || true)
HC_COUNT=0
[ -n "$HC_LINES" ] && HC_COUNT=$(echo "$HC_LINES" | grep -v "^$" | wc -l | tr -d ' ') || true
if [ "$HC_COUNT" -eq 0 ]; then
  ok "Hardcoded 0.65 cost ratio yo'q ✓"
else
  ng "$HC_COUNT ta joyda 0.65 hardcoded topildi — GL jadvalidan hisoblang"
  echo "$HC_LINES" | head -5 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${RED}→${NC} $line"
  done
fi

# ── §3: Float pul arifmetikasi taqiqlanishi ───────────────────
echo ""
echo -e "${BOLD}§3 — Float pul arifmetikasi [WARN]:${NC}"
FLOAT_PAT="parseFloat\s*(\|Number(\s*.*amount\|Number(\s*.*price\|Number(\s*.*cost\|Number(\s*.*total"
FLOAT_OPS=$(grep -rn -E "$FLOAT_PAT" "$MODULES" 2>/dev/null \
  | grep -v "\.spec\." | grep -v "\.test\." | grep -v "safeNum\|Money\.of" | head -10 || true)
FLOAT_COUNT=0
[ -n "$FLOAT_OPS" ] && FLOAT_COUNT=$(echo "$FLOAT_OPS" | grep -v "^$" | wc -l | tr -d ' ') || true
if [ "$FLOAT_COUNT" -eq 0 ]; then
  ok "Pul qiymatlarida xom float operatsiyasi yo'q ✓"
else
  warn "$FLOAT_COUNT ta pul/narx/summa float konvertatsiyasi — Money VO ni ko'rib chiqing"
  echo "$FLOAT_OPS" | head -3 | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "     ${YELLOW}→${NC} $line"
  done
fi

# ── §4: CFO GL jadvalidan hisoblash ───────────────────────────
echo ""
echo -e "${BOLD}§4 — CFO GL jadvaldan hisoblash [FAIL agar hardcoded bo'lsa]:${NC}"
CFO="$MODULES/compatibility/cfo.service.ts"
if [ -f "$CFO" ]; then
  if grep -q "gl_journal_entries\|account_code" "$CFO" 2>/dev/null; then
    ok "CFO: GL jadvalidan hisoblash mavjud ✓"
  else
    ng "CFO: GL jadvalidan hisoblash yo'q"
  fi
  HC_CFO=$(grep -n "\b0\.65\b\|hardcoded\|1_000_000_000" "$CFO" 2>/dev/null | grep -v "^\s*//" || true)
  if [ -z "$HC_CFO" ]; then
    ok "CFO: hardcoded qiymatlar yo'q ✓"
  else
    ng "CFO: hardcoded qiymatlar topildi — GL jadvalidan hisoblang"
    echo "$HC_CFO" | head -3 | while IFS= read -r line; do
      [ -n "$line" ] && echo -e "     ${RED}→${NC} $line"
    done
  fi
else
  ng "CFO service topilmadi: $CFO"
fi

# ── §5: AR Aging SQL-native tekshirish ────────────────────────
echo ""
echo -e "${BOLD}§5 — AR Aging SQL-native (N+1 yo'q) [FAIL agar for loop bo'lsa]:${NC}"
AR_HANDLER="$MODULES/finance/application/queries/ar-aging.handler.ts"
if [ -f "$AR_HANDLER" ]; then
  INVOICE_LOOPS=$(grep -n "for (" "$AR_HANDLER" 2>/dev/null \
    | grep -v "^\s*//" | grep -iE "invoice|getAllUnpaid" || true)
  if [ -z "$INVOICE_LOOPS" ]; then
    ok "AR Aging: invoice for loop yo'q — SQL-native ✓"
  else
    ng "AR Aging: invoice for loop topildi — SQL CASE WHEN ishlatilishi kerak"
    echo "$INVOICE_LOOPS" | head -3 | while IFS= read -r line; do
      echo -e "     ${RED}→${NC} $line"
    done
  fi
  if grep -qE "CASE|WHEN" "$AR_HANDLER" 2>/dev/null; then
    ok "AR Aging: SQL CASE/WHEN mavjud ✓"
  else
    ng "AR Aging: SQL CASE WHEN topilmadi"
  fi
  if grep -q "ECL_RATES\|ecl\b\|eclRate" "$AR_HANDLER" 2>/dev/null; then
    ok "AR Aging: ECL hisoblash mavjud ✓"
  else
    warn "AR Aging: ECL hisoblash topilmadi"
  fi
else
  ng "AR Aging handler topilmadi: $AR_HANDLER"
fi

# ── §6: Depreciation Service 4 usul ──────────────────────────
echo ""
echo -e "${BOLD}§6 — Depreciation Service (SL, DB, SYD, UOP) [FAIL]:${NC}"
DEP_SVC="$MODULES/finance/domain/services/depreciation.service.ts"
if [ -f "$DEP_SVC" ]; then
  ok "DepreciationService mavjud ✓"
  for method in "straightLine" "doubleDeclining" "sumOfYearsDigits" "unitsOfProduction"; do
    if grep -q "$method" "$DEP_SVC" 2>/dev/null; then
      ok "  Usul mavjud: $method ✓"
    else
      ng "  Usul topilmadi: $method"
    fi
  done
else
  ng "DepreciationService topilmadi: $DEP_SVC"
fi

# ── §7: Investment Service NPV/IRR ────────────────────────────
echo ""
echo -e "${BOLD}§7 — Investment Service (NPV/IRR/Payback/Liquidity) [FAIL]:${NC}"
INV_SVC="$MODULES/finance/domain/services/investment.service.ts"
if [ -f "$INV_SVC" ]; then
  ok "InvestmentService mavjud ✓"
  for fn in "npv" "irr" "discountedPayback" "liquidityRatios" "cashflow13Week"; do
    if grep -q "$fn" "$INV_SVC" 2>/dev/null; then
      ok "  Funksiya mavjud: $fn ✓"
    else
      ng "  Funksiya topilmadi: $fn"
    fi
  done
else
  ng "InvestmentService topilmadi: $INV_SVC"
fi

# ── §8: Idempotency kalit (TZ-D06) ───────────────────────────
echo ""
echo -e "${BOLD}§8 — Advance Payment Idempotency (TZ-D06) [FAIL]:${NC}"
SO_AGG="$MODULES/sd/domain/aggregates/sales-order.aggregate.ts"
if [ -f "$SO_AGG" ]; then
  if grep -q "paymentIds\|idempotencyKey\|idempoten" "$SO_AGG" 2>/dev/null; then
    ok "Advance payment idempotency kalit mavjud ✓"
  else
    ng "Advance payment idempotency yo'q"
  fi
  if grep -q "Set<\|new Set" "$SO_AGG" 2>/dev/null; then
    ok "Set<string> idempotency container mavjud ✓"
  else
    ng "Set<string> idempotency container yo'q"
  fi
else
  ng "SalesOrder aggregate topilmadi: $SO_AGG"
fi

# ── Yakuniy natija ─────────────────────────────────────────────
echo ""
echo -e "══════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASS: $PASS_COUNT${NC}  |  ${RED}FAIL: $FAIL_COUNT${NC}  |  ${YELLOW}WARN: $WARN_COUNT${NC}"
echo -e "══════════════════════════════════════════════════════"
echo ""
if [ "$FAIL_COUNT" -eq 0 ]; then
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "  → PASS (WARN). Sprint 1 asosiy talablar bajarilgan."
  else
    echo "  → PASS. Sprint 1 moliya mexanizmi to'liq bajarildi."
  fi
  exit 0
else
  echo "  → FAIL. $FAIL_COUNT ta muammo bartaraf etilishi kerak."
  exit 1
fi
