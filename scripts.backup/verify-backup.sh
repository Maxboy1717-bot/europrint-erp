#!/bin/bash
# EuroPrint ERP — Backup integrity tekshiruvi
# --------------------------------------------
# Backup faylning bus(z)ilmagani va kerakli tablelar mavjudligini tekshiradi.
# CI/CD yoki cron bilan har bir backup'dan keyin ishlatish tavsiya etiladi.
#
# Ishlatish:
#   bash scripts/verify-backup.sh backups/europrint_20260515_020000.sql.gz
#
# Exit kod:
#   0 — backup OK
#   1 — fayl yoki gzip buzilgan
#   2 — kutilgan obyekt soni topilmadi (warn-only)

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[verify] FATAL: file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "[verify] file: $BACKUP_FILE"
echo "[verify] size: $(du -sh "$BACKUP_FILE" | cut -f1)"

# 1) Gzip integrity test
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "[verify] gzip OK"
else
  echo "[verify] GZIP FAILED" >&2
  exit 1
fi

# 2) CREATE TABLE statementlar (sxema mavjudmi?)
TABLE_COUNT=$(gunzip -c "$BACKUP_FILE" | grep -c "^CREATE TABLE " || true)
echo "[verify] CREATE TABLE statements: $TABLE_COUNT"
if [ "$TABLE_COUNT" -lt 50 ]; then
  echo "[verify] WARN: expected >=50 tables, got $TABLE_COUNT"
fi

# 3) COPY statementlar (ma'lumot bormi?)
ROW_COUNT=$(gunzip -c "$BACKUP_FILE" | grep -c "^COPY " || true)
echo "[verify] COPY statements: $ROW_COUNT"

# 4) Asosiy tablelar mavjudligini tekshirish (smoke test)
EXPECTED_TABLES=("users" "orders" "employees" "customers" "products")
MISSING=0
for tbl in "${EXPECTED_TABLES[@]}"; do
  if ! gunzip -c "$BACKUP_FILE" | grep -q "^CREATE TABLE .*\.\?\"\?${tbl}\"\? "; then
    echo "[verify] WARN: table '$tbl' not found in backup"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "[verify] WARN: $MISSING expected tables missing"
fi

echo "[verify] OK"
