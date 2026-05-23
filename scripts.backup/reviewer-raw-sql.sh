#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  Raw SQL Reviewer — db.execute(sql`...`) va runQuery(sql`...`)
#  Qoida 4: CRUD uchun ORM; murakkab so'rovlar uchun raw SQL maqbul.
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; YEL='\033[0;33m'; GRN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
PASS=0; WARN=0; FAIL=0

ok()   { echo -e "  ${GRN}✓${NC}  $*"; PASS=$((PASS+1)); }
warn() { echo -e "  ${YEL}⚠${NC}  $*"; WARN=$((WARN+1)); }
ng()   { echo -e "  ${RED}✗${NC}  $*"; FAIL=$((FAIL+1)); }

REPO_DIR="apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Raw SQL Reviewer (QOIDA 4)                          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${BOLD}§1 — db.execute/runQuery raw SQL fayllar${NC}"
echo "──────────────────────────────────────────────────────"

if [ ! -d "$REPO_DIR" ]; then
  warn "$REPO_DIR papkasi topilmadi"
else
  # Barcha fayllarni bir marta grep bilan topamiz
  RAW_FILES=$(grep -rl "db\.execute\|runQuery(sql" "$REPO_DIR" 2>/dev/null \
    | grep -v "spec\|test\|\.d\.ts\|migration" || true)

  if [ -z "$RAW_FILES" ]; then
    ok "Raw SQL topilmadi — ORM qo'llanilmoqda"
  else
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      fname="$(basename "$file")"
      raw_count=$(grep -cE "(db\.execute|runQuery)\(sql" "$file" 2>/dev/null || echo 0)
      raw_count="${raw_count//[^0-9]/}"; raw_count="${raw_count:-0}"
      [ "$raw_count" -eq 0 ] && continue

      # Murakkab-so'rov belgisi: LATERAL, JSONB_AGG, tsvector, etc.
      if grep -qiE "(LATERAL|JSONB_AGG|json_agg|tsvector|WITH RECURSIVE|unnest|PARTITION BY|NOTE:)" "$file" 2>/dev/null; then
        warn "$fname — $raw_count ta raw SQL (murakkab so'rov/izoh bilan)"
      else
        ng "$fname — $raw_count ta raw SQL (ORM ga o'tkazish kerak)"
        grep -nE "(db\.execute|runQuery)\(sql" "$file" 2>/dev/null | head -2 | while IFS= read -r ln; do
          echo "     → $ln"
        done
      fi
    done <<< "$RAW_FILES"
  fi
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
printf "${BOLD}  PASS: %-4s |  WARN: %-4s |  FAIL: %-4s${NC}\n" "$PASS" "$WARN" "$FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
