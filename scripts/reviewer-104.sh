#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }

RAW_SQL=$({ grep -rn "db\.execute(sql" "$ROOT/apps/api/src/modules/pos" \
  --include="*.ts" | grep -v "spec\.\|//" | wc -l; })
check "POS raw SQL execute: 0 ta (hozir: $RAW_SQL)" \
  "$([ "$RAW_SQL" -eq 0 ] && echo 0 || echo 1)"

RAW_SQL_ALL=$({ grep -rn "db\.execute(sql" "$ROOT/apps/api/src" \
  --include="*.repository.ts" | grep -v "spec\." | wc -l; })
check "Barcha repository raw SQL: 0 ta (hozir: $RAW_SQL_ALL)" \
  "$([ "$RAW_SQL_ALL" -eq 0 ] && echo 0 || echo 1)"

[ "$FAIL" -eq 0 ] && echo "BARCHA TEKSHIRUVLAR O'TDI ✓" || { echo "FAIL"; exit 1; }
