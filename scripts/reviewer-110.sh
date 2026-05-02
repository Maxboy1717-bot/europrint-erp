#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }

SD_FILE="$ROOT/apps/api/src/modules/sd/presentation/sd-deliveries.controller.ts"
ROLES=$(grep -c "@Roles\|@Public" "$SD_FILE" 2>/dev/null || echo 0)
check "sd-deliveries.controller.ts: @Roles yoki @Public bor ($ROLES ta)" \
  "$([ "$ROLES" -ge 1 ] && echo 0 || echo 1)"

# reviewer-jwt-guard: exit code orqali tekshirish (grep "FAIL" summary satrini ham ushlaydi)
bash "$ROOT/scripts/reviewer-jwt-guard.sh" > /dev/null 2>&1
GUARD_EXIT=$?
check "reviewer-jwt-guard: exit 0 (FAIL=0)" \
  "$([ "$GUARD_EXIT" -eq 0 ] && echo 0 || echo 1)"

[ "$FAIL" -eq 0 ] && echo "BARCHA TEKSHIRUVLAR O'TDI ✓" || { echo "FAIL"; exit 1; }
