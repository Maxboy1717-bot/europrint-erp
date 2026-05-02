#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — "as unknown" Reviewer
# Ishlatish: bash scripts/reviewer-as-unknown.sh
#
# Tekshiradi: apps/api/src/modules/ ichida "as unknown" ishlatilishi:
#   - FAIL: stub sifatida ishlatilgan:  [] as unknown[]
#           yoki hardcoded return bilan: return { x: [] as unknown[] }
#   - WARN: boshqa holatlarda (type cast zarur bo'lishi mumkin)
#
# CHIQISH:
#   exit 0 → PASS (stub as unknown topilmadi)
#   exit 1 → FAIL (stub as unknown topildi)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

MODULES_DIR="apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  'as unknown' Reviewer                              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: KRITIK — Stub sifatidagi "as unknown[]" ───────────────────
echo ""
echo -e "${BOLD}§1 — KRITIK: Stub sifatida ishlatilyapti ([] as unknown[])${NC}"
echo "──────────────────────────────────────────────────────"

STUB_UNKNOWN_PATTERN='\[\] as unknown\[\]|\{\} as unknown|null as unknown'

if [ ! -d "$MODULES_DIR" ]; then
  warn "$MODULES_DIR topilmadi"
else
  stub_count=0
  while IFS= read -r match; do
    ng "$match"
    ((stub_count++)) || true
  done < <(grep -rnE "$STUB_UNKNOWN_PATTERN" "$MODULES_DIR" \
    --include="*.ts" 2>/dev/null \
    | grep -v "spec\|test\|// ok:\|\.d\.ts" \
    | sed 's|apps/api/src/modules/||')

  if [ "$stub_count" -eq 0 ]; then
    ok "Stub 'as unknown[]' topilmadi"
  fi
fi

# ── §2: OGOHLANTIRISH — Boshqa "as unknown" holatlar ─────────────
echo ""
echo -e "${BOLD}§2 — Boshqa 'as unknown' ishlatilishi (tahlil uchun)${NC}"
echo "──────────────────────────────────────────────────────"

if [ -d "$MODULES_DIR" ]; then
  total_as_unknown=0
  total_as_unknown=$(grep -rnE "\bas unknown\b" "$MODULES_DIR" \
    --include="*.ts" 2>/dev/null \
    | grep -v "spec\|test\|\.d\.ts\|\[\] as unknown\|null as unknown\|\{\} as unknown" \
    | wc -l) || true
  total_as_unknown="${total_as_unknown//[^0-9]/}"
  total_as_unknown="${total_as_unknown:-0}"

  echo "  Boshqa 'as unknown' holatlar soni: $total_as_unknown"
  if [ "$total_as_unknown" -gt 50 ]; then
    warn "$total_as_unknown ta 'as unknown' — ko'pchiligini turlangan interfeyslarga almashtiring"
  elif [ "$total_as_unknown" -gt 0 ]; then
    warn "$total_as_unknown ta 'as unknown' — har birini tekshiring"
  else
    ok "Boshqa 'as unknown' yo'q"
  fi

  # Top 10 fayllarni ko'rsatish
  if [ "$total_as_unknown" -gt 0 ]; then
    echo ""
    echo "  Eng ko'p 'as unknown' bor fayllar:"
    grep -rnE "\bas unknown\b" "$MODULES_DIR" --include="*.ts" 2>/dev/null \
      | grep -v "spec\|test\|\.d\.ts\|\[\] as unknown\|null as unknown" \
      | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10 \
      | while IFS= read -r ln; do echo -e "     ${DIM}$ln${NC}"; done
  fi
fi

# ── §3: YECHIM NAMUNASI ────────────────────────────────────────────
echo ""
echo -e "${BOLD}§3 — To'g'ri yozish namunasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  NOTO'G'RI (stub):"
echo "    return { items: [] as unknown[], total: 0 };"
echo ""
echo "  TO'G'RI:"
echo "    // Interfeys aniqlang:"
echo "    interface ItemDto { id: number; name: string; }"
echo "    // DB dan oling:"
echo "    const r = await this.repo.findAll();"
echo "    const rows = r.ok && Array.isArray(r.data) ? r.data : [];"
echo "    return { items: rows as ItemDto[], total: rows.length };"

# ── YAKUNIY ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
