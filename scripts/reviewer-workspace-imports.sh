#!/usr/bin/env bash
# Task #437 tekshiruv skripti — 6 ta aniq qoida
set -euo pipefail

ERRORS=0
pass() { echo "  OK: $1"; }
fail() { echo "XATO: $1"; ERRORS=$((ERRORS + 1)); }

echo "=== 1. @workspace/math-utils API da 0 import ==="
MATH_IMPORTS=$(grep -rn "@workspace/math-utils" apps/api/src --include="*.ts" 2>/dev/null || true)
if [ -z "$MATH_IMPORTS" ]; then
  pass "@workspace/math-utils apps/api/src da 0 ta import"
else
  fail "@workspace/math-utils hali import qilinmoqda:"
  echo "$MATH_IMPORTS"
fi

echo ""
echo "=== 2. tax-calculator @common/math/math-utils ishlatadi ==="
TC="apps/api/src/modules/hr/domain/services/tax-calculator.service.ts"
if grep -q "@common/math/math-utils" "$TC"; then
  pass "tax-calculator.service.ts → @common/math/math-utils"
else
  fail "tax-calculator.service.ts noto'g'ri import ishlatmoqda"
fi

echo ""
echo "=== 3. @common/math/math-utils.ts mavjud ==="
MATHFILE="apps/api/src/common/math/math-utils.ts"
if [ -f "$MATHFILE" ]; then
  pass "$MATHFILE mavjud"
else
  fail "$MATHFILE topilmadi"
fi

echo ""
echo "=== 4. safeNum va roundTo eksport qilingan ==="
if grep -q "export.*safeNum" "$MATHFILE" && grep -q "export.*roundTo" "$MATHFILE"; then
  pass "safeNum va roundTo eksportlari mavjud"
else
  fail "safeNum yoki roundTo eksporti topilmadi"
fi

echo ""
echo "=== 5. @workspace/db dist/cjs/index.js mavjud ==="
DB_DIST="lib/db/dist/cjs/index.js"
if [ -f "$DB_DIST" ]; then
  pass "$DB_DIST mavjud"
else
  fail "$DB_DIST topilmadi — pnpm --filter @workspace/db build ishlatib build qiling"
fi

echo ""
echo "=== 6. redis.module.ts REDIS_CLIENT import mavjud ==="
REDIS_MOD=$(grep -rn "REDIS_CLIENT" apps/api/src --include="*.ts" 2>/dev/null | head -3 || true)
if [ -n "$REDIS_MOD" ]; then
  pass "REDIS_CLIENT injection token aniqlandi"
else
  fail "REDIS_CLIENT token topilmadi — redis.module.ts tekshiring"
fi

echo ""
echo "=============================="
if [ "$ERRORS" -eq 0 ]; then
  echo "NATIJA: Barcha 6 tekshirish o'tdi"
  exit 0
else
  echo "NATIJA: $ERRORS ta xato topildi"
  exit 1
fi
