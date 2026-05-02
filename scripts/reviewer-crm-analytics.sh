#!/usr/bin/env bash
# reviewer-crm-analytics.sh — Task #432 Sprint 3B
# CRM analitika algoritmlarining mavjudligini tekshiradi

set -euo pipefail
FAIL=0

ok()   { echo "OK:   $1"; }
fail() { echo "FAIL: $1"; ((FAIL++)); }

# --- Fayl mavjudligi tekshiruvi ---

FILES=(
  "apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts"
  "apps/api/src/modules/crm/domain/services/elo-rating.service.ts"
  "apps/api/src/modules/crm/analytics/rfm.service.ts"
  "apps/api/src/modules/crm/analytics/clv.service.ts"
  "apps/api/src/modules/crm/analytics/churn.service.ts"
  "apps/api/src/modules/crm/analytics/funnel.service.ts"
  "apps/api/src/modules/crm/analytics/cohort.service.ts"
)

for f in "${FILES[@]}"; do
  if test -f "$f"; then
    ok "$f mavjud"
  else
    fail "$f topilmadi"
  fi
done

# --- Algoritm tekshiruvlari ---

# TZ-D12: Temporal decay lambda
if grep -q "Math.log(2)" apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts; then
  ok "Lead Scorer: temporal decay λ = ln(2)/T mavjud"
else
  fail "Lead Scorer: temporal decay λ = ln(2)/T topilmadi"
fi

# TZ-D12: Sigmoid funksiyasi
if grep -q "1 / (1 + Math.exp" apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts; then
  ok "Lead Scorer: sigmoid funksiyasi mavjud"
else
  fail "Lead Scorer: sigmoid funksiyasi topilmadi"
fi

# TZ-D12: Training (gradient descent)
if grep -q "trainModel\|gradient" apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts; then
  ok "Lead Scorer: trainModel (gradient descent) mavjud"
else
  fail "Lead Scorer: trainModel topilmadi"
fi

# TZ-D13: Elo K-faktor
if grep -q "gamesPlayed" apps/api/src/modules/crm/domain/services/elo-rating.service.ts; then
  ok "Elo: K-faktor (gamesPlayed) mavjud"
else
  fail "Elo: K-faktor topilmadi"
fi

# TZ-D13: Elo natijalar
if grep -q "perfect\|late_1day\|late_3plus\|failed" apps/api/src/modules/crm/domain/services/elo-rating.service.ts; then
  ok "Elo: natija turlari (perfect/late_1day/late_3plus/failed) mavjud"
else
  fail "Elo: natija turlari topilmadi"
fi

# TZ-39: RFM quintile
if grep -q "NTILE\|quintile\|rScore\|fScore\|mScore" apps/api/src/modules/crm/analytics/rfm.service.ts; then
  ok "RFM: quintile segmentatsiya mavjud"
else
  fail "RFM: quintile segmentatsiya topilmadi"
fi

# TZ-39: RFM segmentlar
if grep -q "Champions\|Loyal\|At-Risk\|Lost" apps/api/src/modules/crm/analytics/rfm.service.ts; then
  ok "RFM: segmentlar (Champions/Loyal/At-Risk/Lost) mavjud"
else
  fail "RFM: segmentlar topilmadi"
fi

# TZ-40: CLV oddiy formula
if grep -q "churnRate\|grossMargin\|purchaseFreq" apps/api/src/modules/crm/analytics/clv.service.ts; then
  ok "CLV: oddiy formula (avgOrderValue × freq × margin / churnRate) mavjud"
else
  fail "CLV: oddiy formula topilmadi"
fi

# TZ-40: CLV DCF
if grep -q "discountRate\|presentValues\|Math.pow" apps/api/src/modules/crm/analytics/clv.service.ts; then
  ok "CLV: DCF diskontlangan formula mavjud"
else
  fail "CLV: DCF formula topilmadi"
fi

# TZ-41: Churn sigmoid
if grep -q "sigmoid\|1 + Math.exp" apps/api/src/modules/crm/analytics/churn.service.ts; then
  ok "Churn: sigmoid funksiyasi mavjud"
else
  fail "Churn: sigmoid funksiyasi topilmadi"
fi

# TZ-41: Churn risk darajalari
if grep -q "HIGH\|MEDIUM\|LOW" apps/api/src/modules/crm/analytics/churn.service.ts; then
  ok "Churn: risk darajalari (HIGH/MEDIUM/LOW) mavjud"
else
  fail "Churn: risk darajalari topilmadi"
fi

# TZ-42: Win-rate formula
if grep -q "winRate\|safeDiv\|won.*lost\|lost.*won" apps/api/src/modules/crm/analytics/funnel.service.ts; then
  ok "Funnel: Win-Rate formula mavjud"
else
  fail "Funnel: Win-Rate formula topilmadi"
fi

# TZ-42: Pipeline velocity
if grep -q "velocity\|SalesCycle\|avgSalesCycle" apps/api/src/modules/crm/analytics/funnel.service.ts; then
  ok "Funnel: Pipeline Velocity mavjud"
else
  fail "Funnel: Pipeline Velocity topilmadi"
fi

# TZ-43: Cohort retention
if grep -q "retentionByPeriod\|cohortMonth\|cohortSize" apps/api/src/modules/crm/analytics/cohort.service.ts; then
  ok "Cohort: retention matrix mavjud"
else
  fail "Cohort: retention matrix topilmadi"
fi

# --- Hardcoded score tekshiruvi ---
HCSCORE=$(grep -rn "score\s*=\s*[0-9][0-9]$\|=\s*70\b\|=\s*80\b" \
  apps/api/src/modules/crm/analytics/ \
  apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts \
  apps/api/src/modules/crm/domain/services/elo-rating.service.ts \
  2>/dev/null | grep -v "\.spec\.\|test\." | wc -l || true)
if [ "$HCSCORE" -gt 5 ]; then
  fail "WARN: $HCSCORE ta hardcoded score qiymati topildi (algoritmik bo'lishi kerak)"
else
  ok "Hardcoded score yo'q (${HCSCORE} ta topildi, ≤5 ruxsat)"
fi

# --- Yakuniy natija ---
echo ""
echo "=== Natija: FAIL=${FAIL} ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: crm-analytics barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: ${FAIL} ta muammo topildi"
  exit 1
fi
