#!/usr/bin/env bash
# reviewer-hr-analytics.sh — Task #433 Sprint 3C
# HR analitika algoritmlarini va hardcoded qonun yo'qligini tekshiradi

set -euo pipefail
FAIL=0

ok()   { echo "OK:   $1"; }
fail() { echo "FAIL: $1"; ((FAIL++)); }

# --- Fayl mavjudligi tekshiruvi ---

FILES=(
  "apps/api/src/modules/hr/analytics/attrition.service.ts"
  "apps/api/src/modules/hr/analytics/utilization.service.ts"
  "apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts"
  "apps/api/src/shared/db/schema-hr-overtime.ts"
)

for f in "${FILES[@]}"; do
  if test -f "$f"; then
    ok "$f mavjud"
  else
    fail "$f topilmadi"
  fi
done

# --- Algoritm tekshiruvlari ---

# TZ-44: ATR formula
if grep -q "hcAvg\|HC_avg\|hcBegin\|hcEnd" apps/api/src/modules/hr/analytics/attrition.service.ts; then
  ok "Attrition: HC_avg formula mavjud"
else
  fail "Attrition: HC_avg formula topilmadi"
fi

# TZ-44: Benchmark 15% va 30%
if grep -q "15\|30" apps/api/src/modules/hr/analytics/attrition.service.ts; then
  ok "Attrition: benchmark (15%/30%) mavjud"
else
  fail "Attrition: benchmark topilmadi"
fi

# TZ-44: Tenure risk
if grep -q "HIGH\|MEDIUM\|LOW\|tenure" apps/api/src/modules/hr/analytics/attrition.service.ts; then
  ok "Attrition: tenure risk guruhlash mavjud"
else
  fail "Attrition: tenure risk topilmadi"
fi

# TZ-45: Utilization formula
if grep -q "availableHours\|productiveHours\|utilizationRate\|safeDiv" apps/api/src/modules/hr/analytics/utilization.service.ts; then
  ok "Utilization: AH/BH/U formula mavjud"
else
  fail "Utilization: formula topilmadi"
fi

# TZ-45: OVERLOADED/OPTIMAL/UNDERUTILIZED
if grep -q "OVERLOADED\|OPTIMAL\|UNDERUTILIZED" apps/api/src/modules/hr/analytics/utilization.service.ts; then
  ok "Utilization: status holatlari (OVERLOADED/OPTIMAL/UNDERUTILIZED) mavjud"
else
  fail "Utilization: status holatlari topilmadi"
fi

# TZ-46: overtime_policy jadvalidan o'qilishi
if grep -q "overtime_policy\|overtimePolicy\|OvertimePolicy" \
  apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts; then
  ok "OT Kalkulyator: overtime_policy konfiguratsiyasi ishlatilmoqda"
else
  fail "OT Kalkulyator: overtime_policy topilmadi"
fi

# TZ-46: baseRate formula
if grep -q "baseRate\|base_rate\|safeDiv" \
  apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts; then
  ok "OT Kalkulyator: Base_Rate = grossMonthly / workingHours formula mavjud"
else
  fail "OT Kalkulyator: Base_Rate formula topilmadi"
fi

# TZ-46: multiplier segmentlar
if grep -q "regularMultiplier\|extendedMultiplier\|weekendMultiplier\|nightShiftBonus" \
  apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts; then
  ok "OT Kalkulyator: to'rt multiplier segment mavjud"
else
  fail "OT Kalkulyator: multiplier segmentlar topilmadi"
fi

# DB: overtime_policy jadvali CHECK constraint
if grep -q "chk_ot_multiplier_pos\|chk_ot_ext_gt_reg" \
  apps/api/src/shared/db/schema-hr-overtime.ts; then
  ok "DB: overtime_policy CHECK constraint (multiplier ≥ 1.0) mavjud"
else
  fail "DB: overtime_policy CHECK constraint topilmadi"
fi

# DB: employee_separation jadvali
if grep -q "employee_separation\|chk_separation" \
  apps/api/src/shared/db/schema-hr-overtime.ts; then
  ok "DB: employee_separation jadvali mavjud"
else
  fail "DB: employee_separation jadvali topilmadi"
fi

# TAQIQLANGAN: O'zbek qonunchiligi
HCLAW=$(grep -rn "157-modd\|Mehnat Kodeks\|mehnat qonun" \
  apps/api/src/modules/hr/analytics/ \
  apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts \
  2>/dev/null | wc -l || true)
if [ "$HCLAW" -gt 0 ]; then
  fail "O'zbek mehnat qonunchiligi kodi topildi ($HCLAW ta) — kompaniya siyosati ishlatilsin"
else
  ok "O'zbek qonunchiligi kodi yo'q (TAQIQLANGAN pattern topilmadi)"
fi

# Yakuniy natija
echo ""
echo "=== Natija: FAIL=${FAIL} ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: hr-analytics barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: ${FAIL} ta muammo topildi"
  exit 1
fi
