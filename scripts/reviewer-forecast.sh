#!/usr/bin/env bash
# scripts/reviewer-forecast.sh
# Task #430 Sprint 2C — Talab Prognozi tekshiruv skripti

PASS=0
FAIL=0

ok()   { echo "OK:   $*"; PASS=$((PASS + 1)); }
fail() { echo "FAIL: $*"; FAIL=$((FAIL + 1)); }

FORECAST_SVC="apps/api/src/modules/ai/forecast/forecast.service.ts"
HW_SVC="apps/api/src/modules/ai/forecast/holt-winters.service.ts"
SCHEMA="apps/api/src/shared/db/schema-forecast.ts"
TEST="apps/api/test/demand-forecast.spec.ts"

# 1. Fayllar mavjudmi?
[ -f "$FORECAST_SVC" ] && ok "forecast.service.ts mavjud" || fail "forecast.service.ts TOPILMADI"
[ -f "$HW_SVC" ]       && ok "holt-winters.service.ts mavjud" || fail "holt-winters.service.ts TOPILMADI"
[ -f "$SCHEMA" ]       && ok "schema-forecast.ts mavjud" || fail "schema-forecast.ts TOPILMADI"
[ -f "$TEST" ]         && ok "demand-forecast.spec.ts mavjud" || fail "demand-forecast.spec.ts TOPILMADI"

# 2. SMA sliding window
grep -q "slice(i - n + 1, i + 1)" "$FORECAST_SVC" 2>/dev/null \
  && ok "SMA sliding window formulasi mavjud" \
  || fail "SMA sliding window formulasi topilmadi"

# 3. EMA formulasi
grep -q "alpha \* safeNum\|1 - alpha) \* smoothed\|1 - alpha) \* prev" "$FORECAST_SVC" 2>/dev/null \
  && ok "EMA formulasi mavjud" \
  || fail "EMA formulasi topilmadi"

# 4. Hardcoded alpha yo'q
HCALPHA=$(grep -c "bestAlpha = 0\.3$\|bestAlpha = 0\.5$" "$FORECAST_SVC" 2>/dev/null || true)
[ "${HCALPHA:-0}" -eq 0 ] \
  && ok "Hardcoded alpha yo'q (grid search ishlatilgan)" \
  || fail "${HCALPHA} ta hardcoded alpha qiymati topildi"

# 5. Grid search mavjud
grep -q "for.*a = 5\|a <= 95\|gridSearchAlpha" "$FORECAST_SVC" 2>/dev/null \
  && ok "Grid search alpha mavjud" \
  || fail "Grid search alpha topilmadi"

# 6. MAPE + RMSE + MAE
grep -q "mape" "$FORECAST_SVC" 2>/dev/null \
  && grep -q "rmse" "$FORECAST_SVC" 2>/dev/null \
  && grep -q "mae" "$FORECAST_SVC" 2>/dev/null \
  && ok "MAPE + RMSE + MAE metrikalari mavjud" \
  || fail "Xato metrikalari (MAPE/RMSE/MAE) to'liq emas"

# 7. HW Level formulasi
grep -q "alpha \* (y\[t\] - seasonal\[si\])" "$HW_SVC" 2>/dev/null \
  && ok "HW Level formulasi (L_t) mavjud" \
  || fail "HW Level formulasi topilmadi"

# 8. HW Trend formulasi
grep -q "beta \* (newL - prevL)" "$HW_SVC" 2>/dev/null \
  && ok "HW Trend formulasi (T_t) mavjud" \
  || fail "HW Trend formulasi topilmadi"

# 9. HW Seasonality formulasi
grep -q "gamma \* (y\[t\] - newL)" "$HW_SVC" 2>/dev/null \
  && ok "HW Seasonality formulasi (S_t) mavjud" \
  || fail "HW Seasonality formulasi topilmadi"

# 10. HW minimum tarix
grep -q "2 \* s\|2 \* seasonLength" "$HW_SVC" 2>/dev/null \
  && ok "HW minimum tarix (2×s) tekshiruvi mavjud" \
  || fail "HW minimum tarix (2×s) tekshiruvi topilmadi"

# 11. OLS Chiziqli Regressiya
grep -q "fitLinear\|slope\|intercept" "$FORECAST_SVC" 2>/dev/null \
  && ok "OLS Chiziqli Regressiya (fitLinear) mavjud" \
  || fail "OLS Chiziqli Regressiya topilmadi"

# 12. OLS β₁ formulasi
grep -q "ssXY\|ssXX" "$FORECAST_SVC" 2>/dev/null \
  && ok "OLS β₁ formulasi (ssXY/ssXX) mavjud" \
  || fail "OLS β₁ formulasi topilmadi"

# 13. DB Schema
grep -q "forecast_series" "$SCHEMA" 2>/dev/null \
  && ok "forecast_series DB jadvali mavjud" \
  || fail "forecast_series DB jadvali topilmadi"

# 14. DB Schema method ustun
grep -q "method" "$SCHEMA" 2>/dev/null \
  && ok "forecast_series.method ustuni mavjud" \
  || fail "forecast_series.method ustuni topilmadi"

# 15. @Calculation decorator
CALC_COUNT=$(grep -c "@Calculation(" "$FORECAST_SVC" 2>/dev/null || echo 0)
HW_CALC=$(grep -c "@Calculation(" "$HW_SVC" 2>/dev/null || echo 0)
TOTAL_CALC=$((CALC_COUNT + HW_CALC))
[ "$TOTAL_CALC" -ge 4 ] \
  && ok "@Calculation decorator ${TOTAL_CALC} ta metod uchun" \
  || fail "@Calculation kamroq (${TOTAL_CALC}, kerak ≥4)"

# 16. xavfsiz math utilities
grep -q "safeNum\|safeAvg\|safeDiv" "$FORECAST_SVC" 2>/dev/null \
  && grep -q "safeNum\|safeAvg\|safeDiv" "$HW_SVC" 2>/dev/null \
  && ok "xavfsiz math utility'lar ishlatilgan" \
  || fail "xavfsiz math utility'lar ishlatilmagan"

echo ""
echo "=== Natija: FAIL=${FAIL} ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: forecast-algorithms barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "WARN: ${FAIL} ta tekshiruv muvaffaqiyatsiz"
  exit 1
fi
