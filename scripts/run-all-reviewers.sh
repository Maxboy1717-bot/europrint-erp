#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Architecture Rules Aggregator
# Runs every reviewer-*.sh script for the 22 rules in ARCHITECTURE_RULES.md
# and prints a summary table.
#
# Exit code: 0 only if every rule PASSes; 1 otherwise.
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMEOUT="${REVIEWER_TIMEOUT:-180}"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# Rule table: number | title | reviewer-script-file
RULES=(
  "1|Result Pattern|reviewer-result-pattern.sh"
  "2|Array Safety|reviewer-array-safety.sh"
  "3|Zod Validation|reviewer-dto-validation.sh"
  "4|No Raw SQL|reviewer-raw-sql.sh"
  "5|No as unknown Stubs|reviewer-as-unknown.sh"
  "6|Controller is Transport Only|reviewer-controller-logic.sh"
  "7|Env Vars via ConfigService|reviewer-process-env.sh"
  "8|All Controllers Have Guards|reviewer-jwt-guard.sh"
  "9|try/catch Required|reviewer-try-catch.sh"
  "10|Repository Layer Only|reviewer-repository-layer.sh"
  "11|No Circular Dependencies|reviewer-circular-deps.sh"
  "12|No Magic Numbers|reviewer-magic-numbers.sh"
  "13|No Non-null Assertions|reviewer-non-null.sh"
  "14|No console.log|reviewer-console-log.sh"
  "15|No Sensitive Logs|reviewer-sensitive-logs.sh"
  "16|File Size Limit|reviewer-file-size.sh"
  "17|Function Size Limit|reviewer-function-size.sh"
  "18|No any Type|reviewer-any-type.sh"
  "19|AlertDialog on Mutations|reviewer-alert-dialog.sh"
  "20|Forms Use Zod|reviewer-form-validation.sh"
  "21|apiRequest Only|reviewer-api-request.sh"
  "22|Unit Tests Required|reviewer-unit-tests.sh"
  "PA2-14|Legacy ACL (no raw SQL in legacy controllers)|reviewer-legacy-acl.sh"
)

RESULTS=()  # array of "num|title|status|count"
TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SKIP=0

run_one() {
  local entry="$1"
  IFS='|' read -r num title script <<< "$entry"
  local path="$SCRIPT_DIR/$script"

  echo ""
  echo -e "${CYAN}▶ Rule $num — $title${NC}"
  echo "  $script"
  echo "──────────────────────────────────────────────────────"

  if [ ! -f "$path" ]; then
    echo -e "  ${YELLOW}⚠ SKIP${NC} — script not found"
    RESULTS+=("$num|$title|SKIP|0")
    TOTAL_SKIP=$((TOTAL_SKIP+1))
    return
  fi

  local out=""
  local code=0
  out=$(cd "$ROOT_DIR" && timeout "$TIMEOUT" bash "$path" 2>&1) || code=$?

  # Count violations: last "FAIL: N" line or count of red ✗ markers
  local count=0
  if [ "$code" -ne 0 ]; then
    count=$(echo "$out" | grep -cE '^\s*✗|FAIL.*: [0-9]+' || true)
    if [ "$count" -eq 0 ]; then count=1; fi
    echo -e "  ${RED}✗ FAIL${NC} ($count violations)"
    RESULTS+=("$num|$title|FAIL|$count")
    TOTAL_FAIL=$((TOTAL_FAIL+1))
  else
    echo -e "  ${GREEN}✓ PASS${NC}"
    RESULTS+=("$num|$title|PASS|0")
    TOTAL_PASS=$((TOTAL_PASS+1))
  fi

  # Optionally show first 5 lines of output for context
  echo "$out" | head -6 | sed 's/^/    /'
}

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  EuroPrint Architecture Rules — Aggregate Audit       ${NC}"
echo -e "${BOLD}  $(date '+%Y-%m-%d %H:%M:%S')                           ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

for entry in "${RULES[@]}"; do
  run_one "$entry"
done

# ── Summary table ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Summary                                              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
printf "%-4s %-38s %-8s %-10s\n" "#" "Rule" "Status" "Findings"
echo "──────────────────────────────────────────────────────"
for r in "${RESULTS[@]}"; do
  IFS='|' read -r num title status count <<< "$r"
  case "$status" in
    PASS) color="$GREEN" ;;
    FAIL) color="$RED" ;;
    *)    color="$YELLOW" ;;
  esac
  printf "%-4s %-38s ${color}%-8s${NC} %-10s\n" "$num" "$title" "$status" "$count"
done
echo "──────────────────────────────────────────────────────"
printf "Totals: ${GREEN}PASS=%d${NC}  ${RED}FAIL=%d${NC}  ${YELLOW}SKIP=%d${NC}\n" "$TOTAL_PASS" "$TOTAL_FAIL" "$TOTAL_SKIP"
echo ""

[ "$TOTAL_FAIL" -eq 0 ] && exit 0 || exit 1
