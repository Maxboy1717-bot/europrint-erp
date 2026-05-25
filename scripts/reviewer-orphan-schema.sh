#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Orphan Schema Reviewer  (Qoida 21)
# Ishlatish: bash scripts/reviewer-orphan-schema.sh
#
# Tekshiradi: lib/db/src/schema/ ichida e'lon qilingan pgTable
#   ta'riflari apps/api/src/ ichida ishlatilmaganmi (0 import).
#
# CHIQISH:
#   exit 0 → PASS (barcha jadvallar ishlatilgan)
#   exit 1 → FAIL (ishlatilmagan pgTable topildi)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

SCHEMA_DIR="lib/db/src/schema"
API_SRC="apps/api/src"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Orphan Schema Reviewer (Qoida 21)                  ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$SCHEMA_DIR" ]; then
  warn "$SCHEMA_DIR topilmadi — tekshirish o'tkazib yuborildi"
  exit 0
fi

# ── §1: Orphan pgTable'larni topish ───────────────────────────────
echo ""
echo -e "${BOLD}§1 — Hech qayerda ishlatilmagan pgTable ta'riflari${NC}"
echo "──────────────────────────────────────────────────────"

orphan_count=0

while IFS= read -r match; do
  # varname = "export const myTable" dagi "myTable"
  varname=$(echo "$match" | grep -oP "export const \K\w+")
  filepath=$(echo "$match" | cut -d: -f1)

  if [ -z "$varname" ]; then continue; fi

  # apps/api/src/ ichida bu varname import qilinganmi?
  usage_count=0
  # Search repo-wide (except the definition file itself)
  usage_count=$(grep -rl "\b${varname}\b" \
    "$SCHEMA_DIR" "$API_SRC" \
    --include="*.ts" 2>/dev/null \
    | grep -v "^${filepath}$" | wc -l) || true
  usage_count="${usage_count//[^0-9]/}"
  usage_count="${usage_count:-0}"

  if [ "$usage_count" -eq 0 ]; then
    short_path="${filepath#$SCHEMA_DIR/}"
    ng "ORPHAN: ${varname} — ${short_path}"
    ((orphan_count++)) || true
  fi
done < <(grep -rn "^export const .* = pgTable(" "$SCHEMA_DIR" --include="*.ts" 2>/dev/null)

if [ "$orphan_count" -eq 0 ]; then
  ok "Barcha pgTable ta'riflari kamida 1 joyda ishlatilgan"
fi

# ── §2: apps/api/src/shared/db/ da yangi pgTable bormi? ──────────
echo ""
echo -e "${BOLD}§2 — apps/api/src/shared/db/ da pgTable ta'riflash tekshiruvi (Qoida 17)${NC}"
echo "──────────────────────────────────────────────────────"

SHARED_DB="apps/api/src/shared/db"
shared_count=0

if [ -d "$SHARED_DB" ]; then
  while IFS= read -r match; do
    varname=$(echo "$match" | grep -oP "export const \K\w+")
    filepath=$(echo "$match" | cut -d: -f1)
    short_path="${filepath#apps/api/src/shared/db/}"
    ng "SHARED_DB DA JADVAL: ${varname} — ${short_path}"
    ((shared_count++)) || true
  done < <(grep -rn "^export const .* = pgTable(" "$SHARED_DB" --include="*.ts" 2>/dev/null \
    | grep -v "\.d\.ts")
fi

if [ "$shared_count" -eq 0 ]; then
  ok "apps/api/src/shared/db/ da pgTable ta'rifi yo'q"
fi

# ── §3: Yechim namunasi ────────────────────────────────────────────
echo ""
echo -e "${BOLD}§3 — To'g'ri yozish namunasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  NOTO'G'RI (orphan — hech qayerda ishlatilmaydi):"
echo "    // lib/db/src/schema/my-feature.ts"
echo "    export const unusedTable = pgTable('unused_table', { ... });"
echo ""
echo "  TO'G'RI — yaratish + export + ishlatish:"
echo "    // lib/db/src/schema/my-feature.ts"
echo "    export const myTable = pgTable('my_table', { ... });"
echo ""
echo "    // apps/api/src/modules/my/my.repository.ts"
echo "    import { myTable } from '@europrint/db';"

# ── YAKUNIY ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
