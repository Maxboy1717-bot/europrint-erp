#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 1 — XAVFSIZLIK + QUICK WINS
#  Ishlatish: bash apps/api/scripts/faza1.sh [--fix]
#
#  --fix  : Avtomatik tuzatish (faqat xavfsiz o'zgartirishlar)
#  (argumentsiz): Faqat hisobot
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
FIX=false
[ "${1:-}" = "--fix" ] && FIX=true

GRN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

hdr()  { echo ""; echo -e "${BLU}${BOLD}── $1 ──${NC}"; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
fixed(){ echo -e "  ${CYN}🔧${NC}  $1"; }
info() { echo -e "  ${YEL}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🔴 FAZA 1 — XAVFSIZLIK${NC}"
$FIX && echo -e "  ${CYN}Rejim: AVTOMATIK TUZATISH${NC}" || echo -e "  Rejim: Faqat hisobot (--fix bilan tuzat)"
echo ""

FIXED_COUNT=0; ISSUES=0

# ─── 1.1 @Roles yo'q controllerlar ───────────────────────────
hdr "1.1  @Roles TEKSHIRUVI — Compat Controllerlar"
while IFS= read -r f; do
  NAME=$(basename "$f")
  if grep -qE "@Roles|@Public" "$f" 2>/dev/null; then
    ok "$NAME"
  else
    ISSUES=$((ISSUES+1))
    if $FIX; then
      # Throttle dekoratoridan keyin @Roles qo'shish
      if grep -q "@Throttle" "$f"; then
        sed -i "s|@Throttle|@Roles('admin', 'manager', 'hr_manager', 'director')\n@Throttle|" "$f"
        # Import qo'shish
        if ! grep -q "from '@common/decorators/roles.decorator'" "$f"; then
          sed -i "1s|^|import { Roles } from '@common/decorators/roles.decorator';\n|" "$f"
        fi
        FIXED_COUNT=$((FIXED_COUNT+1))
        fixed "$NAME — @Roles qo'shildi"
      else
        fail "$NAME — @Roles YO'Q (qo'lda tuzat)"
      fi
    else
      fail "$NAME — @Roles YO'Q"
    fi
  fi
done < <(find "$SRC/modules/compatibility" -name "*.controller.ts" | sort)

# ─── 1.2 Lokal rows()/safeInt() ───────────────────────────────
hdr "1.2  COPY-PASTE BOILERPLATE — rows()/safeInt()"
while IFS= read -r f; do
  HAS_ROWS=$(grep -E "^function rows\(|^function safeInt\(" "$f" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$HAS_ROWS" -gt 0 ]; then
    ISSUES=$((ISSUES+1))
    if $FIX; then
      # 1. rows()/safeInt() funksiyalarini o'chirish
      sed -i '/^function rows(/,/^}$/d' "$f"
      sed -i '/^function safeInt(/,/^}$/d' "$f"
      # 2. dbRows import qo'shish (agar yo'q bo'lsa)
      if ! grep -q "dbRows" "$f"; then
        # compatibility controllers uchun relative path
        sed -i "1s|^|import { dbRows } from '../hr/common/db-rows';\n|" "$f"
      fi
      # 3. rows(r) → dbRows(r) almashtirish
      sed -i 's/= rows(/= dbRows(/g' "$f"
      sed -i 's/rows(r)/dbRows(r)/g' "$f"
      sed -i 's/return rows(/return dbRows(/g' "$f"
      FIXED_COUNT=$((FIXED_COUNT+1))
      fixed "$(basename "$f") — rows()/safeInt() o'chirildi, dbRows() qo'shildi"
    else
      fail "$(basename "$f") — lokal rows()/safeInt() topildi ($HAS_ROWS ta)"
    fi
  fi
done < <(find "$SRC" -name "*.ts" | grep -v "\.spec\.\|\.d\.ts" | sort)

# ─── 1.3 300+ qatorli fayllar ────────────────────────────────
hdr "1.3  FAYL HAJMI — 300+ qatorli fayllar"
BIG_FOUND=false
while IFS= read -r f; do
  L=$(wc -l < "$f")
  if [ "$L" -gt 300 ]; then
    BIG_FOUND=true
    ISSUES=$((ISSUES+1))
    fail "$(basename "$f") — $L qator (${f#$SRC/})"
    info "Qo'lda bo'lish kerak — AI agent bilan bajarish tavsiya etiladi"
  fi
done < <(find "$SRC" -name "*.ts" | grep -v "\.spec\.\|\.d\.ts" | sort)
$BIG_FOUND || ok "Barcha fayllar ≤ 300 qator"

# ─── 1.4 @ts-ignore hisobot (bloker emas — Faza 6 da tozalanadi) ─────────────
hdr "1.4  @ts-ignore HISOBOT (Faza 6 ishi — bu faza uchun bloker emas)"
TS_IGN=$(grep -rl "@ts-ignore" "$SRC" --include="*.ts" 2>/dev/null | grep -v "\.d\.ts" | sort)
if [ -z "$TS_IGN" ]; then
  ok "@ts-ignore yo'q"
else
  N=$(echo "$TS_IGN" | wc -l | tr -d ' ')
  TOTAL=$(grep -rh "@ts-ignore" "$SRC" --include="*.ts" 2>/dev/null | grep -v "\.d\.ts" | wc -l | tr -d ' ')
  info "@ts-ignore mavjud: $N fayl, $TOTAL ta qator (Faza 6 da yo'q qilinadi — bu faza uchun bloker emas)"
fi

# ─── Natija ───────────────────────────────────────────────────
echo ""
echo -e "${BLU}${BOLD}── FAZA 1 NATIJA ──${NC}"
echo ""
if $FIX; then
  echo -e "  🔧  Avtomatik tuzatildi : ${CYN}${BOLD}$FIXED_COUNT${NC}"
fi
echo -e "  ❌  Qolgan muammolar   : ${RED}${BOLD}$ISSUES${NC}"
echo ""
if [ $ISSUES -eq 0 ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 1 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza2.sh${NC}"
else
  if $FIX; then
    echo -e "  ${YEL}Qo'lda tuzatish talab qiladigan muammolar qoldi.${NC}"
    echo -e "  AI agent bilan ishlash uchun: faza2.sh ga o'ting"
  else
    echo -e "  ${YEL}Avtomatik tuzatish uchun: ${BOLD}bash $(dirname "$0")/faza1.sh --fix${NC}"
  fi
fi
echo ""
