#!/usr/bin/env bash
# backup-db.sh — pg_dump wrapper for EuroPrint. Used as the DB provisioning
# artifact (see docs/db-provisioning.md) and as the MANDATORY backup before
# any destructive migration (DROP TABLE).
#
# Usage:
#   bash scripts/backup-db.sh schema   # schema only  -> backups/schema-<ts>.sql
#   bash scripts/backup-db.sh full     # schema+data  -> backups/full-<ts>.sql
#   bash scripts/backup-db.sh tables t1 t2 ...   # specific tables (schema+data)
#
# Reads connection from $DATABASE_URL, or from POSTGRES_* env / .env.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
ts="$(date +%Y%m%d-%H%M%S)"
mode="${1:-full}"; shift || true

# Resolve connection
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a; . ./.env 2>/dev/null || true; set +a
fi
CONN="${DATABASE_URL:-postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-postgres}}"

case "$mode" in
  schema) out="backups/schema-${ts}.sql"; pg_dump "$CONN" --schema-only --no-owner --no-privileges -f "$out" ;;
  full)   out="backups/full-${ts}.sql";   pg_dump "$CONN" --no-owner --no-privileges -f "$out" ;;
  tables)
    out="backups/tables-${ts}.sql"
    args=(); for t in "$@"; do args+=(-t "$t"); done
    pg_dump "$CONN" --no-owner --no-privileges "${args[@]}" -f "$out" ;;
  *) echo "unknown mode: $mode (schema|full|tables)"; exit 1 ;;
esac
echo "✓ wrote $out"
