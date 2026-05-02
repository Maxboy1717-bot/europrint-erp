#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }

WMS_DIR="$ROOT/apps/api/src/modules/wms/presentation"

FAKE=$(grep -rn "{ ok: true }\|{ success: true }\|return { ok\|return { success" \
  "$WMS_DIR" --include="*.ts" | grep -v "spec\.\|//" | wc -l)
check "WMS fake response: 0 ta (hozir: $FAKE)" \
  "$([ "$FAKE" -eq 0 ] && echo 0 || echo 1)"

for f in wms-counts wms-extended wms-goods-issue wms-inventory wms-rental wms-stock wms-warehouses; do
  FILE="$WMS_DIR/${f}.controller.ts"
  if [ -f "$FILE" ]; then
    STUB=$(grep -E "ok: true|success: true" "$FILE" 2>/dev/null | wc -l)
    check "${f}.controller.ts: 0 stub (hozir: $STUB)" \
      "$([ "$STUB" -eq 0 ] && echo 0 || echo 1)"
  else
    echo "[FAIL] $FILE topilmadi"; FAIL=1
  fi
done

[ "$FAIL" -eq 0 ] && echo "BARCHA TEKSHIRUVLAR O'TDI ✓" || { echo "FAIL"; exit 1; }
