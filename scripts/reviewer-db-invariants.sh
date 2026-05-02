#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — DB Invariants Reviewer (TZ-D16)
# Ishlatish: bash scripts/reviewer-db-invariants.sh
#
# Tekshiradi:
#   §1 invariants.ts mavjudligi [FAIL]
#   §2 CHK constraint soni ≥ 10 [FAIL]
#   §3 Asosiy invariantlar (qty/maosh/sana) [FAIL agar yo'q]
#   §4 main.ts / bootstrap da ensureDbInvariants chaqiruvi [FAIL]
#
# exit 0 → PASS | exit 1 → FAIL
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

INVARIANTS="apps/api/src/shared/db/invariants.ts"
MAIN_TS="apps/api/src/main.ts"
MIN_CONSTRAINTS=10

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  DB Invariants Reviewer (TZ-D16)                     ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: invariants.ts mavjudligi ──────────────────────────────────
echo ""
echo -e "${BOLD}§1 — invariants.ts mavjudligi [CRITICAL]:${NC}"
if [ ! -f "$INVARIANTS" ]; then
  ng "invariants.ts topilmadi: $INVARIANTS"
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
  echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
  echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
  exit 1
fi
ok "invariants.ts topildi: $INVARIANTS ✓"

# ── §2: Constraint soni [FAIL agar kam] ───────────────────────────
echo ""
echo -e "${BOLD}§2 — CHK constraint soni (minimum $MIN_CONSTRAINTS) [CRITICAL]:${NC}"
CHK_COUNT=$(grep -c "chk_" "$INVARIANTS" 2>/dev/null || echo 0)
if [ "$CHK_COUNT" -ge "$MIN_CONSTRAINTS" ]; then
  ok "$CHK_COUNT ta chk_ constraint topildi (≥ $MIN_CONSTRAINTS) ✓"
else
  ng "$CHK_COUNT ta chk_ constraint (minimum $MIN_CONSTRAINTS kerak)"
fi

# ── §3: Asosiy invariantlar [FAIL agar yo'q] ─────────────────────
echo ""
echo -e "${BOLD}§3 — Asosiy invariantlar [CRITICAL]:${NC}"

check_constraint_fail() {
  local pattern="$1"
  local label="$2"
  if grep -qE "$pattern" "$INVARIANTS" 2>/dev/null; then
    ok "$label ✓"
  else
    ng "$label — topilmadi! Qo'shing."
  fi
}

check_constraint_fail "qty.*>=.*0|quantity.*>=.*0" "Inventar qty >= 0"
check_constraint_fail "net_salary.*<=.*gross|net.*<=.*gross" "Maosh: net <= gross"
check_constraint_fail "paid_amount.*<=.*total|paid.*<=.*total" "To'lov: paid <= total"
check_constraint_fail "total.*>=.*0|amount.*>=.*0" "Jami summa >= 0"
check_constraint_fail "parent_id.*!=|parent.*!=.*child" "BOM: parent != child"
check_constraint_fail "end_date.*>=.*start_date|end.*>=.*start" "Sana: end >= start"

# ── §4: main.ts da ensureDbInvariants wiring [CRITICAL FAIL] ──────
echo ""
echo -e "${BOLD}§4 — ensureDbInvariants startup integratsiyasi [CRITICAL]:${NC}"
WIRED_COUNT=$(grep -c "ensureDbInvariants" "$MAIN_TS" 2>/dev/null || echo 0)
if [ "$WIRED_COUNT" -gt 0 ]; then
  ok "ensureDbInvariants main.ts da topildi ($WIRED_COUNT ta joy) ✓"
  # Yana tekshirish: await bilan chaqiriladimi?
  AWAIT_COUNT=$(grep -c "await ensureDbInvariants" "$MAIN_TS" 2>/dev/null || echo 0)
  if [ "$AWAIT_COUNT" -gt 0 ]; then
    ok "await ensureDbInvariants() chaqiruvi mavjud ✓"
  else
    warn "ensureDbInvariants await bilan chaqirilmagan — asinxron xatolarga olib kelishi mumkin"
  fi
else
  ng "ensureDbInvariants main.ts da topilmadi — startup da chaqirilmasa constraintlar qo'llanmaydi!"
fi

# ── §5: DB o'zi import qilinganmi? ────────────────────────────────
echo ""
echo -e "${BOLD}§5 — DB import (self-contained) tekshiruvi:${NC}"
HAS_DB_IMPORT=$(grep -c "from.*schema\|from.*shared/db\|import.*db " "$INVARIANTS" 2>/dev/null || echo 0)
if [ "$HAS_DB_IMPORT" -gt 0 ]; then
  ok "invariants.ts o'z ichida db import qiladi ✓"
else
  warn "invariants.ts db importi topilmadi — funksiya parametr orqali olishi kerak"
fi

# ── Yakuniy ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n  ${RED}${BOLD}→ FAIL. DB invariantlarni to'g'rilang.${NC}"
  exit 1
fi
echo -e "\n  ${GREEN}${BOLD}→ PASS.${NC}"
exit 0
