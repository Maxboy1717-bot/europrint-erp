#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — TypeError Xavf Audit Skripti        (≤150 qator)
# §1 KRITIK  — Tip B (@common/result) to'g'ridan qaytaruvchi ctrl
# §2 XAVFLI  — Tip A (shared/domain/result) qaytaruvchi ctrl
# §3 FRONTEND — .filter/.map/.reduce Array.isArray himoyasiz
# exit 0: interceptor har ikki tipni taniydi | exit 1: Tip B tanilmaydi
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
R='\033[0;31m'; Y='\033[1;33m'; G='\033[0;32m'; B='\033[1m'; N='\033[0m'

KRITIK=0; XAVFLI=0; FRONTEND=0
CTRL="apps/api/src/modules"
FRONT="artifacts/erp-dashboard/src"
ICEPTOR="apps/api/src/common/interceptors/result-unwrap.interceptor.ts"

echo -e "\n${B}╔══════════════════════════════════════════════════════╗"
echo -e "║   TypeError Xavf Audit — EuroPrint ERP              ║"
echo -e "╚══════════════════════════════════════════════════════╝${N}"

ICEPTOR_OK=0
# Semantik tekshiruv: interceptorida isOk() Tip B unwrap logikasi bormi?
if grep -qE "typeof[[:space:]]+[^;]+isOk[[:space:]]*===.*function|isOk\(\).*return|\.isOk\(\)" "$ICEPTOR" 2>/dev/null \
   && grep -qE "isTipB|Tip B" "$ICEPTOR" 2>/dev/null; then
  ICEPTOR_OK=1
fi

# Papka ro'yxatlarini oldindan tayyorlash
mapfile -t B_DIRS < <(grep -rl "from '@common/result'" "$CTRL" \
  --include="*.service.ts" 2>/dev/null | xargs -I{} dirname {} | sort -u || true)
mapfile -t A_DIRS < <(grep -rl "shared/domain/result" "$CTRL" \
  --include="*.service.ts" 2>/dev/null | xargs -I{} dirname {} | sort -u || true)

# HTTP metod+yo'l oluvchi funksiya
http_info() {
  local f="$1" ln="$2"
  local base before method sub
  base=$(grep -oE "@Controller\(['\"][^'\"]*" "$f" 2>/dev/null | head -1 \
    | grep -oE "['\"][^'\"]*" | tr -d "'\"" | sed 's|^/||' || echo "")
  before=$(head -n "$ln" "$f" 2>/dev/null)
  method=$(echo "$before" | grep -oE "@(Get|Post|Put|Patch|Delete)" | tail -1 | tr -d '@' || echo "?")
  sub=$(echo "$before" | grep -oE "@(Get|Post|Put|Patch|Delete)\(['\"][^'\"]*" | tail -1 \
    | grep -oE "['\"][^'\"]*" | tr -d "'\"/" || echo "")
  local route="/api/${base:+$base/}${sub}"
  echo "${method^^} ${route%/}"
}

# ── §1: KRITIK — Tip B controller'lar ─────────────────────────────
echo -e "\n${B}§1 KRITIK — @common/result (Tip B) controller'lar:${N}"
if [ "$ICEPTOR_OK" -eq 1 ]; then
  echo -e "   Interceptor isTipB() ${G}HA${N} — xavf bartaraf, kuzatuv uchun ro'yxatlanadi"
else
  echo -e "   ${R}Interceptor isTipB() YO'Q — haqiqiy TypeError xavfi!${N}"
fi
echo "──────────────────────────────────────────────────────"

