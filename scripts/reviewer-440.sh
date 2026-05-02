#!/usr/bin/env bash
# Task #442: Non-null assertion !. tekshiruvi
# Ishlatish: bash scripts/reviewer-440.sh
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

# --- 1. apps/api/src da !. 0 bo'lishi (spec va comment bundan mustasno) ---
echo "=== 1. Non-null assertion !. soni ==="
NON_NULL=$({ grep -rn "!\." "$ROOT/apps/api/src" --include="*.ts" || true; } | \
  { grep -v "\.spec\.\|// \|\/\*" || true; } | wc -l | tr -d ' ')
check "non-null-dot: 0 ta (hozir: $NON_NULL)" \
  "$([ "$NON_NULL" -eq 0 ] && echo 0 || echo 1)" \
  "grep -rn '!\.' apps/api/src --include='*.ts' | grep -v 'spec\|//'"

# --- 2. HR moduli (eng ko'p zararlangan) ---
echo "=== 2. HR moduli ==="
HR_NON_NULL=$({ grep -rn "!\." "$ROOT/apps/api/src/modules/hr" --include="*.ts" || true; } | \
  { grep -v "\.spec\.\|// " || true; } | wc -l | tr -d ' ')
check "HR moduli !. soni: 0 (hozir: $HR_NON_NULL)" \
  "$([ "$HR_NON_NULL" -eq 0 ] && echo 0 || echo 1)"

# --- 3. Logistics/MM moduli ---
echo "=== 3. Logistics va MM moduli ==="
LOG_NON_NULL=$({ grep -rn "!\." "$ROOT/apps/api/src/modules/logistics" \
  "$ROOT/apps/api/src/modules/mm" --include="*.ts" 2>/dev/null || true; } | \
  { grep -v "\.spec\.\|// " || true; } | wc -l | tr -d ' ')
check "Logistics+MM moduli !. soni: 0 (hozir: $LOG_NON_NULL)" \
  "$([ "$LOG_NON_NULL" -eq 0 ] && echo 0 || echo 1)"

# --- 4. result.data!. pattern yo'q (eng xavflisi) ---
echo "=== 4. result.data!. pattern ==="
DATA_BANG=$({ grep -rn "\.data!\." "$ROOT/apps/api/src" --include="*.ts" || true; } | \
  { grep -v "\.spec\.\|// " || true; } | wc -l | tr -d ' ')
check "result.data!. pattern: 0 (hozir: $DATA_BANG)" \
  "$([ "$DATA_BANG" -eq 0 ] && echo 0 || echo 1)"

# --- 5. map.get()! pattern yo'q ---
echo "=== 5. Map.get()! pattern ==="
MAP_BANG=$({ grep -rn "\.get(.\+)!" "$ROOT/apps/api/src" --include="*.ts" || true; } | \
  { grep -v "\.spec\.\|// " || true; } | wc -l | tr -d ' ')
check "map.get()! pattern: 0 (hozir: $MAP_BANG)" \
  "$([ "$MAP_BANG" -eq 0 ] && echo 0 || echo 1)"

# --- Yakuniy ---
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
else
  echo "XATO: $FAIL tekshiruv FAIL"
  echo ""
  echo "Zararlangan joylar:"
  { grep -rn "!\." "$ROOT/apps/api/src" --include="*.ts" || true; } | { grep -v "\.spec\.\|// " || true; } | head -20
  exit 1
fi
