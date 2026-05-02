#!/bin/bash
# EuroPrint ERP — TypeScript sifat auditi (rg bilan tezlashtirilgan)
# Ishlatish: bash scripts/ts-audit.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }
hdr()  { echo -e "\n${BOLD}${BLUE}══ $* ${NC}"; }

FE="artifacts/erp-dashboard/src"
BE="apps/api/src"

# rg 0 natija topganda exit 1 qaytaradi — || true bilan himoya
rg_count() { { rg -c "$@" 2>/dev/null || true; } | awk -F: '{s+=$2} END{print s+0}'; }
rg_files()  { { rg -l "$@" 2>/dev/null || true; } | wc -l; }

echo "╔══════════════════════════════════════════════════════╗"
echo "║       EuroPrint ERP — TypeScript Sifat Auditi        ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── §1. 'any' turlari ───────────────────────────────────────
hdr "§1. 'any' TURLARI"
fe_any=$(rg_count '\bany\b' -g "*.ts" -g "*.tsx" "$FE")
be_any=$(rg_count '\bany\b' -g "*.ts" "$BE")
fe_any_files=$(rg_files '\bany\b' -g "*.ts" -g "*.tsx" "$FE")
be_any_files=$(rg_files '\bany\b' -g "*.ts" "$BE")

echo "  Frontend 'any':  $fe_any ta (${fe_any_files} ta fayl)"
echo "  Backend 'any':   $be_any ta (${be_any_files} ta fayl)"

hdr "§1.1. KO'P 'any' ISHLATILGAN FAYLLAR (top-10)"
{ rg -c '\bany\b' -g "*.ts" -g "*.tsx" "$FE" "$BE" 2>/dev/null || true; } \
  | sort -t: -k2 -rn | head -10 \
  | while IFS=: read -r f n; do printf "  %4d  %s\n" "$n" "${f#./}"; done

# ── §2. Suppression direktivlar ─────────────────────────────
hdr "§2. SUPPRESSION DIREKTIVLAR"
ts_ignore_fe=$(rg_count '@ts-ignore|@ts-nocheck' -g "*.ts" -g "*.tsx" "$FE")
ts_ignore_be=$(rg_count '@ts-ignore|@ts-nocheck' -g "*.ts" "$BE")

[ "$ts_ignore_fe" -eq 0 ] && ok "Frontend @ts-ignore: 0" || warn "Frontend @ts-ignore: $ts_ignore_fe ta"
[ "$ts_ignore_be" -eq 0 ] && ok "Backend  @ts-ignore: 0" || warn "Backend  @ts-ignore: $ts_ignore_be ta"

# ── §3. console.log ──────────────────────────────────────────
hdr "§3. DEBUG QOLDIQLARI"
console_log_be=$(rg_count 'console\.(log|warn|error)' -g "*.ts" "$BE")
console_log_fe=$(rg_count 'console\.log' -g "*.ts" -g "*.tsx" "$FE")

[ "$console_log_be" -lt 20 ] && ok "Backend console.log:  $console_log_be ta" \
  || warn "Backend console.log:  $console_log_be ta (tozalash tavsiya)"
echo "  Frontend console.log: $console_log_fe ta"

# ── §4. TODO / FIXME ─────────────────────────────────────────
hdr "§4. TODO / FIXME / HACK IZOHLAR"
todos=$(rg_count 'TODO|FIXME|HACK|XXX' -g "*.ts" -g "*.tsx" "$FE" "$BE")
[ "$todos" -eq 0 ] && ok "TODO/FIXME: 0 ta" || warn "TODO/FIXME: $todos ta topildi"

if [ "$todos" -gt 0 ]; then
  echo ""
  { rg -n 'TODO|FIXME|HACK|XXX' -g "*.ts" -g "*.tsx" "$FE" "$BE" 2>/dev/null || true; } \
    | head -15 \
    | while IFS=: read -r f n rest; do
        printf "  %s:%s: %s\n" "${f#./}" "$n" "${rest:0:70}"
      done
fi

# ── §5. Tipizatsiya sifati ───────────────────────────────────
hdr "§5. API TIPIZATSIYA"
untyped_api=$(rg_count 'apiRequest.*Record<string, unknown>' -g "*.ts" "$FE/lib/api")
typed_api=$(rg_count 'apiRequest<[A-Z]' -g "*.ts" "$FE/lib/api")
echo "  Typed apiRequest:   $typed_api ta"
echo "  Untyped apiRequest: $untyped_api ta"

# ── §6. Xulosa ───────────────────────────────────────────────
hdr "§6. XULOSA"
total_any=$((fe_any + be_any))
total_ignore=$((ts_ignore_fe + ts_ignore_be))

printf "  %-40s %s\n" "Jami 'any' turlari:"      "$total_any ta"
printf "  %-40s %s\n" "Jami @ts-ignore:"          "$total_ignore ta"
printf "  %-40s %s\n" "Backend console.log:"      "$console_log_be ta"
printf "  %-40s %s\n" "TODO/FIXME:"               "$todos ta"

echo ""
echo "  Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
