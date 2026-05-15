#!/bin/bash
# EuroPrint ERP — PostgreSQL restore skripti
# -------------------------------------------
# Talab qilinadigan env: DATABASE_URL
# Argument: backup fayl yo'li (.sql.gz)
#
# OGOHLANTIRISH: Bu skript hozirgi DB ni TO'LIQ qayta yozadi (overwrite).
# Foydalanuvchi 'RESTORE' so'zini yozib tasdiqlashi shart.
#
# Ishlatish:
#   export DATABASE_URL="postgresql://user:pass@host:5432/europrint"
#   bash scripts/restore.sh backups/europrint_20260515_020000.sql.gz

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[restore] FATAL: DATABASE_URL env o'rnatilmagan" >&2
  exit 1
fi

echo "[restore] WARNING: this will OVERWRITE the target DB."
echo "[restore] Target: $DATABASE_URL"
echo "[restore] Source: $BACKUP_FILE"

# Foydalanuvchi tasdiqi (production'da yong'in chiqmasligi uchun)
read -p "Type 'RESTORE' to confirm: " confirm
if [ "$confirm" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

echo "[restore] $(date -Iseconds) restoring..."

# gunzip -> psql pipeline. backup.sh --clean --if-exists ishlatgani uchun
# psql avtomatik ravishda eski obyektlarni drop qiladi.
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "[restore] OK"
