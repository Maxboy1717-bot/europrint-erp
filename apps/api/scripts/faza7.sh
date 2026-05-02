#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 7 — AuditInterceptor qo'shish (POST/PUT/PATCH/DELETE)
#  Ishlatish: bash apps/api/scripts/faza7.sh [--fix]
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
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

echo ""
echo -e "${BOLD}  🟢 FAZA 7 — AuditInterceptor${NC}"
$FIX && echo -e "  ${CYN}Rejim: AVTOMATIK TUZATISH${NC}" || \
        echo -e "  Rejim: Faqat hisobot (--fix bilan tuzat)"
echo ""

WITH=0; WITHOUT=0; FIXED_COUNT=0

hdr "Controller holati (write operatsiyalari bor bo'lganlar)"
while IFS= read -r f; do
  # Faqat write operatsiyalari bo'lgan controllerlarni tekshir
  HAS_WRITE=$(grep -qE "@Post\b|@Put\b|@Patch\b|@Delete\b" "$f" && echo yes || echo no)
  [ "$HAS_WRITE" = "no" ] && continue

  HAS_AUDIT=$(grep -q "AuditInterceptor" "$f" && echo yes || echo no)
  NAME=$(basename "$f")

  if [ "$HAS_AUDIT" = "yes" ]; then
    WITH=$((WITH+1))
    ok "$NAME"
  else
    WITHOUT=$((WITHOUT+1))
    if $FIX; then
      # UseInterceptors import qo'shish
      if ! grep -q "UseInterceptors" "$f"; then
        sed -i "s|from '@nestjs/common'|, UseInterceptors } from '@nestjs/common'|" "$f"
        sed -i "s|} from '@nestjs/common'|UseInterceptors } from '@nestjs/common'|" "$f"
      fi
      # AuditInterceptor import qo'shish
      if ! grep -q "AuditInterceptor" "$f"; then
        sed -i "1s|^|import { AuditInterceptor } from '@common/interceptors/audit.interceptor';\n|" "$f"
      fi
      # @UseInterceptors(AuditInterceptor) qo'shish — @Controller dan oldin
      sed -i "s|@Controller(|@UseInterceptors(AuditInterceptor)\n@Controller(|" "$f"
      FIXED_COUNT=$((FIXED_COUNT+1))
      fixed "$NAME — AuditInterceptor qo'shildi"
    else
      fail "$NAME — AuditInterceptor yo'q"
    fi
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)

hdr "Modul bo'yicha statistika"
for DIR in "$SRC/modules"/*/; do
  MOD=$(basename "$DIR")
  MOD_WITH=$(grep -rl "AuditInterceptor" "$DIR" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
  MOD_WRITE=$(find "$DIR" -name "*.controller.ts" | \
    xargs grep -l "@Post\|@Put\|@Patch\|@Delete" 2>/dev/null | wc -l | tr -d ' ')
  [ "$MOD_WRITE" -eq 0 ] && continue

  if [ "$MOD_WITH" -ge "$MOD_WRITE" ]; then
    ok "$MOD — $MOD_WITH/$MOD_WRITE"
  else
    fail "$MOD — $MOD_WITH/$MOD_WRITE audit bor"
  fi
done

hdr "NATIJA"
TOTAL=$((WITH + WITHOUT))
PCT=0; [ $TOTAL -gt 0 ] && PCT=$((WITH * 100 / TOTAL))
echo "  AuditInterceptor bor : $WITH / $TOTAL  ($PCT%)"
$FIX && echo "  Avtomatik tuzatildi  : $FIXED_COUNT"
echo ""
if [ "$WITHOUT" -eq 0 ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 7 YAKUNLANDI!${NC}"
  echo -e "  Keyingi: ${BOLD}bash $(dirname "$0")/faza8.sh${NC}"
else
  if ! $FIX; then
    echo -e "  ${YEL}Avtomatik tuzatish: ${BOLD}bash $(dirname "$0")/faza7.sh --fix${NC}"
    info "DIQQAT: --fix dan oldin git commit qiling (rollback uchun)"
  fi
fi
echo ""
