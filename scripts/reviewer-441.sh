#!/usr/bin/env bash
# Task #443: Array xavfsizligi — return null/[], .reduce() initial value, array-guard tekshiruvi
# Ishlatish: bash scripts/reviewer-441.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" -eq 0 ]; then
    echo "[PASS] $label"
  else
    echo "[FAIL] $label"
    FAIL=1
  fi
}

# === 1. return-null: service-larda 0 ta bare "return null;" yoki "return [];" ===
# Catches both standalone `return null;` and inline `if (...) return null;`.
# Ternary expressions (? null : x) and Ok(null) are NOT matched by this pattern.
echo "=== 1. return-null: service-larda bare return null/[] ==="
RETURN_NULL=$({ grep -rn "return null;" \
  "$ROOT/apps/api/src" --include="*.service.ts" | \
  grep -v "spec\.\|\/\/" || true; } | \
  wc -l | tr -d ' ')
RETURN_EMPTY=$({ grep -rn "return \[\];" \
  "$ROOT/apps/api/src" --include="*.service.ts" | \
  grep -v "spec\.\|\/\/" || true; } | \
  wc -l | tr -d ' ')
TOTAL_BARE=$((RETURN_NULL + RETURN_EMPTY))
check "return-null: service-larda 0 ta bare return null/[] (hozir: $TOTAL_BARE)" \
  "$([ "$TOTAL_BARE" -eq 0 ] && echo 0 || echo 1)"

# === 2. array-guard: kmeans, defect-detector, scheduling da Array.isArray tekshiruvi bor ===
echo "=== 2. array-guard: massiv tekshiruvi ==="
KMEANS_FILE="$ROOT/apps/api/src/modules/common/search/kmeans.service.ts"
DEFECT_FILE="$ROOT/apps/api/src/modules/qc/domain/services/defect-detector.service.ts"
SCHED_FILE="$ROOT/apps/api/src/modules/pp/domain/services/scheduling.service.ts"

KMEANS_GUARD=$({ grep "Array.isArray" "$KMEANS_FILE" 2>/dev/null || true; } | wc -l | tr -d ' ')
check "kmeans.service.ts: Array.isArray guard bor ($KMEANS_GUARD ta)" \
  "$([ "${KMEANS_GUARD:-0}" -ge 1 ] && echo 0 || echo 1)"

DEFECT_GUARD=$({ grep "Array.isArray" "$DEFECT_FILE" 2>/dev/null || true; } | wc -l | tr -d ' ')
check "defect-detector.service.ts: Array.isArray guard bor ($DEFECT_GUARD ta)" \
  "$([ "${DEFECT_GUARD:-0}" -ge 1 ] && echo 0 || echo 1)"

SCHED_GUARD=$({ grep "Array.isArray" "$SCHED_FILE" 2>/dev/null || true; } | wc -l | tr -d ' ')
check "scheduling.service.ts: Array.isArray guard bor ($SCHED_GUARD ta)" \
  "$([ "${SCHED_GUARD:-0}" -ge 1 ] && echo 0 || echo 1)"

# === 3. reduce-init: .reduce((acc, x) => ...) formasida initial value mavjud ===
# Catches same-line .reduce((fn... calls that lack an obvious initial value.
# Multi-line reduce split as .reduce(\n  (fn is safe from this grep.
echo "=== 3. reduce-init: .reduce() initial value ==="
BARE_REDUCE=$({ grep -rn "\.reduce(\s*(" \
  "$ROOT/apps/api/src" --include="*.ts" | \
  grep -v "spec\.\|\/\/" | \
  grep -v ", \[\|, 0\b\|, {}\|, ''\|, \"\|, new \|, false\|, true\|, Money" || true; } | \
  wc -l | tr -d ' ')
check "reduce-init: barcha .reduce() larda initial value mavjud (topilmadi: $BARE_REDUCE)" \
  "$([ "$BARE_REDUCE" -eq 0 ] && echo 0 || echo 1)"

# === Yakuniy ===
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
else
  echo "XATO: $FAIL tekshiruv FAIL"
  exit 1
fi
