#!/usr/bin/env bash
# reviewer-103.sh — Task #451 Array Safety: 20 fayl himoyalanganligini tekshirish
# AR-7/8/9: reviewer-array-safety.sh orqali FAIL:0 va 20 fayl mavjudligini ta'minlash
#
# CHIQISH:
#   exit 0 → PASS (barcha 20 fayl mavjud, FAIL=0)
#   exit 1 → FAIL (fayl yo'q yoki himoyalanmagan chaqiruvlar bor)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'

PASS=0
FAIL=0

ok() { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng() { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }

# Task #451 ga kiritilgan 20 fayl (to'g'ri yo'llar)
FILES=(
  "apps/api/src/modules/admin/position-permissions/position-permissions.service.ts"
  "apps/api/src/modules/ai/forecast/forecast.service.ts"
  "apps/api/src/modules/ai/forecast/holt-winters.service.ts"
  "apps/api/src/modules/common/search/kmeans.service.ts"
  "apps/api/src/modules/crm/analytics/clv.service.ts"
  "apps/api/src/modules/crm/analytics/funnel.service.ts"
  "apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts"
  "apps/api/src/modules/finance/domain/services/depreciation.service.ts"
  "apps/api/src/modules/finance/domain/services/investment.service.ts"
  "apps/api/src/modules/crm/analytics/cohort.service.ts"
  "apps/api/src/modules/hr/analytics/attrition.service.ts"
  "apps/api/src/modules/iot/oee/oee-calculator.service.ts"
  "apps/api/src/modules/logistics/domain/services/vrp.service.ts"
  "apps/api/src/modules/pos/services/pos-inventory-count-query.service.ts"
  "apps/api/src/modules/pp/domain/services/crp.service.ts"
  "apps/api/src/modules/pp/domain/services/scheduling.service.ts"
  "apps/api/src/modules/qc/domain/services/defect-detector.service.ts"
  "apps/api/src/modules/qc/domain/services/spc.service.ts"
  "apps/api/src/modules/remaining/ideal-rasm.service.ts"
  "apps/api/src/modules/remaining/material-balance.service.ts"
)

echo ""
echo "══════════════════════════════════════════════════════"
echo "  reviewer-103: Task #451 — 20 fayl mavjudligi"
echo "══════════════════════════════════════════════════════"

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    ok "$(basename "$file") — mavjud"
  else
    ng "$(basename "$file") — TOPILMADI: $file"
  fi
done

echo ""
echo "══════════════════════════════════════════════════════"
echo "  reviewer-array-safety.sh bilan to'liq tekshirish..."
echo "══════════════════════════════════════════════════════"

full_out=$(bash scripts/reviewer-array-safety.sh 2>&1)
full_fail=$(echo "$full_out" | grep -oP 'FAIL: \K[0-9]+' | tail -1)
full_pass=$(echo "$full_out" | grep -oP 'PASS: \K[0-9]+' | tail -1)

if [[ "${full_fail:-1}" -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC}  reviewer-array-safety.sh: PASS=${full_pass:-0}, FAIL=0"
  ((PASS++)) || true
else
  echo -e "  ${RED}✗${NC}  reviewer-array-safety.sh: FAIL=${full_fail}"
  echo "$full_out" | grep "✗" | head -10
  ((FAIL++)) || true
fi

echo ""
echo "══════════════════════════════════════════════════════"
printf "  PASS: %d  |  FAIL: %d\n" "$PASS" "$FAIL"
echo "══════════════════════════════════════════════════════"

if [[ "$FAIL" -eq 0 ]]; then
  exit 0
else
  exit 1
fi
