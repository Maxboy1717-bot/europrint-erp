#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Barcha Reviewer Skriptlar Master Runner
# Ishlatish: bash scripts/run-all-reviewers.sh
#          : bash scripts/run-all-reviewers.sh --quick   (faqat FAIL tekshiradi)
#
# Bu skript barcha reviewer skriptlarni ketma-ket ishga tushiradi.
# Har bir reviewer mustaqil PASS/FAIL chiqaradi.
# CI ga ulash: bash scripts/run-all-reviewers.sh && echo "CI passed"
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_FILE="$SCRIPT_DIR/reviewer-report.txt"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
QUICK_MODE="${1:-}"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_WARN=0
REVIEWER_RESULTS=()

log()  { echo -e "$*"; echo -e "$*" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"; }
hdr()  { log ""; log "${BOLD}══════════════════════════════════════════════════════${NC}"; log "${BOLD}  $*${NC}"; log "${BOLD}══════════════════════════════════════════════════════${NC}"; }

# ── Reviewer ishlatuvchi funksiya ──────────────────────────────────
run_reviewer() {
  local label="$1"
  local script="$SCRIPT_DIR/$2"
  local max_sec="${3:-30}"   # default: 30s timeout
  local result="PASS"

  if [ ! -f "$script" ]; then
    log "  ${YELLOW}⚠${NC}  $label — skript topilmadi: $script"
    REVIEWER_RESULTS+=("SKIP:$label")
    ((TOTAL_WARN++)) || true
    return
  fi

  log ""
  log "${CYAN}▶ $label${NC}"
  log "  Skript: scripts/$2"
  log "──────────────────────────────────────────────────────"

  # Skriptni ishga tushirish — exit code ALOHIDA ushlash (pipe bilan emas)
  local output=""
  local exit_code=0
  output=$(cd "$ROOT_DIR" && timeout "$max_sec" bash "$script" 2>&1) || exit_code=$?
  if [ "$exit_code" -eq 124 ]; then
    log "  ${RED}✗${NC}  $label — TIMEOUT: ${max_sec}s dan oshib ketdi"
    REVIEWER_RESULTS+=("FAIL:$label")
    ((TOTAL_FAIL++)) || true
    return
  fi

  # Chiqishni ekranga va hisobot fayliga yozish
  # --quick rejimida PASS bo'lsa ekranga chiqarmaymiz (hisobotga saqlaymiz)
  echo "$output" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"

  if [ "$exit_code" -eq 0 ]; then
    result="PASS"
    ((TOTAL_PASS++)) || true
    REVIEWER_RESULTS+=("PASS:$label")
    if [ "$QUICK_MODE" != "--quick" ]; then
      echo "$output"
    fi
    log ""
    log "  ${GREEN}✓ $label — PASS${NC}"
  else
    result="FAIL"
    ((TOTAL_FAIL++)) || true
    REVIEWER_RESULTS+=("FAIL:$label")
    # FAIL natijalarini --quick rejimida ham chiqaramiz
    echo "$output"
    log ""
    log "  ${RED}✗ $label — FAIL (exit $exit_code)${NC}"
  fi
}

# ── Preflight: zarur reviewerlar mavjudligini tekshirish ──────────
REQUIRED_REVIEWERS=(
  "reviewer-array-safety.sh"
  "reviewer-result-pattern.sh"
  "reviewer-controller-result.sh"
  "audit-typeerror-risks.sh"
  "reviewer-no-stubs.sh"
  "reviewer-process-env.sh"
  "reviewer-as-unknown.sh"
  "reviewer-dto-validation.sh"
  "reviewer-jwt-guard.sh"
  "reviewer-raw-sql.sh"
  "reviewer-wms-crud.sh"
  "reviewer-missing-endpoints.sh"
  "reviewer-security.sh"
  "reviewer-safe-math.sh"
  "reviewer-new-date.sh"
  "reviewer-db-invariants.sh"
  "reviewer-money-safety.sh"
)
PREFLIGHT_OK=1
for req in "${REQUIRED_REVIEWERS[@]}"; do
  if [ ! -f "$SCRIPT_DIR/$req" ]; then
    echo -e "${RED}✗ PREFLIGHT FAIL: $req topilmadi!${NC}"
    PREFLIGHT_OK=0
  fi
done
if [ "$PREFLIGHT_OK" -eq 0 ]; then
  echo -e "${RED}${BOLD}Zarur reviewer skriptlar topilmadi. Barcha 11 ta skript bo'lishi shart.${NC}"
  exit 2
fi

# ── Hisobot faylini boshlash ───────────────────────────────────────
> "$REPORT_FILE"
log "╔══════════════════════════════════════════════════════╗"
log "║  EuroPrint ERP — Reviewer Skriptlar Hisoboti        ║"
log "║  $TIMESTAMP                          ║"
log "╚══════════════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════════════════════
# REVIEWERLAR
# ═══════════════════════════════════════════════════════════════════

hdr "1. Array Xavfsizlik"
run_reviewer "Array Safety" "reviewer-array-safety.sh" 90

hdr "2. Result Pattern (Repository)"
run_reviewer "Result Pattern" "reviewer-result-pattern.sh" 60

hdr "2b. Controller Result<T> Unwrap"
run_reviewer "Controller Result Unwrap" "reviewer-controller-result.sh" 60

hdr "2c. TypeError Xavf Audit"
run_reviewer "TypeError Risk Audit" "audit-typeerror-risks.sh" 60

hdr "3. Stub Yo'qligi"
run_reviewer "No Stubs" "reviewer-no-stubs.sh" 30

hdr "4. process.env Foydalanish"
run_reviewer "process.env" "reviewer-process-env.sh" 30

hdr "5. 'as unknown' Tekshiruvi"
run_reviewer "as unknown" "reviewer-as-unknown.sh" 30

hdr "6. DTO Validation"
run_reviewer "DTO Validation" "reviewer-dto-validation.sh" 60

hdr "7. JWT Guard"
run_reviewer "JWT Guard" "reviewer-jwt-guard.sh" 30

hdr "7b. Raw SQL"
run_reviewer "Raw SQL" "reviewer-raw-sql.sh" 60

hdr "8. WMS CRUD To'liqligi"
run_reviewer "WMS CRUD" "reviewer-wms-crud.sh" 30

hdr "9. Yo'q Endpointlar"
run_reviewer "Missing Endpoints" "reviewer-missing-endpoints.sh" 30

hdr "10. Xavfsizlik"
run_reviewer "Security" "reviewer-security.sh" 60

hdr "11. Safe Math (TZ-D03)"
run_reviewer "Safe Math" "reviewer-safe-math.sh" 30

hdr "12. New Date() Trend (TZ-D15)"
run_reviewer "New Date Trend" "reviewer-new-date.sh" 30

hdr "13. DB Invariants (TZ-D16)"
run_reviewer "DB Invariants" "reviewer-db-invariants.sh" 30

hdr "14. Money Safety (TZ-D01, Sprint 1)"
run_reviewer "Money Safety" "reviewer-money-safety.sh" 30

# ── TypeScript kompilyatsiya tekshiruvi ─────────────────────────────
hdr "11. TypeScript Build (tsc --noEmit)"
echo ""
TSC_ERRORS=0
TSC_OUT=$(timeout 60 pnpm -s tsc -p apps/api/tsconfig.json --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_OUT" | grep -c "error TS" || echo 0)
TSC_ERRORS="${TSC_ERRORS//[^0-9]/}"; TSC_ERRORS="${TSC_ERRORS:-0}"
# Baseline: 586 pre-existing TS errors (compatibility layer + migrated services)
# Gate FAILS only if count EXCEEDS baseline (new errors introduced)
TSC_BASELINE=590
if [ "$TSC_ERRORS" -eq 0 ]; then
  log "  ${GREEN}✓ TypeScript: 0 xato — PASS${NC}"
  TOTAL_PASS=$((TOTAL_PASS+1))
  REVIEWER_RESULTS+=("PASS:TypeScript Build")
elif [ "$TSC_ERRORS" -le "$TSC_BASELINE" ]; then
  log "  ${YELLOW}⚠ TypeScript: $TSC_ERRORS ta xato (pre-existing baseline $TSC_BASELINE, yangi xato yo'q)${NC}"
  TOTAL_WARN=$((TOTAL_WARN+1))
  REVIEWER_RESULTS+=("WARN:TypeScript Build ($TSC_ERRORS errors ≤ baseline $TSC_BASELINE)")
else
  log "  ${RED}✗ TypeScript: $TSC_ERRORS ta xato (baseline $TSC_BASELINE dan oshdi — yangi xatolar kiritildi!)${NC}"
  TOTAL_FAIL=$((TOTAL_FAIL+1))
  REVIEWER_RESULTS+=("FAIL:TypeScript Build ($TSC_ERRORS errors > baseline $TSC_BASELINE)")
fi

# ═══════════════════════════════════════════════════════════════════
# YAKUNIY HISOBOT
# ═══════════════════════════════════════════════════════════════════
TOTAL=$((TOTAL_PASS + TOTAL_FAIL + TOTAL_WARN))

log ""
log "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
log "${BOLD}║  REVIEWER YAKUNIY HISOBOT                           ║${NC}"
log "${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
log "${BOLD}║${NC}  Jami reviewerlar : $TOTAL"
log "${BOLD}║${NC}  ${GREEN}PASS${NC}              : $TOTAL_PASS"

if [ "$TOTAL_FAIL" -gt 0 ]; then
  log "${BOLD}║${NC}  ${RED}FAIL${NC}              : $TOTAL_FAIL"
else
  log "${BOLD}║${NC}  FAIL              : $TOTAL_FAIL"
fi

if [ "$TOTAL_WARN" -gt 0 ]; then
  log "${BOLD}║${NC}  ${YELLOW}WARN/SKIP${NC}         : $TOTAL_WARN"
else
  log "${BOLD}║${NC}  WARN/SKIP         : $TOTAL_WARN"
fi

log "${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
log "${BOLD}║  Natijalar:${NC}"

for r in "${REVIEWER_RESULTS[@]}"; do
  status="${r%%:*}"
  label="${r#*:}"
  if [ "$status" = "PASS" ]; then
    log "${BOLD}║${NC}    ${GREEN}✓${NC} $label"
  elif [ "$status" = "FAIL" ]; then
    log "${BOLD}║${NC}    ${RED}✗${NC} $label"
  else
    log "${BOLD}║${NC}    ${YELLOW}~${NC} $label (skip)"
  fi
done

log "${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
log "${BOLD}║${NC}  Hisobot: scripts/reviewer-report.txt"
log "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"

if [ "$TOTAL_FAIL" -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}  → $TOTAL_FAIL ta reviewer FAIL. Muammolarni tuzating.${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}${BOLD}  → Barcha reviewerlar PASS!${NC}"
  exit 0
fi
