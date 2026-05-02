#!/usr/bin/env bash
# Task #438: TypeScript 273 compile xatosi tekshiruvi
# Ishlatish: bash scripts/reviewer-438.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

check() {
  local label="$1"
  local result="$2"  # 0=pass, 1=fail
  local detail="${3:-}"
  if [ "$result" -eq 0 ]; then
    echo "[PASS] $label"
  else
    echo "[FAIL] $label${detail:+ — $detail}"
    FAIL=1
  fi
}

# --- 1. tsc --noEmit xatolar soni 0 bo'lishi kerak ---
echo "=== 1. TypeScript compile xatolari ==="
TS_ERRORS=$(cd "$ROOT/apps/api" && npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
check "tsc: 0 xato (hozir: $TS_ERRORS)" "$([ "$TS_ERRORS" -eq 0 ] && echo 0 || echo 1)" "npx tsc --noEmit"

# --- 2. tax-calculator .isOk() ishlatmasligi kerak ---
echo "=== 2. tax-calculator.service.ts ==="
ISOK_COUNT=$(grep -c "\.isOk()" "$ROOT/apps/api/src/modules/hr/domain/services/tax-calculator.service.ts" || true)
check "tax-calculator: .isOk() yo'q (hozir: $ISOK_COUNT)" "$([ "$ISOK_COUNT" -eq 0 ] && echo 0 || echo 1)"

VALUE_COUNT=$(grep -c "\.value\b" "$ROOT/apps/api/src/modules/hr/domain/services/tax-calculator.service.ts" || true)
check "tax-calculator: .value yo'q (hozir: $VALUE_COUNT)" "$([ "$VALUE_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 3. drizzle-orm cross-instance type konflikti yo'q ---
# @neondatabase/serverless va boshqa paketlar o'z variantini yaratadi —
# fizik instansiya soni emas, TypeScript type konflikti yo'qolishi muhim.
echo "=== 3. drizzle-orm instansiyalar ==="
DRIZZLE_INSTANCES=$(ls "$ROOT/node_modules/.pnpm/" | grep "^drizzle-orm@" | wc -l | tr -d ' ')
CROSS_ERRORS=$(cd "$ROOT/apps/api" && npx tsc --noEmit 2>&1 | grep "not assignable.*drizzle-orm" | wc -l | tr -d ' ' || true)
check "drizzle-orm: cross-instance type konflikti yo'q (hozir: $CROSS_ERRORS ta xato; instansiyalar: $DRIZZLE_INSTANCES)" \
  "$([ "$CROSS_ERRORS" -eq 0 ] && echo 0 || echo 1)" \
  "lib/db peerDependencies @opentelemetry/api kerak"

# --- 4. POS modulida TS xatolari yo'q ---
echo "=== 4. POS modul xatolari ==="
POS_ERRORS=$(cd "$ROOT/apps/api" && npx tsc --noEmit 2>&1 | grep "error TS" | grep "src/modules/pos/" | wc -l | tr -d ' ' || true)
check "POS moduli: 0 xato (hozir: $POS_ERRORS)" "$([ "$POS_ERRORS" -eq 0 ] && echo 0 || echo 1)"

# --- Yakuniy ---
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
else
  echo "XATO: $FAIL tekshiruv FAIL (yuqoridagi [FAIL] satrlarini ko'ring)"
  exit 1
fi
