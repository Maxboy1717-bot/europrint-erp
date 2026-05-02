#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Controller Result<T> Reviewer
# Ishlatish: bash scripts/reviewer-controller-result.sh
#
# NIMA TEKSHIRADI:
#   *.controller.ts fayllarida service metodlari to'g'ridan qaytarilsa,
#   ya'ni return this.service.method() pattern topilsa — FAIL.
#
# TO'G'RI yozish:
#   const result = await this.service.method();
#   if (result.isFailure) throw new InternalServerErrorException(result.error);
#   return result.getValue();
#
# YOKI global ResultUnwrapInterceptor ishlatiladi (app.module.ts da ro'yxatdan).
#
# CHIQISH:
#   exit 0 → PASS (hech qanday xavfli pattern yo'q)
#   exit 1 → FAIL (xavfli controller metodlari topildi)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

ok()  { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()  { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
info(){ echo -e "  ${YELLOW}ℹ${NC}  $*"; }

CTRL_DIR="apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Controller Result<T> Reviewer                       ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""
echo "  Tekshirilmoqda: $CTRL_DIR/**/*.controller.ts"
echo "  Xavfli pattern: 'return this.<service>.<method>('"
echo "  (await va getValue() bo'lsa — ruxsat beriladi)"
echo ""
echo -e "${BOLD}──────────────────────────────────────────────────────${NC}"

if [ ! -d "$CTRL_DIR" ]; then
  echo -e "  ${RED}✗ CTRL_DIR topilmadi: $CTRL_DIR${NC}"
  exit 1
fi

# Barcha controller fayllarni topish
mapfile -t CTRL_FILES < <(
  find "$CTRL_DIR" -name "*.controller.ts" \
    ! -name "*.spec.ts" ! -name "*.test.ts" ! -name "*.d.ts" \
    | sort
)

TOTAL_FILES=${#CTRL_FILES[@]}
if [ "$TOTAL_FILES" -eq 0 ]; then
  echo -e "  ${YELLOW}⚠  Controller fayl topilmadi: $CTRL_DIR${NC}"
  exit 0
fi

# Har bir controller faylni skanerlash
for file in "${CTRL_FILES[@]}"; do
  fname="$(basename "$file")"
  relpath="${file#apps/api/src/}"

  # Xavfli pattern: "return this.anyService.anyMethod(" —
  # lekin "await" yoki ".getValue(" yoki ".value" bilan tugasa — xavfsiz
  HITS=$(grep -nE "^\s+return this\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\(" "$file" 2>/dev/null \
    | grep -vE "\.getValue\(|await\s+this\.|\/\/" \
    || true)

  if [ -z "$HITS" ]; then
    ok "$fname"
  else
    COUNT=$(echo "$HITS" | wc -l | tr -d ' ')
    ng "$fname — $COUNT ta xavfli satr (Result<T> unwrap qilinmagan):"
    echo "$HITS" | head -5 | while IFS= read -r line; do
      echo -e "       ${RED}→${NC} $line"
    done
    if [ "$COUNT" -gt 5 ]; then
      echo -e "       ${YELLOW}... va yana $((COUNT - 5)) ta satr${NC}"
    fi
    echo ""
    echo "     Tuzatish varianti A (qo'lda):"
    echo "       const r = await this.service.method();"
    echo "       if (r.isFailure) throw new InternalServerErrorException(r.error);"
    echo "       return r.getValue();"
    echo "     Tuzatish varianti B (global interceptor):"
    echo "       app.module.ts da ResultUnwrapInterceptor ro'yxatdan o'tkazilganligini tekshiring."
  fi
done

echo ""
echo -e "${BOLD}──────────────────────────────────────────────────────${NC}"
echo "  Tekshirilgan fayllar : $TOTAL_FILES"
echo "  PASS                 : $PASS"
echo "  FAIL                 : $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}${BOLD}→ $FAIL ta controller Result<T> unwrap qilmayapti.${NC}"
  echo -e "  ${YELLOW}  ResultUnwrapInterceptor global bo'lsa — bu WARN darajasida.${NC}"
  echo -e "  ${YELLOW}  Agar interceptor yo'q bo'lsa — frontend TypeError chiqaradi!${NC}"
  exit 1
fi

echo ""
echo -e "  ${GREEN}${BOLD}→ Barcha controller'lar PASS.${NC}"
exit 0
