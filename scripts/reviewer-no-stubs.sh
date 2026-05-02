#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Stub Yo'qligini Reviewer
# Ishlatish: bash scripts/reviewer-no-stubs.sh
#
# Tekshiradi: quyidagi modullarda stub qaytarishlar yo'qligini:
#   - compatibility/
#   - legacy/
#   - lms/certification/
#   - finance/presentation/finance-advance.controller.ts
#
# Stub = return [];  return {};  [] as unknown[];  items: []  va h.k.
#
# CHIQISH:
#   exit 0 → PASS (stub topilmadi)
#   exit 1 → FAIL (stub topildi — HAQIQIY DB so'rovi kerak)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

ok() { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng() { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }

# ── Tekshiriladigan manzillar ──────────────────────────────────────
TARGETS=(
  "apps/api/src/modules/compatibility"
  "apps/api/src/modules/legacy"
  "apps/api/src/modules/lms/certification"
)
SINGLE_FILES=(
  "apps/api/src/modules/finance/presentation/finance-advance.controller.ts"
)

# Stub pattern regex (bash extended regex)
# return null, return [], return {}, [] as unknown[], TODO/FIXME/placeholder
STUB_PATTERN='^\s*return null;|^\s*return \[\];|^\s*return \{\};|\[\] as unknown\[\]|\{\} as unknown|^\s*items: \[\]|^\s*data: \[\]|\/\/\s*(TODO|FIXME|PLACEHOLDER|STUB|HACK):|throw new Error\(.not implemented.\)|return \{ [a-z]+: \[\] \}'

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Stub Yo'qligini Reviewer                           ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: Kataloglar tekshiruvi ──────────────────────────────────────
echo ""
echo -e "${BOLD}§1 — Modul kataloglari${NC}"
echo "──────────────────────────────────────────────────────"

for target in "${TARGETS[@]}"; do
  if [ ! -d "$target" ]; then
    echo "  ~ $target (papka yo'q — skip)"
    continue
  fi

  stub_lines=0
  stub_lines=$(grep -rncE "$STUB_PATTERN" "$target" \
    --include="*.ts" 2>/dev/null \
    | grep -v "spec\|test\|// ok:\|// intentional\|// empty by design" \
    | awk -F: '{s+=$2} END {print s+0}') || true
  stub_lines="${stub_lines//[^0-9]/}"
  stub_lines="${stub_lines:-0}"

  if [ "$stub_lines" -gt 0 ]; then
    ng "$target — $stub_lines ta stub qator"
    # Aniq topilgan joylarni ko'rsatish
    grep -rnE "$STUB_PATTERN" "$target" \
      --include="*.ts" 2>/dev/null \
      | grep -v "spec\|test\|// ok:\|// intentional" \
      | head -8 | while IFS= read -r ln; do
        echo -e "     ${DIM}→ $ln${NC}"
      done
  else
    ok "$target — stub yo'q"
  fi
done

# ── §2: Alohida fayllar tekshiruvi ────────────────────────────────
echo ""
echo -e "${BOLD}§2 — Alohida fayllar${NC}"
echo "──────────────────────────────────────────────────────"

for f in "${SINGLE_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  ~ $f (fayl yo'q — skip)"
    continue
  fi

  stub_lines=0
  stub_lines=$(grep -cE "$STUB_PATTERN" "$f" 2>/dev/null \
    | grep -v "// ok:\|// intentional" || true)
  stub_lines="${stub_lines//[^0-9]/}"
  stub_lines="${stub_lines:-0}"

  if [ "$stub_lines" -gt 0 ]; then
    ng "$(basename "$f") — $stub_lines ta stub"
    grep -nE "$STUB_PATTERN" "$f" 2>/dev/null | head -5 | while IFS= read -r ln; do
      echo -e "     ${DIM}→ $ln${NC}"
    done
  else
    ok "$(basename "$f") — stub yo'q"
  fi
done

# ── §3: YECHIM NAMUNASI ────────────────────────────────────────────
echo ""
echo -e "${BOLD}§3 — Stub o'rniga qo'llaniladigan pattern${NC}"
echo "──────────────────────────────────────────────────────"
echo "  NOTO'G'RI (stub):"
echo "    return { items: [] as unknown[], total: 0 };"
echo ""
echo "  TO'G'RI (real DB + Array.isArray):"
echo "    const r = await this.svc.findAll(page, limit);"
echo "    const rows = r.ok && Array.isArray(r.data) ? r.data : [];"
echo "    return { items: rows, total: rows.length };"

# ── YAKUNIY ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}→ $FAIL ta stub topildi. Haqiqiy DB so'rovi bilan almashtiring.${NC}"
else
  echo -e "  ${GREEN}→ Barcha tekshirilgan fayllar stubsiz.${NC}"
fi
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
