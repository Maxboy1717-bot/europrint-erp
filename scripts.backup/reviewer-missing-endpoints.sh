#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Task #367 Missing-Endpoint Reviewer
# Checks that the 49 missing endpoints have been created correctly:
#   1. No bare stubs (return []; / return {};) in new controllers
#   2. Array.isArray guard in recruitment controllers
#   3. Promise<Result< pattern in new repos
#   4. JwtAuthGuard / UseGuards in new controllers
#   5. Key endpoint routes exist
#
# Exit 0 → 0 FAIL (all checks passed)
# Exit 1 → one or more checks failed
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0

RED='\033[0;31m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'

ok()  { echo -e "  ${GREEN}[PASS]${NC}  $*"; ((PASS++)) || true; }
ng()  { echo -e "  ${RED}[FAIL]${NC}  $*"; ((FAIL++)) || true; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  EuroPrint Task #367 — Endpoint Reviewer             ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ─── §1  No stubs in new/updated controllers ───────────────────────
echo ""
echo -e "${BOLD}§1 — Stub check (bare return [];  / return {};)${NC}"
echo "──────────────────────────────────────────────────────"

STUB_DIRS=(
  "$API/hr/recruitment"
  "$API/hr/safety"
  "$API/hr/offboarding"
)

for dir in "${STUB_DIRS[@]}"; do
  [ -d "$dir" ] || { ng "Directory missing: $dir"; continue; }
  hits=$(grep -rn --include="*.controller.ts" \
         -E "^\s+return \[\];\s*$|^\s+return \{\};\s*$" \
         "$dir" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    ng "Stub found in $(basename "$dir"):"
    echo "$hits" | while read -r line; do echo "       $line"; done
  else
    ok "No stubs in $(basename "$dir")"
  fi
done

RECRUIT_CTRL="$API/hr/recruitment/recruitment.controller.ts"
if [ -f "$RECRUIT_CTRL" ]; then
  stubs=$(grep -n "^\s*return \[\];\s*$" "$RECRUIT_CTRL" 2>/dev/null || true)
  if [ -n "$stubs" ]; then
    ng "Stub still present in recruitment.controller.ts: $stubs"
  else
    ok "recruitment.controller.ts — no bare return []"
  fi
fi

# ─── §2  Array.isArray in recruitment controllers ──────────────────
echo ""
echo -e "${BOLD}§2 — Array.isArray guard in recruitment controllers${NC}"
echo "──────────────────────────────────────────────────────"

RECRUIT_DIR="$API/hr/recruitment"
if [ -d "$RECRUIT_DIR" ]; then
  found_ai=0
  while IFS= read -r f; do
    if grep -q "Array.isArray" "$f" 2>/dev/null; then
      ok "Array.isArray in $(basename "$f")"
      found_ai=1
    fi
  done < <(find "$RECRUIT_DIR" -name "*.controller.ts" 2>/dev/null)
  [ "$found_ai" -eq 0 ] && ng "No Array.isArray found in any recruitment controller"
else
  ng "Recruitment directory missing: $RECRUIT_DIR"
fi

# ─── §3  Promise<Result< in repos ─────────────────────────────────
echo ""
echo -e "${BOLD}§3 — Promise<Result< in repos${NC}"
echo "──────────────────────────────────────────────────────"

REPO_DIRS=(
  "$API/hr/recruitment/repos"
  "$API/hr/safety"
  "$API/hr/offboarding"
)

for dir in "${REPO_DIRS[@]}"; do
  [ -d "$dir" ] || { ng "Repo dir missing: $dir"; continue; }
  repo_files=$(find "$dir" \( -name "*.repo.ts" -o -name "*.repository.ts" \) 2>/dev/null | head -20)
  if [ -z "$repo_files" ]; then
    ng "No repo files in $(basename "$dir")"; continue
  fi
  found_r=0
  while IFS= read -r f; do
    if grep -q "Promise<Result<" "$f" 2>/dev/null; then
      ok "Promise<Result< in $(basename "$f")"; found_r=1
    fi
  done <<< "$repo_files"
  [ "$found_r" -eq 0 ] && ng "No Promise<Result< found in $(basename "$dir") repos"
done

# ─── §4  Guards in new controllers ────────────────────────────────
echo ""
echo -e "${BOLD}§4 — JwtAuthGuard / UseGuards in new controllers${NC}"
echo "──────────────────────────────────────────────────────"

NEW_CTRLS=(
  "$API/hr/recruitment/hr-vacancies.controller.ts"
  "$API/hr/safety/hr-safety.controller.ts"
  "$API/hr/offboarding/hr-offboarding.controller.ts"
  "$API/hr/presentation/hr-gsd.controller.ts"
)

for f in "${NEW_CTRLS[@]}"; do
  [ -f "$f" ] || { ng "Controller file missing: $(basename "$f")"; continue; }
  if grep -q "JwtAuthGuard\|UseGuards" "$f" 2>/dev/null; then
    ok "Guard present in $(basename "$f")"
  else
    ng "No JwtAuthGuard/UseGuards in $(basename "$f")"
  fi
done

# ─── §5  Key endpoint routes ──────────────────────────────────────
echo ""
echo -e "${BOLD}§5 — Key endpoint route patterns${NC}"
echo "──────────────────────────────────────────────────────"

check_ep() {
  local label="$1" file="$2" pattern="$3"
  [ -f "$file" ] || { ng "$label — file missing: $(basename "$file")"; return; }
  if grep -qE "$pattern" "$file" 2>/dev/null; then
    ok "$label"
  else
    ng "$label — pattern not found in $(basename "$file")"
  fi
}

check_ep "GET  adaptation/new-employees/:id" \
  "$API/adaptation/adaptation.controller.ts" \
  "@Get\('new-employees/:id'\)"

check_ep "GET  chat (root)" \
  "$API/chat/chat.controller.ts" \
  "@Get\(\)"

check_ep "POST finance/payments/:id/approve" \
  "$API/finance/presentation/finance-payments.controller.ts" \
  "@Post\(':id/approve'\)"

check_ep "GET  finance/accounting" \
  "$API/finance/presentation/finance-main.controller.ts" \
  "@Get\('accounting'\)"

check_ep "GET  finance/salary-benchmark/:userId" \
  "$API/finance/presentation/finance-main.controller.ts" \
  "@Get\('salary-benchmark/:userId'\)"

check_ep "GET  crm/companies/:companyId/contacts/:contactId" \
  "$API/crm/presentation/crm-companies.controller.ts" \
  "@Get\('companies/:companyId/contacts/:contactId'\)"

check_ep "POST crm/ai/autofill/:entityId" \
  "$API/crm/presentation/crm-ai-extended.controller.ts" \
  "@Post\('autofill/:entityId'\)"

check_ep "GET  hr/employees/list/for-face" \
  "$API/hr/presentation/hr-employees-ext.controller.ts" \
  "@Get\('list/for-face'\)"

check_ep "HR vacancies controller exists" \
  "$API/hr/recruitment/hr-vacancies.controller.ts" \
  "@Get|@Post|@Patch|@Delete"

check_ep "HR safety controller exists" \
  "$API/hr/safety/hr-safety.controller.ts" \
  "@Get|@Post|@Patch|@Delete"

check_ep "HR offboarding controller exists" \
  "$API/hr/offboarding/hr-offboarding.controller.ts" \
  "@Get|@Post|@Patch|@Delete"

check_ep "HR GSD controller exists" \
  "$API/hr/presentation/hr-gsd.controller.ts" \
  "@Get|@Post|@Patch|@Delete"

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}RESULT: 0 FAIL — all endpoint checks passed ✓${NC}"
else
  echo -e "  ${RED}RESULT: $FAIL FAIL — fix the issues listed above${NC}"
fi
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
