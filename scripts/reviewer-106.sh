#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }

PROC_DIR="$ROOT/apps/api/src/modules/queue/processors"

TODO_COUNT=$(grep -rn "// TODO\|//TODO" "$PROC_DIR" --include="*.ts" | wc -l)
check "Queue processor TODO: 0 ta (hozir: $TODO_COUNT)" \
  "$([ "$TODO_COUNT" -eq 0 ] && echo 0 || echo 1)"

for proc in email telegram pdf-generation mrp-run forecast-recalc label-print; do
  FILE="$PROC_DIR/${proc}.processor.ts"
  if [ -f "$FILE" ]; then
    TODO=$(grep -E "// TODO|//TODO" "$FILE" 2>/dev/null | wc -l)
    check "${proc}.processor.ts: 0 TODO (hozir: $TODO)" \
      "$([ "$TODO" -eq 0 ] && echo 0 || echo 1)"
  else
    echo "[FAIL] $FILE topilmadi"; FAIL=1
  fi
done

[ "$FAIL" -eq 0 ] && echo "BARCHA TEKSHIRUVLAR O'TDI ✓" || { echo "FAIL"; exit 1; }
