#!/bin/bash
# EuroPrint ERP — Loyiha holat tekshiruvi
# Ishlatish: bash scripts/holat.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }
fail() { echo -e "  ${RED}✗${NC}  $*"; }
hdr()  { echo -e "\n${BOLD}${BLUE}══ $* ${NC}"; }

# rg 0 natija topsa exit 1 qaytaradi — || true bilan himoya
rg_count() { { rg -c "$@" 2>/dev/null || true; } | awk -F: '{s+=$2} END{print s+0}'; }
rg_files()  { { rg -l "$@" 2>/dev/null || true; } | wc -l; }

echo "╔══════════════════════════════════════════════════════╗"
echo "║        EuroPrint ERP — Loyiha Holat Tekshiruvi      ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── §1. Fayl tuzilmasi ───────────────────────────────────────
hdr "§1. FAYL TUZILMASI"
pages=$(rg --files -g "*.tsx" artifacts/erp-dashboard/src/pages 2>/dev/null | wc -l)
controllers=$(rg --files -g "*.controller.ts" apps/api/src 2>/dev/null | wc -l)
ts_files=$(rg --files -g "*.ts" -g "!*.d.ts" apps/api/src artifacts/erp-dashboard/src 2>/dev/null | wc -l)

ok "Frontend sahifalar:    $pages ta"
ok "Backend controllerlar: $controllers ta"
ok "TypeScript fayllar:    $ts_files ta"

# ── §2. Audit holati ─────────────────────────────────────────
hdr "§2. AUDIT HOLATI"
if [ -f scripts/button-audit-report.txt ]; then
  coverage=$(grep -oP '\d+\.\d+%' scripts/button-audit-report.txt | head -1 || echo "noma'lum")
  unlinked=$(grep "bog'lanmagan endpointlar" scripts/button-audit-report.txt \
    | grep -oP ':\s*\K\d+' || echo 0)
  no_button=$(grep "Tugmasiz sahifalar" scripts/button-audit-report.txt \
    | grep -oP ':\s*\K\d+' || echo 0)

  ok "Endpoint qamrovi:    $coverage"
  [ "${unlinked:-0}" -le 10 ] && ok "Ulanmagan endpoint:  ${unlinked:-0} ta" \
    || warn "Ulanmagan endpoint:  ${unlinked:-0} ta"
  [ "${no_button:-0}" -eq 0 ] && ok "Tugmasiz sahifalar:  ${no_button:-0} ta" \
    || warn "Tugmasiz sahifalar:  ${no_button:-0} ta"
else
  warn "Audit hisoboti topilmadi — 'node scripts/button-audit.cjs' bilan yangilang"
fi

# ── §3. Kod sifati ───────────────────────────────────────────
hdr "§3. KOD SIFATI"
any_count=$(rg_count '\bany\b' -g "*.ts" -g "*.tsx" artifacts/erp-dashboard/src apps/api/src)
ts_ignore=$(rg_files '@ts-ignore|@ts-nocheck' -g "*.ts" -g "*.tsx")
console_log=$(rg_files 'console\.log' apps/api/src -g "*.ts")

[ "$any_count" -lt 100 ] && ok "TypeScript 'any' turi: $any_count ta" \
  || warn "TypeScript 'any' turi: $any_count ta (ko'p)"
[ "$ts_ignore" -eq 0 ]   && ok "@ts-ignore fayllar:   $ts_ignore ta" \
  || warn "@ts-ignore fayllar:   $ts_ignore ta"
[ "$console_log" -lt 10 ] && ok "console.log (backend): $console_log ta fayl" \
  || warn "console.log (backend): $console_log ta fayl"

# ── §4. Muhim fayllar ────────────────────────────────────────
hdr "§4. MUHIM FAYLLAR"
check_file() { [ -f "$1" ] && ok "$1" || fail "$1 — topilmadi"; }
check_file "artifacts/erp-dashboard/src/lib/queryClient.ts"
check_file "apps/api/src/main.ts"
check_file "pnpm-workspace.yaml"
[ -f ".env" ] && ok ".env" || warn ".env fayli yo'q"

# ── §5. Git holati ───────────────────────────────────────────
hdr "§5. GIT HOLATI"
if git rev-parse --git-dir > /dev/null 2>&1; then
  branch=$(git branch --show-current 2>/dev/null || echo "noma'lum")
  uncommitted=$(git status --porcelain 2>/dev/null | wc -l)
  last_commit=$(git log --oneline -1 2>/dev/null || echo "commit topilmadi")
  ok "Joriy branch:     $branch"
  [ "$uncommitted" -eq 0 ] && ok "O'zgarishlar:     0 (toza)" \
    || warn "O'zgarishlar:     $uncommitted ta commit qilinmagan"
  ok "So'nggi commit:   $last_commit"
else
  warn "Git repository aniqlanmadi"
fi

echo ""
echo "  Tekshiruv tugadi: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
