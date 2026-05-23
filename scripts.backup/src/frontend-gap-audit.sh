#!/usr/bin/env bash
# Frontend <-> Backend Gap Audit
# Usage: bash scripts/src/frontend-gap-audit.sh [--json]
# Exit code: always 0 (report only, no failure on gaps)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

BACKEND_DIR="$ROOT_DIR/apps/api/src/modules"
ROUTER_FILE="$ROOT_DIR/artifacts/erp-dashboard/src/routes/AppRouter.tsx"
ROUTES_DIR="$ROOT_DIR/artifacts/erp-dashboard/src/routes"
SIDEBAR_FILE="$ROOT_DIR/artifacts/erp-dashboard/src/components/sidebar/constants.ts"
PAGES_DIR="$ROOT_DIR/artifacts/erp-dashboard/src/pages"

OUTPUT_JSON=0
JSON_OUT="$ROOT_DIR/gap-report.json"

for arg in "$@"; do
  [[ "$arg" == "--json" ]] && OUTPUT_JSON=1
done

# ── ANSI colours ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── 1. Extract backend @Controller prefixes ──────────────────────────────────
declare -a BACKEND_ROUTES=()
while IFS= read -r prefix; do
  [[ -z "$prefix" ]] && continue
  prefix="${prefix#/}"
  BACKEND_ROUTES+=("$prefix")
done < <(
  grep -rh "@Controller(" "$BACKEND_DIR" --include="*.ts" 2>/dev/null \
    | sed -E "s/.*@Controller\('([^']*)'\).*/\1/;s/.*@Controller\(\"([^\"]*)\"\).*/\1/" \
    | grep -v "@Controller" \
    | sort -u
)

# ── 2. Extract frontend routes ───────────────────────────────────────────────
declare -a FRONTEND_ROUTES=()
while IFS= read -r fpath; do
  [[ -z "$fpath" ]] && continue
  fpath="${fpath#/}"
  FRONTEND_ROUTES+=("$fpath")
