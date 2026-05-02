#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 6 — 'any' yo'q qilish (TypeScript strict)
#  Ishlatish: bash apps/api/scripts/faza6.sh
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"

GRN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

hdr()  { echo ""; echo -e "${BLU}${BOLD}── $1 ──${NC}"; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🟡 FAZA 6 — TypeScript 'any' yo'q qilish${NC}"
echo ""

hdr "@ts-ignore soni (barcha modullar)"
TS_TOTAL=$(grep -rn "@ts-ignore" "$SRC" --include="*.ts" \
  2>/dev/null | grep -v "\.d\.ts\|\.spec\." | wc -l | tr -d ' ')
if [ "$TS_TOTAL" -eq 0 ]; then
  ok "@ts-ignore — 0 ta ✅"
else
  fail "@ts-ignore — $TS_TOTAL ta (TypeScript amalda o'chirilgan!):"
  grep -rn "@ts-ignore" "$SRC" --include="*.ts" 2>/dev/null | \
    grep -v "\.d\.ts\|\.spec\." | awk -F: '{print $1}' | \
    sort | uniq -c | sort -rn | head -10 | \
    while read -r cnt file; do
      echo "       $cnt× ${file#$SRC/}"
    done
fi

hdr "Modullar bo'yicha 'any' soni"

TOTAL=0
for DIR in "$SRC/modules"/*/; do
  MOD=$(basename "$DIR")
  COUNT=$(grep -rn ": any\b\|as any\b\|<any>" "$DIR" --include="*.ts" \
    2>/dev/null | grep -v "\.spec\.\|\.d\.ts" | wc -l | tr -d ' ')
  TOTAL=$((TOTAL + COUNT))
  if [ "$COUNT" -eq 0 ]; then
    ok "$MOD — 0 ta any"
  elif [ "$COUNT" -lt 5 ]; then
    fail "$MOD — $COUNT ta any (kam, tuzatish oson)"
  else
    fail "$MOD — $COUNT ta any"
  fi
done

hdr "Fayl bo'yicha 'any' (ko'p bo'lganlardan)"
echo "  (Top 20)"
grep -rn ": any\b\|as any\b\|<any>" "$SRC" --include="*.ts" \
  2>/dev/null | grep -v "\.spec\.\|\.d\.ts" | \
  awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20 | \
  while read -r cnt file; do
    if [ "$cnt" -ge 5 ]; then
      fail "$cnt× ${file#$SRC/}"
    elif [ "$cnt" -ge 2 ]; then
      echo -e "  ${YEL}⚠️ ${NC}  $cnt× ${file#$SRC/}"
    else
      echo -e "  ${CYN}·${NC}   $cnt× ${file#$SRC/}"
    fi
  done

hdr "O'zgartirish tavsiyalari"
echo "  'any' → to'g'ri tip variantlari:"
echo ""
echo "   ❌ function rows(r: any)"
echo "   ✅ function rows(r: unknown)"
echo ""
echo "   ❌ const data: any = result"
echo "   ✅ const data: Record<string, unknown> = result"
echo ""
echo "   ❌ catch (e: any)"
echo "   ✅ catch (e: unknown)"
echo ""
echo "   ❌ as any"
echo "   ✅ as Record<string, unknown> yoki as SomeType"
echo ""
echo "   ❌ Promise<any>"
echo "   ✅ Promise<Record<string, unknown>[]>"

hdr "NATIJA"
if [ "$TOTAL" -eq 0 ]; then
  ok "'any' — 0 ta. TypeScript strict ✅"
  echo -e "  ${GRN}${BOLD}✅ FAZA 6 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza7.sh${NC}"
else
  fail "Jami $TOTAL ta 'any' qolgan"
  info "audit.sh bu xatolarni ushlaydi — har modulni birma-bir tozalang"
fi
echo ""
