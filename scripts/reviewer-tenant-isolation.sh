#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Tenant Isolation Reviewer
# Ishlatish: bash scripts/reviewer-tenant-isolation.sh
#
# Tekshiradi: tenant-scoped jadvallar uchun har bir `db.select().from(<table>)`
# zanjirida `.where(eq(<table>.tenant_id, ...))` predikati borligini.
#
# Maqsad: ADR-006 (docs/multi-tenancy-decision.md) ustun-asosli ko'p-ijarachi
# arxitekturasi uchun statik tekshiruv. Phase P1 da (joriy commit) hech qaysi
# jadvalda `tenant_id` ustuni hali yo'q — shu sababli boshlang'ich kutilgan
# natija: PASS=0 / FAIL=0 (chunki TENANT_SCOPED_TABLES ro'yxati hali bo'sh
# yoki jadvallar hali matchlanmaydi). Reviewer oldinga qaragan: Phase P2 da
# birinchi 3 ta jadval qo'shilganda u real ish boshlaydi.
#
# Pattern:
#   FAIL — `db.select().from(<scoped_table>)` topildi, lekin keyingi 5 qatorda
#          `.where(eq(<scoped_table>.tenant_id, ...))` yo'q
#   PASS — har bir `db.select().from(<scoped_table>)` filtr bilan
#
# CHIQISH:
#   exit 0 → PASS (barcha tenant-scoped so'rovlar filtrlangan)
#   exit 1 → FAIL (filtrsiz so'rov topildi)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

# ── Tenant-scoped jadvallar ro'yxati ─────────────────────────────────
# ADR rollout phase P2 — birinchi 3 modul:
#   - order-workflow  → sd_orders
#   - saas            → crm_leads
#   - security-ops    → crm_deals
# Yangi jadval qo'shilganda bu ro'yxatga ham qo'shing.
TENANT_SCOPED_TABLES=(
  "sd_orders"
  "crm_leads"
  "crm_deals"
)

# ── Skanerlanadigan papka ────────────────────────────────────────────
SRC_DIR="apps/api/src"

# ── Hisoblagichlar ──────────────────────────────────────────────────
PASS=0
FAIL=0

# ── Ranglar ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
BOLD='\033[1m'; DIM='\033[2m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; PASS=$((PASS + 1)); }
ng()   { echo -e "  ${RED}✗${NC}  $*"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Tenant Isolation Reviewer (ADR-006)                ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

# ── Sanity check ─────────────────────────────────────────────────────
if [ ! -d "$SRC_DIR" ]; then
  warn "$SRC_DIR topilmadi — skript repo root dan ishga tushirilsin"
  echo ""
  echo "  PASS: 0  |  FAIL: 0"
  echo "  Totals: PASS=0 / FAIL=0"
  exit 0
fi

echo -e "${BOLD}§1 — Tenant-scoped jadvallar ro'yxati${NC}"
echo "──────────────────────────────────────────────────────"
for tbl in "${TENANT_SCOPED_TABLES[@]}"; do
  echo -e "  ${DIM}- $tbl${NC}"
done
echo ""

# ── §2 — Har bir jadval uchun tekshiruv ─────────────────────────────
echo -e "${BOLD}§2 — Filtr tekshiruvi${NC}"
echo "──────────────────────────────────────────────────────"

total_matches=0

for tbl in "${TENANT_SCOPED_TABLES[@]}"; do
  # `.from(<tbl>)` — Drizzle ORM uslubi. Ham `from(sd_orders)`, ham
  # `from(schema.sd_orders)` ko'rinishlarini ushlaydi.
  # Faqat .ts fayllarni, test va dist papkalarini chiqarib tashlaymiz.
  matches=$(grep -rn --include="*.ts" \
    -E "\.from\(\s*([A-Za-z_]+\.)?${tbl}(\s|,|\))" \
    "$SRC_DIR" 2>/dev/null \
    | grep -v -E "\.spec\.ts|\.test\.ts|/dist/|/__tests__/|/node_modules/" \
    || true)

  if [ -z "$matches" ]; then
    continue
  fi

  while IFS= read -r match_line; do
    [ -z "$match_line" ] && continue
    total_matches=$((total_matches + 1))

    # Fayl yo'li va qator raqamini ajratish: format file:lineno:content
    file=$(echo "$match_line" | awk -F: '{print $1}')
    lineno=$(echo "$match_line" | awk -F: '{print $2}')
    snippet=$(echo "$match_line" | cut -d: -f3-)

    # Keyingi 5 qatorni o'qib, .where(eq(<tbl>.tenant_id, ...)) predikati
    # bor-yo'qligini tekshirish.
    if [ -f "$file" ] && [ -n "$lineno" ]; then
      end_line=$((lineno + 5))
      context=$(sed -n "${lineno},${end_line}p" "$file" 2>/dev/null || echo "")

      if echo "$context" | grep -qE "\.where\([^)]*eq\(\s*([A-Za-z_]+\.)?${tbl}\.tenant_id\s*,"; then
        ok "$file:$lineno  $tbl  →  filtr bor"
      else
        ng "$file:$lineno  $tbl  →  filtr YO'Q"
        echo -e "       ${DIM}$(echo "$snippet" | sed 's/^[[:space:]]*//')${NC}"
      fi
    fi
  done <<< "$matches"
done

if [ "$total_matches" -eq 0 ]; then
  echo ""
  warn "Tenant-scoped jadval ishlatilishi topilmadi — Phase P1 boshlang'ich holat"
  warn "(jadvallarda hali \`tenant_id\` ustuni qo'shilmagan)"
fi

# ── §3 — Yechim namunasi ────────────────────────────────────────────
echo ""
echo -e "${BOLD}§3 — To'g'ri yozish namunasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  NOTO'G'RI (tenant filtri yo'q):"
echo "    const rows = await db.select()"
echo "      .from(sd_orders)"
echo "      .where(eq(sd_orders.status, 'OPEN'));"
echo ""
echo "  TO'G'RI (tenant filtri majburiy):"
echo "    import { getTenantId } from '@common/context/tenant-context';"
echo "    const tid = getTenantId();"
echo "    if (!tid) return Err(AppErr('FORBIDDEN', 'No tenant scope'));"
echo "    const rows = await db.select()"
echo "      .from(sd_orders)"
echo "      .where(and("
echo "        eq(sd_orders.tenant_id, tid),"
echo "        eq(sd_orders.status, 'OPEN'),"
echo "      ));"

# ── YAKUNIY ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL"
echo "  Totals: PASS=$PASS / FAIL=$FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