done < <(
  {
    grep -oh "'\/[^']*'" "$ROUTES_DIR"/*.tsx 2>/dev/null | sed "s/'//g" | sed 's|^/||'
    grep -oh "'\/[^']*'" "$ROUTER_FILE" 2>/dev/null | sed "s/'//g" | sed 's|^/||'
  } | sort -u
)

# ── 3. Extract sidebar nav URLs ──────────────────────────────────────────────
declare -a SIDEBAR_URLS=()
while IFS= read -r surl; do
  [[ -z "$surl" ]] && continue
  SIDEBAR_URLS+=("$surl")
done < <(
  grep -oP '(?<=url: ")[^"]+' "$SIDEBAR_FILE" 2>/dev/null \
    | grep -v '^$' \
    | sort -u
)

# ── Helper: check if backend prefix has a matching frontend route ────────────
route_has_frontend() {
  local prefix="$1"
  local fr
  for fr in "${FRONTEND_ROUTES[@]}"; do
    [[ "$fr" == "$prefix" ]] && return 0
    [[ "$fr" == "$prefix"/* ]] && return 0
    [[ "$prefix" == "$fr"/* ]] && return 0
    local b_last="${prefix##*/}"
    local f_last="${fr##*/}"
    [[ -n "$b_last" && "$b_last" == "$f_last" ]] && return 0
    case "$prefix" in
      crm*) [[ "$fr" == crm-workspace* || "$fr" == crm* ]] && return 0 ;;
      hr-v2*) [[ "$fr" == hr/* || "$fr" == hr-dashboard ]] && return 0 ;;
      wms*) [[ "$fr" == wms/* || "$fr" == warehouse/* ]] && return 0 ;;
      mm*) [[ "$fr" == mm/* ]] && return 0 ;;
      sd*) [[ "$fr" == sd/* ]] && return 0 ;;
      pp*) [[ "$fr" == pp/* || "$fr" == erp/pp/* ]] && return 0 ;;
      qc*) [[ "$fr" == qc/* ]] && return 0 ;;
      pos-v2*) [[ "$fr" == pos/* || "$fr" == pos-v2/* ]] && return 0 ;;
      fi*) [[ "$fr" == fi/* || "$fr" == finance/* || "$fr" == accounting/* ]] && return 0 ;;
      finance*) [[ "$fr" == finance/* || "$fr" == accounting/* || "$fr" == cfo/* ]] && return 0 ;;
      mes*) [[ "$fr" == mes/* ]] && return 0 ;;
      lms*) [[ "$fr" == lms/* || "$fr" == lms-dashboard ]] && return 0 ;;
      logistics*) [[ "$fr" == logistics/* ]] && return 0 ;;
      marketing*) [[ "$fr" == marketing/* ]] && return 0 ;;
      mro*) [[ "$fr" == mro/* ]] && return 0 ;;
      design*) [[ "$fr" == design/* ]] && return 0 ;;
      security*) [[ "$fr" == security/* || "$fr" == camera* ]] && return 0 ;;
      director*) [[ "$fr" == director/* || "$fr" == europrint/* ]] && return 0 ;;
      admin*) [[ "$fr" == admin/* || "$fr" == settings* || "$fr" == super-admin* ]] && return 0 ;;
      api/org-structure) [[ "$fr" == org-structure/* ]] && return 0 ;;
      core/departments) [[ "$fr" == departments* ]] && return 0 ;;
      core/positions) [[ "$fr" == positions* ]] && return 0 ;;
      core/panels) return 0 ;;
      system*|system-settings) [[ "$fr" == settings* ]] && return 0 ;;
      hr/attendance) [[ "$fr" == shift-schedule* || "$fr" == security/attendance* ]] && return 0 ;;
      hr/recruitment) [[ "$fr" == hr/recruiting* ]] && return 0 ;;
      hr/discipline) [[ "$fr" == discipline* ]] && return 0 ;;
      hr/payroll) [[ "$fr" == accounting/payroll* ]] && return 0 ;;
      accounting) [[ "$fr" == accounting/* || "$fr" == finance-dashboard ]] && return 0 ;;
      payroll) [[ "$fr" == accounting/payroll* ]] && return 0 ;;
      warehouse*|warehouses) [[ "$fr" == warehouse/* || "$fr" == wms/* ]] && return 0 ;;
      reports-hub) [[ "$fr" == europrint/reports-hub* ]] && return 0 ;;
      erp) return 0 ;;
    esac
  done
  return 1
}

# Helper: check if backend prefix has a matching sidebar nav item
route_has_sidebar() {
  local prefix="$1"
  local su
  for su in "${SIDEBAR_URLS[@]}"; do
    [[ -z "$su" ]] && continue
    [[ "$su" == "$prefix" ]] && return 0
    [[ "$su" == "$prefix"/* ]] && return 0
    [[ "$prefix" == "$su"/* ]] && return 0
    local b_last="${prefix##*/}"
    local s_last="${su##*/}"
    [[ -n "$b_last" && "$b_last" == "$s_last" ]] && return 0
    case "$prefix" in
      crm*) [[ "$su" == crm-workspace* || "$su" == crm* ]] && return 0 ;;
      hr-v2*) [[ "$su" == hr/* || "$su" == hr-dashboard ]] && return 0 ;;
      wms*) [[ "$su" == wms/* || "$su" == warehouse/* ]] && return 0 ;;
      mm*) [[ "$su" == mm/* ]] && return 0 ;;
      sd*) [[ "$su" == sd/* ]] && return 0 ;;
      pp*) [[ "$su" == pp/* || "$su" == erp/pp/* ]] && return 0 ;;
      qc*) [[ "$su" == qc/* ]] && return 0 ;;
      pos-v2*) [[ "$su" == pos/* || "$su" == pos-v2/* ]] && return 0 ;;
      fi*) [[ "$su" == fi/* || "$su" == finance/* || "$su" == accounting/* ]] && return 0 ;;
      finance*) [[ "$su" == finance/* || "$su" == accounting/* || "$su" == cfo/* ]] && return 0 ;;
      mes*) [[ "$su" == mes/* ]] && return 0 ;;
      lms*) [[ "$su" == lms/* || "$su" == lms-dashboard ]] && return 0 ;;
      logistics*) [[ "$su" == logistics/* ]] && return 0 ;;
      marketing*) [[ "$su" == marketing/* ]] && return 0 ;;
      mro*) [[ "$su" == mro/* ]] && return 0 ;;
      design*) [[ "$su" == design/* ]] && return 0 ;;
      security*) [[ "$su" == security/* || "$su" == camera* ]] && return 0 ;;
      director*) [[ "$su" == director/* || "$su" == europrint/* ]] && return 0 ;;
      admin*) [[ "$su" == admin/* || "$su" == settings* ]] && return 0 ;;
      api/org-structure) [[ "$su" == org-structure/* ]] && return 0 ;;
      core/*) return 0 ;;
      system*) [[ "$su" == settings* ]] && return 0 ;;
      hr/attendance) [[ "$su" == shift-schedule* || "$su" == security/attendance* ]] && return 0 ;;
      hr/recruitment) [[ "$su" == hr/recruiting* ]] && return 0 ;;
      hr/discipline) [[ "$su" == discipline* ]] && return 0 ;;
      hr/payroll) [[ "$su" == accounting/payroll* ]] && return 0 ;;
      accounting) [[ "$su" == accounting/* || "$su" == finance-dashboard ]] && return 0 ;;
      payroll) [[ "$su" == accounting/payroll* ]] && return 0 ;;
      warehouse*|warehouses) [[ "$su" == warehouse/* || "$su" == wms/* ]] && return 0 ;;
      reports-hub) [[ "$su" == europrint/reports-hub* ]] && return 0 ;;
    esac
  done
  return 1
}

# ── §3. Button/Form Actions Audit ───────────────────────────────────────────
# Scans .tsx files in PAGES_DIR (top-level and one level deep subdirs)
# Classifies each file with a Button/<button>/Form/onSubmit into:
#   WIRED_BUTTONS   — button + handler + API call (full chain)
#   EMPTY_HANDLERS  — button + handler, but no API call
#   DEAD_BUTTONS    — button/form present, but no handler at all

declare -a WIRED_BUTTONS=()
declare -a EMPTY_HANDLERS=()
declare -a DEAD_BUTTONS=()

# Collect all page tsx files (all nested levels)
declare -a PAGE_FILES=()
while IFS= read -r f; do
  PAGE_FILES+=("$f")
done < <(find "$PAGES_DIR" -name "*.tsx" 2>/dev/null | sort)

for pf in "${PAGE_FILES[@]}"; do
  fname="$(basename "$pf")"
  relpath="${pf#$ROOT_DIR/}"

  # Check for button/form markers
  has_button=0
  grep -qE '<[Bb]utton[ >]|<Form[ >]|onSubmit' "$pf" 2>/dev/null && has_button=1

  [[ $has_button -eq 0 ]] && continue

  # Check for handler: onClick/onSubmit, handleXxx function, or navigation patterns
  # (Link href= and asChild are valid React/Radix navigation handlers)
  has_handler=0
  grep -qE 'onClick=|onSubmit=|handleSubmit[[:space:](]|const handle[A-Z][a-zA-Z]|function handle[A-Z]|href=|asChild|onOpenChange=|trigger=\{' "$pf" 2>/dev/null && has_handler=1

  # Check for API call inside the file
  has_api=0
  grep -qE 'apiRequest|useMutation|\.mutate\(|\.mutateAsync\(|fetch\(|axios\.' "$pf" 2>/dev/null && has_api=1

  label="$relpath"
  if [[ $has_handler -eq 1 && $has_api -eq 1 ]]; then
    WIRED_BUTTONS+=("$label")
  elif [[ $has_handler -eq 1 ]]; then
    EMPTY_HANDLERS+=("$label")
  else
    DEAD_BUTTONS+=("$label")
  fi
done

btn_total=$(( ${#WIRED_BUTTONS[@]} + ${#EMPTY_HANDLERS[@]} + ${#DEAD_BUTTONS[@]} ))
dead_pct=0
if [[ $btn_total -gt 0 ]]; then
  dead_pct=$(( (${#DEAD_BUTTONS[@]} * 100) / btn_total ))
fi

# ── 4. Load stub routes (explicitly created stubs need no sidebar nav) ───────
declare -a STUB_ROUTE_PATHS=()
STUB_ROUTES_FILE="$ROUTES_DIR/StubRoutes.tsx"
if [[ -f "$STUB_ROUTES_FILE" ]]; then
  while IFS= read -r r; do
    STUB_ROUTE_PATHS+=("${r#/}")
  done < <(grep -oE "'\\/[^']+'" "$STUB_ROUTES_FILE" 2>/dev/null | tr -d "'" | sed 's|^/||' || true)
fi

route_is_stub() {
  local prefix="$1"
  for sp in "${STUB_ROUTE_PATHS[@]}"; do
    [[ "$prefix" == "$sp" ]] && return 0
  done
  return 1
}

# ── 5. Run comparison and build report ──────────────────────────────────────
covered=0
missing=0
no_nav=0
stub_count=0

declare -a COVERED_LIST=()
declare -a MISSING_LIST=()
declare -a NO_NAV_LIST=()
declare -a STUB_LIST=()

for prefix in "${BACKEND_ROUTES[@]}"; do
  if route_has_frontend "$prefix"; then
    if route_has_sidebar "$prefix"; then
      COVERED_LIST+=("$prefix")
      covered=$((covered + 1))
    elif route_is_stub "$prefix"; then
      STUB_LIST+=("$prefix")
      stub_count=$((stub_count + 1))
    else
      NO_NAV_LIST+=("$prefix")
      no_nav=$((no_nav + 1))
    fi
  else
    MISSING_LIST+=("$prefix")
    missing=$((missing + 1))
  fi
done

total=${#BACKEND_ROUTES[@]}

# ── 5. Print coloured report ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║      Frontend ↔ Backend Gap Audit — EuroPrint ERP            ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${DIM}Backend modules scanned : ${BOLD}${total}${RESET}"
echo -e "${DIM}Frontend routes found   : ${BOLD}${#FRONTEND_ROUTES[@]}${RESET}"
echo -e "${DIM}Sidebar nav items found : ${BOLD}${#SIDEBAR_URLS[@]}${RESET}"
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${GREEN}✅  QOPLANGAN — Backend + Frontend route + Sidebar nav${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${COVERED_LIST[@]}"; do
  echo -e "  ${GREEN}✅${RESET}  $item"
done
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${YELLOW}⚠️   ROUTE MAVJUD lekin SIDEBAR NAV YO'Q (tab/tugma yo'q)${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${NO_NAV_LIST[@]}"; do
  echo -e "  ${YELLOW}⚠️ ${RESET}  $item"
done
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${DIM}ℹ   STUB — Vaqtinchalik sahifa (sidebar qo'shilmagan)${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${STUB_LIST[@]}"; do
  echo -e "  ${DIM}ℹ ${RESET}  $item"
done
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${RED}❌  TOPILMADI — Backend modulining frontend sahifasi yo'q${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${MISSING_LIST[@]}"; do
  echo -e "  ${RED}❌${RESET}  $item"
done
echo ""

# ── §3 — Tugma/Forma Harakatlari Audit ──────────────────────────────────────
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║  §3 — Tugma/Forma Harakatlari Audit                          ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo -e "${DIM}Sahifalar skanlandi : ${BOLD}${#PAGE_FILES[@]}${RESET}"
echo -e "${DIM}Tugma/forma bor    : ${BOLD}${btn_total}${RESET}"
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${GREEN}✅  Tugma + Handler + API chaqiruvi — to'liq${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${WIRED_BUTTONS[@]}"; do
  echo -e "  ${GREEN}✅${RESET}  $item"
done
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${YELLOW}⚠️   Tugma bor, handler bor, lekin API chaqiruvi yo'q${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${EMPTY_HANDLERS[@]}"; do
  echo -e "  ${YELLOW}⚠️ ${RESET}  $item"
done
echo ""

echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${RED}❌  Tugma bor, lekin hech qanday handler yo'q (o'lik tugma)${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────────${RESET}"
for item in "${DEAD_BUTTONS[@]}"; do
  echo -e "  ${RED}❌${RESET}  $item"
done
echo ""

# ── 6. Summary ───────────────────────────────────────────────────────────────
coverage_pct=0
if [[ $total -gt 0 ]]; then
  coverage_pct=$(( (covered * 100) / total ))
fi

echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  XULOSA (SUMMARY)                                            ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}"
printf "${BOLD}║${RESET}  ${GREEN}✅  Qoplangan (route + nav)   : %-4d${RESET}                      ${BOLD}║${RESET}\n" "$covered"
printf "${BOLD}║${RESET}  ${YELLOW}⚠️   Route bor, nav yo'q       : %-4d${RESET}                      ${BOLD}║${RESET}\n" "$no_nav"
printf "${BOLD}║${RESET}  ℹ   Stub (vaqtinchalik)      : %-4d                      ${BOLD}║${RESET}\n" "$stub_count"
printf "${BOLD}║${RESET}  ${RED}❌  Frontend yo'q             : %-4d${RESET}                      ${BOLD}║${RESET}\n" "$missing"
printf "${BOLD}║${RESET}  📊  Jami backend modullari    : %-4d                      ${BOLD}║${RESET}\n" "$total"
printf "${BOLD}║${RESET}  ${CYAN}📈  Qoplash darajasi          : %d%%${RESET}                        ${BOLD}║${RESET}\n" "$coverage_pct"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}"
printf "${BOLD}║${RESET}  ${GREEN}✅  To'liq tugmalar (wired)   : %-4d${RESET}                      ${BOLD}║${RESET}\n" "${#WIRED_BUTTONS[@]}"
printf "${BOLD}║${RESET}  ${YELLOW}⚠️   Bo'sh handlerlar          : %-4d${RESET}                      ${BOLD}║${RESET}\n" "${#EMPTY_HANDLERS[@]}"
printf "${BOLD}║${RESET}  ${RED}❌  O'lik tugmalar            : %-4d (%d%%)${RESET}               ${BOLD}║${RESET}\n" "${#DEAD_BUTTONS[@]}" "$dead_pct"
printf "${BOLD}║${RESET}  📊  Tugma/forma sahifalari    : %-4d                      ${BOLD}║${RESET}\n" "$btn_total"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── 7. Optional JSON output ──────────────────────────────────────────────────
if [[ $OUTPUT_JSON -eq 1 ]]; then
  {
    printf '{\n'
    printf '  "generated_at": "%s",\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf '  "summary": {\n'
    printf '    "total_backend_modules": %d,\n' "$total"
    printf '    "covered": %d,\n' "$covered"
    printf '    "route_exists_no_nav": %d,\n' "$no_nav"
    printf '    "missing_frontend": %d,\n' "$missing"
    printf '    "coverage_percent": %d\n' "$coverage_pct"
    printf '  },\n'
    printf '  "covered": ['
    sep=""
    for item in "${COVERED_LIST[@]}"; do
      printf '%s\n    "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#COVERED_LIST[@]} -gt 0 ]] && printf '\n  '
    printf '],\n'
    printf '  "route_exists_no_nav": ['
    sep=""
    for item in "${NO_NAV_LIST[@]}"; do
      printf '%s\n    "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#NO_NAV_LIST[@]} -gt 0 ]] && printf '\n  '
    printf '],\n'
    printf '  "missing_frontend": ['
    sep=""
    for item in "${MISSING_LIST[@]}"; do
      printf '%s\n    "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#MISSING_LIST[@]} -gt 0 ]] && printf '\n  '
    printf '],\n'
    printf '  "button_audit": {\n'
    printf '    "summary": {\n'
    printf '      "pages_with_buttons": %d,\n' "$btn_total"
    printf '      "wired": %d,\n' "${#WIRED_BUTTONS[@]}"
    printf '      "empty_handler": %d,\n' "${#EMPTY_HANDLERS[@]}"
    printf '      "dead_buttons": %d,\n' "${#DEAD_BUTTONS[@]}"
    printf '      "dead_percent": %d\n' "$dead_pct"
    printf '    },\n'
    printf '    "wired_buttons": ['
    sep=""
    for item in "${WIRED_BUTTONS[@]}"; do
      printf '%s\n      "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#WIRED_BUTTONS[@]} -gt 0 ]] && printf '\n    '
    printf '],\n'
    printf '    "empty_handlers": ['
    sep=""
    for item in "${EMPTY_HANDLERS[@]}"; do
      printf '%s\n      "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#EMPTY_HANDLERS[@]} -gt 0 ]] && printf '\n    '
    printf '],\n'
    printf '    "dead_buttons": ['
    sep=""
    for item in "${DEAD_BUTTONS[@]}"; do
      printf '%s\n      "%s"' "$sep" "$item"
      sep=","
    done
    [[ ${#DEAD_BUTTONS[@]} -gt 0 ]] && printf '\n    '
    printf ']\n'
    printf '  }\n'
    printf '}\n'
  } > "$JSON_OUT"
  echo -e "${CYAN}📄 JSON hisobot saqlandi: ${BOLD}$JSON_OUT${RESET}"
  echo ""
fi

exit 0
