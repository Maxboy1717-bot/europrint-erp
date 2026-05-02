#!/usr/bin/env bash
# Task #439: Result<T> unwrap controller-larda tekshiruvi
# Ishlatish: bash scripts/reviewer-439.sh
# Ishlatish (ro'yxat rejimi): bash scripts/reviewer-439.sh --list
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

check() {
  local label="$1"
  local result="$2"
  local detail="${3:-}"
  if [ "$result" -eq 0 ]; then
    echo "[PASS] $label"
  else
    echo "[FAIL] $label${detail:+ — $detail}"
    FAIL=1
  fi
}

# --- Ro'yxat rejimi ---
if [ "${1:-}" = "--list" ]; then
  echo "=== Result to'g'ridan-to'g'ri qaytarayotgan controllerlar ==="
  grep -rln "^\s*return\s\+await\s\+this\.\w\+\.\w\+" \
    "$ROOT/apps/api/src" --include="*.controller.ts" | grep -v "spec" || echo "(hech narsa topilmadi)"
  exit 0
fi

# --- 1. unwrapOrThrow fayli mavjud ---
echo "=== 1. unwrapOrThrow utility ==="
UTIL_FILE="$ROOT/apps/api/src/common/http-result.ts"
check "http-result.ts mavjud" "$([ -f "$UTIL_FILE" ] && echo 0 || echo 1)"
UNWRAP_COUNT=$(grep -c "unwrapOrThrow" "$UTIL_FILE" 2>/dev/null || echo 0)
check "unwrapOrThrow export qilingan" "$([ "$UNWRAP_COUNT" -ge 1 ] && echo 0 || echo 1)"

# --- 2. Controller-larda to'g'ridan-to'g'ri Result return yo'q ---
echo "=== 2. Controller-larda Result unwrap ==="
# Xavfli pattern: return await this.service.method(  — unwrapOrThrow yo'q
# Istisno: wms-warehouse-gateway (repo Promise<Row> qaytaradi, Result<T> emas)
#           qc-inspections (queryBus InspectionsResponse qaytaradi, Result<T> emas)
#           commandBus/queryBus/eventBus — CQRS patterndagi handler chaqiruvlar
BARE_RETURNS=$(grep -rn "^\s*return await this\." \
  "$ROOT/apps/api/src" --include="*.controller.ts" 2>/dev/null \
  | { grep -v "spec\.\|unwrapOrThrow\|unwrapOrInternal\|unwrapOrBadRequest\|unwrapOrNotFound\|\/\/\|wms-warehouse-gateway\|qc-inspections\|commandBus\|queryBus\|eventBus" || true; } \
  | wc -l | tr -d ' ')
check "Controller bare return: 0 ta (hozir: $BARE_RETURNS)" \
  "$([ "$BARE_RETURNS" -eq 0 ] && echo 0 || echo 1)" \
  "unwrapOrThrow ishlatilmagan joylar bor"

# --- 3. unwrapOrThrow ishlatilayotgan controllerlar soni ---
echo "=== 3. unwrapOrThrow qamrovi ==="
USING_UNWRAP=$(grep -rl "unwrapOrThrow" "$ROOT/apps/api/src" --include="*.controller.ts" | wc -l | tr -d ' ')
echo "[INFO] unwrapOrThrow ishlatayotgan controller fayllari: $USING_UNWRAP"

# --- 4. Spesifik yuqori-xavfli controllerlar tekshiruvi ---
echo "=== 4. Yuqori-xavfli controllerlar ==="
HIGH_RISK=(
  "modules/logistics/presentation/logistics.controller.ts"
  "modules/finance/presentation/finance-payments.controller.ts"
  "modules/hr/presentation/hr-payroll.controller.ts"
  "modules/qc/presentation/qc-defects.controller.ts"
  "modules/kanban/presentation/kanban.controller.ts"
)
for rel in "${HIGH_RISK[@]}"; do
  filepath="$ROOT/apps/api/src/$rel"
  if [ -f "$filepath" ]; then
    RAW=$(grep -n "^\s*return await this\." "$filepath" 2>/dev/null || true)
    if [ -z "$RAW" ]; then
      BARE_ACTUAL=0
    else
      BARE_ACTUAL=$(printf '%s\n' "$RAW" | { grep -v "unwrapOrThrow" || true; } | grep -c "." || true)
    fi
    check "$rel: 0 bare return (hozir: $BARE_ACTUAL)" "$([ "${BARE_ACTUAL:-0}" -eq 0 ] && echo 0 || echo 1)"
  else
    echo "[SKIP] $rel — fayl topilmadi"
  fi
done

# --- Yakuniy ---
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
else
  echo "XATO: $FAIL tekshiruv FAIL"
  exit 1
fi
