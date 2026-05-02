#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Barcha Audit Skriptlar Master Runner
# Ishlatish: bash scripts/run-all-audits.sh
# Yoki:      pnpm audit:all
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_FILE="$SCRIPT_DIR/all-audits-report.txt"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0
CRITICAL_FAIL=0

log() { echo -e "$*"; echo -e "$*" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"; }
hdr() { log "\n${BOLD}══════════════════════════════════════════${NC}"; log "${BOLD}  $*${NC}"; log "${BOLD}══════════════════════════════════════════${NC}"; }
ok()  { log "  ${GREEN}✔${NC}  $*"; ((PASS++)) || true; }
ng()  { log "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
sk()  { log "  ${YELLOW}⚠${NC}  $*"; ((SKIP++)) || true; }
inf() { log "  ${CYAN}→${NC}  $*"; }

run_script() {
  local name="$1"
  local cmd="$2"
  local critical="${3:-false}"

  log ""
  log "${BOLD}── $name${NC}"
  inf "Buyruq: $cmd"

  local tmp_out
  tmp_out=$(mktemp)

  if (cd "$ROOT_DIR" && eval "$cmd" > "$tmp_out" 2>&1); then
    ok "$name — MUVAFFAQIYATLI"
    head -5 "$tmp_out" | while IFS= read -r line; do log "     ${DIM}$line${NC}"; done
  else
    local exit_code=$?
    ng "$name — XATO (exit $exit_code)"
    head -10 "$tmp_out" | while IFS= read -r line; do log "     ${DIM}$line${NC}"; done
    if [[ "$critical" == "true" ]]; then
      CRITICAL_FAIL=1
    fi
  fi
  rm -f "$tmp_out"
}

# ── Hisobot faylini boshlash ──────────────────────────────────────
> "$REPORT_FILE"
log "╔══════════════════════════════════════════════════╗"
log "║  EuroPrint ERP — Barcha Audit Hisoboti           ║"
log "║  $TIMESTAMP                       ║"
log "╚══════════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════════════════════
# 1. ASOSIY KOD QOIDALARI AUDITI (critical — exit 0 bo'lishi shart)
# ═══════════════════════════════════════════════════════════════════
hdr "1. ASOSIY KOD QOIDALARI AUDITI (apps/api/audit.sh)"
run_script "NestJS Kod Qoidalari" "bash apps/api/audit.sh" "true"

# ═══════════════════════════════════════════════════════════════════
# 2. FRONTEND → BACKEND 404 XAVFI
# ═══════════════════════════════════════════════════════════════════
hdr "2. FRONTEND → BACKEND: 404 XAVFI (audit-api-endpoints.ts)"
if command -v tsx &>/dev/null || (cd "$ROOT_DIR" && pnpm tsx --version &>/dev/null 2>&1); then
  run_script "API 404 Audit" "pnpm tsx scripts/audit-api-endpoints.ts"
  inf "Hisobot: scripts/api-404-audit-report.txt"
else
  sk "tsx topilmadi — pnpm tsx scripts/audit-api-endpoints.ts qo'lda ishga tushiring"
fi

# ═══════════════════════════════════════════════════════════════════
# 3. BACKEND → FRONTEND QAMROV
# ═══════════════════════════════════════════════════════════════════
hdr "3. BACKEND → FRONTEND: QAMROV (audit-backend-coverage.ts)"
run_script "Backend Qamrov" "pnpm tsx scripts/audit-backend-coverage.ts"
inf "Hisobot: scripts/backend-coverage-report.txt"

# ═══════════════════════════════════════════════════════════════════
# 4. TO'LIQ TIZIM TEKSHIRUVI
# ═══════════════════════════════════════════════════════════════════
hdr "4. TO'LIQ TIZIM TEKSHIRUVI (audit-full-system.ts)"
run_script "To'liq Tizim Audit" "pnpm tsx scripts/audit-full-system.ts"
inf "Hisobot: scripts/full-system-audit-report.txt"

# ═══════════════════════════════════════════════════════════════════
# 5. BUTTON VA MUTATSIYA ENDPOINTLARI
# ═══════════════════════════════════════════════════════════════════
hdr "5. BUTTON VA MUTATSIYA ENDPOINTLARI (button-audit.cjs)"
run_script "Button Audit" "node scripts/button-audit.cjs"
inf "Hisobot: scripts/button-audit-report.txt"

# ═══════════════════════════════════════════════════════════════════
# 6. ARCHITECTURE MUVOFIQLIK
# ═══════════════════════════════════════════════════════════════════
hdr "6. ARCHITECTURE MUVOFIQLIK (master-data-audit.sh)"
run_script "Architecture Audit" "bash scripts/master-data-audit.sh"

# ═══════════════════════════════════════════════════════════════════
# 7. FRONTEND-BACKEND BO'SHLIQ
# ═══════════════════════════════════════════════════════════════════
hdr "7. FRONTEND-BACKEND BO'SHLIQ (frontend-gap-audit.sh)"
run_script "Gap Audit" "bash scripts/src/frontend-gap-audit.sh"

# ═══════════════════════════════════════════════════════════════════
# 8. CRUD QAMROV TEKSHIRUVI
# ═══════════════════════════════════════════════════════════════════
hdr "8. CRUD QAMROV TEKSHIRUVI (missing-crud-audit.sh)"
run_script "CRUD Audit" "bash scripts/missing-crud-audit.sh"

# ═══════════════════════════════════════════════════════════════════
# 9. CRUD AUDIT v2
# ═══════════════════════════════════════════════════════════════════
hdr "9. CRUD AUDIT v2 (missing-crud-v2.sh)"
run_script "CRUD Audit v2" "bash scripts/missing-crud-v2.sh"

# ═══════════════════════════════════════════════════════════════════
# 10. KOD QATORLARI SONI
# ═══════════════════════════════════════════════════════════════════
hdr "10. KOD QATORLARI SONI (count_loc.sh)"
run_script "LOC Hisobi" "bash scripts/count_loc.sh"

# ═══════════════════════════════════════════════════════════════════
# 11. XAVFSIZLIK PENTEST
# ═══════════════════════════════════════════════════════════════════
hdr "11. XAVFSIZLIK PENTEST (pentest.sh)"
inf "Eslatma: API ishlab turishi kerak (localhost:8080)"
run_script "Pentest" "bash scripts/src/pentest.sh"

# ═══════════════════════════════════════════════════════════════════
# 12. RESULT LITERAL TUZATISH (fix-result-literals.cjs)
# ═══════════════════════════════════════════════════════════════════
hdr "12. RESULT LITERAL TUZATISH (fix-result-literals.cjs)"
inf "Eslatma: Bu skript eski result literal sintaksisini avtomatik tuzatadi"
run_script "Result Literal Fix" "node scripts/fix-result-literals.cjs"

# ═══════════════════════════════════════════════════════════════════
# 13. MASTER AUDIT (FAZA 1-8 + Kod sifati + Array xavfsizlik)
# ═══════════════════════════════════════════════════════════════════
hdr "13. MASTER AUDIT — FAZA 1-8 + KOD SIFATI + ARRAY (master-audit.sh)"
inf "Hisobot: audit-master-report.json"
run_script "Master Audit" "bash scripts/src/master-audit.sh"

# ═══════════════════════════════════════════════════════════════════
# YAKUNIY HISOBOT
# ═══════════════════════════════════════════════════════════════════
TOTAL=$((PASS + FAIL + SKIP))
log ""
log "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
log "${BOLD}║  YAKUNIY HISOBOT                                 ║${NC}"
log "${BOLD}╠══════════════════════════════════════════════════╣${NC}"
log "${BOLD}║${NC}  Jami tekshirildi : ${BOLD}$TOTAL${NC}"
log "${BOLD}║${NC}  ${GREEN}Muvaffaqiyatli${NC}    : ${GREEN}${BOLD}$PASS${NC}"
[[ "$FAIL" -gt 0 ]] && log "${BOLD}║${NC}  ${RED}Xatolik${NC}          : ${RED}${BOLD}$FAIL${NC}" || log "${BOLD}║${NC}  Xatolik          : $FAIL"
[[ "$SKIP" -gt 0 ]] && log "${BOLD}║${NC}  ${YELLOW}O'tkazib yuborildi${NC}: ${YELLOW}${BOLD}$SKIP${NC}" || log "${BOLD}║${NC}  O'tkazib yuborildi: $SKIP"
log "${BOLD}║${NC}  To'liq hisobot   : scripts/all-audits-report.txt"
log "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
log ""

if [[ "$CRITICAL_FAIL" -eq 1 ]]; then
  log "${RED}${BOLD}  MUHIM XATO: apps/api/audit.sh muvaffaqiyatsiz tugadi!${NC}"
  log "${RED}  Bu xatoni tuzating, chunki CI/CD bloklaydi.${NC}"
  exit 1
fi

if [[ "$FAIL" -gt 0 ]]; then
  log "${YELLOW}  Ogohlantirish: $FAIL ta audit skript xato bilan tugadi.${NC}"
  log "${YELLOW}  Hisobotlarni ko'rib chiqing va muammolarni tuzating.${NC}"
fi

exit 0