while IFS= read -r ctrl; do
  fname="$(basename "$ctrl")"; dir="$(dirname "$ctrl")"
  IS_B=0; for d in "${B_DIRS[@]:-x}"; do [ "$d" = "$dir" ] && IS_B=1 && break; done
  [ "$IS_B" -eq 0 ] && continue
  mapfile -t HITS < <(grep -nE "^\s+return this\.[a-zA-Z_]+\.[a-zA-Z_]+\(" "$ctrl" 2>/dev/null \
    | grep -vE "getValue\(|\/\/" || true)
  [ ${#HITS[@]} -eq 0 ] && continue
  echo -e "  ${R}✗ KRITIK${N}  $fname"
  for h in "${HITS[@]:0:2}"; do
    ln_num=$(echo "$h" | cut -d: -f1)
    route=$(http_info "$ctrl" "$ln_num")
    echo -e "       ${R}→${N} ${h}  |  $route"
  done
  KRITIK=$((KRITIK+1))
done < <(find "$CTRL" -name "*.controller.ts" ! -name "*.spec.ts" | sort)

[ "$KRITIK" -eq 0 ] && echo -e "  ${G}✓ Tip B KRITIK topilmadi${N}"

# ── §2: XAVFLI — Tip A controller'lar ─────────────────────────────
echo -e "\n${B}§2 XAVFLI — shared/domain/result (Tip A) controller'lar:${N}"
echo -e "   Interceptor isTipA() ${G}HA${N} — ushlab qoladi"
echo "──────────────────────────────────────────────────────"

while IFS= read -r ctrl; do
  fname="$(basename "$ctrl")"; dir="$(dirname "$ctrl")"
  IS_A=0; for d in "${A_DIRS[@]:-x}"; do [ "$d" = "$dir" ] && IS_A=1 && break; done
  [ "$IS_A" -eq 0 ] && continue
  mapfile -t HITS < <(grep -nE "^\s+return this\.[a-zA-Z_]+\.[a-zA-Z_]+\(" "$ctrl" 2>/dev/null \
    | grep -vE "getValue\(|\/\/" || true)
  [ ${#HITS[@]} -eq 0 ] && continue
  echo -e "  ${Y}⚠ XAVFLI${N}  $fname"
  for h in "${HITS[@]:0:1}"; do
    ln_num=$(echo "$h" | cut -d: -f1)
    route=$(http_info "$ctrl" "$ln_num")
    echo -e "       → ${h}  |  $route"
  done
  XAVFLI=$((XAVFLI+1))
done < <(find "$CTRL" -name "*.controller.ts" ! -name "*.spec.ts" | sort)

[ "$XAVFLI" -eq 0 ] && echo -e "  ${G}✓ Tip A XAVFLI topilmadi${N}"

# ── §3: FRONTEND — Array.isArray himoyasiz .filter/.map/.reduce ───
echo -e "\n${B}§3 FRONTEND — Array.isArray himoyasiz .filter/.map/.reduce:${N}"
echo "──────────────────────────────────────────────────────"

while IFS= read -r tsx; do
  fname="$(basename "$tsx")"
  grep -qE "data:\s*\w+\s*=\s*\[\]" "$tsx" 2>/dev/null || continue
  UNSAFE=$(grep -nE "\b\w+\.(filter|map|reduce)\(" "$tsx" 2>/dev/null \
    | grep -vE "Array\.isArray|prev\.(filter|map)|\.filter\(Boolean\)|\/\/" | head -2 || true)
  [ -z "$UNSAFE" ] && continue
  endpoint=$(grep -oE "queryKey.*['\"][/][^'\"]*" "$tsx" 2>/dev/null \
    | head -1 | grep -oE "['\"][/][^'\"]*" | tr -d "'\"" | head -1 || echo "noma'lum")
  echo -e "  ${Y}⚠ FRONTEND${N}  $fname  →  endpoint: $endpoint"
  echo "$UNSAFE" | while IFS= read -r ln; do echo -e "       → $ln"; done
  FRONTEND=$((FRONTEND+1))
done < <(find "$FRONT" -name "*.tsx" ! -name "*.spec.tsx" | sort)

[ "$FRONTEND" -eq 0 ] && echo -e "  ${G}✓ Frontend xavfli pattern topilmadi${N}"

# ── YAKUNIY HISOBOT ────────────────────────────────────────────────
JAMI=$((KRITIK+XAVFLI+FRONTEND))
echo -e "\n${B}╔══════════════════════════════════════════════════════╗"
echo -e "║  TypeError Xavf Audit — Yakuniy Hisobot             ║"
echo -e "╠══════════════════════════════════════════════════════╣${N}"
echo -e "${B}║${N}  ${R}KRITIK${N}  (Tip B, @common/result)    : $KRITIK ta controller"
echo -e "${B}║${N}  ${Y}XAVFLI${N}  (Tip A, shared/domain)     : $XAVFLI ta controller"
echo -e "${B}║${N}  ${Y}FRONTEND${N} xavfli komponent           : $FRONTEND ta fayl"
echo -e "${B}║${N}  JAMI                                : $JAMI ta topildi"
echo -e "${B}╠══════════════════════════════════════════════════════╣${N}"
if [ "$ICEPTOR_OK" -eq 1 ]; then
  echo -e "${B}║${N}  ${G}Interceptor: isTipA+isTipB — har ikki tip qo'llaniladi${N}"
  echo -e "${B}║${N}  Tuzatish: Frontend .map/.filter → Array.isArray qo'shing"
else
  echo -e "${B}║${N}  ${R}TUZATISH: result-unwrap.interceptor.ts ga isTipB() qo'shing!${N}"
fi
echo -e "${B}╚══════════════════════════════════════════════════════╝${N}"

[ "$ICEPTOR_OK" -eq 1 ] && exit 0 || exit 1
