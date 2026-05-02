#!/usr/bin/env bash
set -euo pipefail
FAIL=0
PASS=0
WARN=0

echo "══════════════════════════════════════════════════════"
echo "  WMS Algorithms Reviewer — Task #428 Sprint 2A"
echo "══════════════════════════════════════════════════════"

check() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "  PASS: $label"
    ((PASS++)) || true
  else
    echo "  FAIL: $label"
    ((FAIL++)) || true
  fi
}

warn() {
  local label="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "  WARN: $label"
    ((WARN++)) || true
  fi
}

# ── TZ-01 EOQ ─────────────────────────────────────────────
check "eoq-calculator.service.ts mavjud" \
  "test -f apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts"

check "EOQ Wilson formula (Math.sqrt) ishlatilgan" \
  "grep -q 'Math.sqrt' apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts"

check "EOQ eoqRounded = ceil(eoq / packSize) * packSize" \
  "grep -q 'Math.ceil' apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts"

check "EOQ safeDiv ishlatilgan" \
  "grep -q 'safeDiv' apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts"

check "EOQ @Calculation dekoratoru mavjud" \
  "grep -q '@Calculation' apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts"

# ── TZ-02 Safety Stock ────────────────────────────────────
check "safety-stock.service.ts mavjud" \
  "test -f apps/api/src/modules/wms/domain/services/safety-stock.service.ts"

check "Safety Stock Z-table (1.282, 1.645, 2.326, 3.090) mavjud" \
  "grep -q '1.282' apps/api/src/modules/wms/domain/services/safety-stock.service.ts"

check "Safety Stock ikki o'zgaruvchan formula mavjud (sigmaL)" \
  "grep -q 'sigmaL' apps/api/src/modules/wms/domain/services/safety-stock.service.ts"

check "Safety Stock @Calculation dekoratoru mavjud" \
  "grep -q '@Calculation' apps/api/src/modules/wms/domain/services/safety-stock.service.ts"

# ── TZ-03 ROP ─────────────────────────────────────────────
check "rop.service.ts mavjud" \
  "test -f apps/api/src/modules/wms/domain/services/rop.service.ts"

check "ROP formula (avgDailyDemand * leadTimeDays + safetyStock) mavjud" \
  "grep -q 'leadTimeDays' apps/api/src/modules/wms/domain/services/rop.service.ts"

check "ROP @Calculation dekoratoru mavjud" \
  "grep -q '@Calculation' apps/api/src/modules/wms/domain/services/rop.service.ts"

# ── TZ-04 ABC/XYZ ─────────────────────────────────────────
check "abc-xyz.service.ts mavjud" \
  "test -f apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

check "ABC 80/95 chegaralari mavjud" \
  "grep -q '80' apps/api/src/modules/wms/analytics/abc-xyz.service.ts && grep -q '95' apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

check "XYZ 0.25/0.50 CV chegaralari mavjud" \
  "grep -q '0.25' apps/api/src/modules/wms/analytics/abc-xyz.service.ts && grep -q '0.50' apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

check "ABC/XYZ 9 toifa (AX..CZ) strategiya xaritasi mavjud" \
  "grep -q 'STRATEGY_MAP' apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

check "ABC/XYZ SQL WINDOW FUNCTION (SUM OVER ORDER BY) mavjud" \
  "grep -q 'SUM.*OVER.*ORDER BY' apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

check "ABC/XYZ calculateFromDb() DB-backed metodi mavjud" \
  "grep -q 'calculateFromDb' apps/api/src/modules/wms/analytics/abc-xyz.service.ts"

# ── TZ-05 Inventory Turnover / DIO ───────────────────────
check "inventory-turnover.service.ts mavjud" \
  "test -f apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts"

check "Turnover formula (annualCogs / avgInventoryValue) mavjud" \
  "grep -q 'annualCogs' apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts"

check "DIO = 365 / turnover formula mavjud" \
  "grep -q '365' apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts"

check "Inventory Turnover @Calculation dekoratoru mavjud" \
  "grep -q '@Calculation' apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts"

# ── TZ-D05 N+1 Fix ────────────────────────────────────────
check "batchInsertLowStockAlerts metodi repository da mavjud" \
  "grep -q 'batchInsertLowStockAlerts' apps/api/src/modules/wms/application/wms-extended.repository.ts"

check "ON CONFLICT batch insert (idempotent conflict target) mavjud" \
  "grep -q 'ON CONFLICT' apps/api/src/modules/wms/application/wms-extended.repository.ts"

check "wms_alerts partial unique index ensureSchemaAdditions da mavjud" \
  "grep -q 'uq_wms_alert_open_low_stock' apps/api/src/shared/db/invariants.ts"

check "checkAlerts N+1 loop olib tashlangan (batchInsert ishlatiladi)" \
  "grep -q 'batchInsertLowStockAlerts' apps/api/src/modules/wms/application/wms-extended.service.ts"

# ── N+1 antipattern tekshiruv ─────────────────────────────
AWAIT_N1=0
if grep -qrn "await.*findExistingLowStockAlert\|await.*createLowStockAlert" \
    apps/api/src/modules/wms/application/wms-extended.service.ts 2>/dev/null; then
  AWAIT_N1=1
fi
if [ "$AWAIT_N1" -gt 0 ]; then
  echo "  FAIL: N+1 antipattern hali ham wms-extended.service.ts da mavjud ($AWAIT_N1 ta)"
  ((FAIL++)) || true
else
  echo "  PASS: N+1 antipattern olib tashlangan (wms-extended.service.ts)"
  ((PASS++)) || true
fi

# ── Test fayli ────────────────────────────────────────────
check "wms-intelligence.spec.ts test fayli mavjud" \
  "test -f apps/api/test/wms-intelligence.spec.ts"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo "══════════════════════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "  → PASS. Sprint 2A WMS algoritmlari to'liq bajarildi."
  exit 0
else
  echo ""
  echo "  → FAIL. $FAIL ta muammo topildi."
  exit 1
fi
