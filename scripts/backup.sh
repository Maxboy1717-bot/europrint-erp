#!/bin/bash
# EuroPrint ERP — PostgreSQL avtomatik backup skripti
# ----------------------------------------------------
# Talab qilinadigan env: DATABASE_URL
# Ixtiyoriy env: BACKUP_DIR (default: ./backups), BACKUP_RETENTION_DAYS (default: 7)
#
# Production ishlatish:
#   export DATABASE_URL="postgresql://user:pass@host:5432/europrint"
#   export BACKUP_DIR="/var/backups/europrint"
#   export BACKUP_RETENTION_DAYS=30
#   bash scripts/backup.sh

set -euo pipefail

# DATABASE_URL majburiy
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] FATAL: DATABASE_URL env o'rnatilmagan" >&2
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="$BACKUP_DIR/europrint_$TIMESTAMP.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[backup] $(date -Iseconds) starting -> $BACKUP_FILE"

# pg_dump natijasini gzip -9 orqali siqib saqlaymiz.
# --no-owner / --no-acl: production'da boshqa rolga restore qilish mumkin
# --clean --if-exists: restore vaqtida eski obyektlarni avval drop qiladi
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -9 > "$BACKUP_FILE"

echo "[backup] size: $(du -sh "$BACKUP_FILE" | cut -f1)"

# Eski backuplarni tozalash (retention policy)
find "$BACKUP_DIR" -name "europrint_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "[backup] OK, retention $RETENTION_DAYS days"
