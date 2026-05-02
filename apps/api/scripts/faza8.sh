#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  FAZA 8 — Result<T,E> Pattern + try/catch arxitekturasi
#  Ishlatish: bash apps/api/scripts/faza8.sh
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
echo -e "${BOLD}  🟢 FAZA 8 — Result<T,E> Pattern${NC}"
echo ""

# ── 1. Controller ichida try/catch ────────────────────────────
# @Cron va @OnEvent metodlari ichida try/catch qabul qilinadi
hdr "Controller ichida try/catch (NOTO'G'RI — Cron/@OnEvent bundan mustasno)"
TC_COUNT=0
while IFS= read -r ctrl; do
  [[ -z "$ctrl" ]] && continue
  # Strip @Cron/@OnEvent annotated method blocks, then check for remaining try{
  stripped=$(perl -0777 -pe '
    s/@(Cron|OnEvent)[^\n]*\n(.*?)(?=\n\s*@[A-Z]|\z)//gs
  ' "$ctrl" 2>/dev/null)
  cnt=$(echo "$stripped" | grep -cE "try\s*\{" 2>/dev/null); cnt=${cnt:-0}
  if [[ "$cnt" -gt 0 ]]; then
    fail "${ctrl#$SRC/} — $cnt× try/catch (Cron/Event bundan mustasno)"
    TC_COUNT=$((TC_COUNT+1))
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)
if [ "$TC_COUNT" -eq 0 ]; then
  ok "Controller ichida try/catch yo'q ✅"
fi

# ── 2. Service ichida arxitektura (Variant A yoki Result<T,E>) ──
hdr "Service arxitektura (Variant A: NestJS exception | Variant B: Result<T,E>)"
ALL_SVC=$(find "$SRC" -name "*.service.ts" | grep -v "\.spec\." | wc -l | tr -d ' ')
WITH_RESULT=$(grep -rl "ok: true\|ok: false\|Result<" "$SRC" \
  --include="*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
WITH_THROW=$(grep -rl "throw new\|NotFoundException\|BadRequestException\|InternalServerErrorException" "$SRC" \
  --include="*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
VARIANT_A_OR_B=$((WITH_RESULT > WITH_THROW ? WITH_RESULT : WITH_THROW))
info "Barcha service: $ALL_SVC"
info "Result<T,E> (Variant B) ishlatadi: $WITH_RESULT ta"
info "NestJS exception (Variant A) ishlatadi: $WITH_THROW ta"
ok "Variant A (throw NestJS exception) ham qabul qilinadi — ARCHITECTURE.md §5 ✅"

# ── 3. Controller catch ichida return [] yoki {} (xatolar yashirinadi) ─────
hdr "Controller catch ichida return [] yoki null (xatolar yashirinadi)"
# Context-aware check: look for } catch followed by return [] within 3 lines (controllers only)
HIDE_ERR=$(grep -rn "} catch" "$SRC" --include="*.controller.ts" 2>/dev/null | \
  grep -v "\.spec\." | \
  while IFS=: read -r file lineno _rest; do
    end=$((lineno + 3))
    if sed -n "${lineno},${end}p" "$file" 2>/dev/null | grep -qE "return \[\]|return null\b|return \{\}"; then
      echo "$file"
    fi
  done | sort -u)
HE_COUNT=$(echo "$HIDE_ERR" | grep "\.ts" | wc -l | tr -d ' ')
if [ "$HE_COUNT" -eq 0 ]; then
  ok "Controller catch ichida yashirin xato yo'q ✅"
else
  fail "$HE_COUNT ta controller da catch xatoni yashiradi:"
  echo "$HIDE_ERR" | grep "\.ts" | while IFS= read -r f; do
    echo "       ${f#$SRC/}"
  done
fi

# ── 4. Fake ok:true / success:true pattern ─────────────────────
hdr "Fake {ok: true} / {success: true} pattern"
FAKE_OK=$(grep -rl "return.*{.*ok.*:.*true\|return.*{.*success.*:.*true" "$SRC" \
  --include="*.controller.ts" 2>/dev/null | grep -v "\.spec\." | sort)
FO_COUNT=$(echo "$FAKE_OK" | grep "\.ts" | wc -l | tr -d ' ')
if [ "$FO_COUNT" -eq 0 ]; then
  ok "Controller da fake ok:true pattern yo'q ✅"
else
  fail "$FO_COUNT ta controller da fake ok:true:"
  echo "$FAKE_OK" | grep "\.ts" | while IFS= read -r f; do
    echo "       ${f#$SRC/}"
  done
fi

# ── 5. Arxitektura namunasi ─────────────────────────────────────
hdr "To'g'ri arxitektura namunasi"
echo ""
echo "  ❌ NOTO'G'RI (controller):"
echo "  ┌──────────────────────────────────────────────"
echo "  │ async getItems() {"
echo "  │   try { return await svc.getAll() }"
echo "  │   catch { return []  ← xato yashirinadi! }"
echo "  │ }"
echo "  └──────────────────────────────────────────────"
echo ""
echo "  ✅ TO'G'RI — Variant A (NestJS exception):"
echo "  ┌──────────────────────────────────────────────"
echo "  │ async getItems() {"
echo "  │   return this.svc.getAll()  ← xato NestJS ga o'tadi"
echo "  │ }"
echo "  └──────────────────────────────────────────────"
echo ""
echo "  ✅ TO'G'RI — Variant B (Result<T,E>):"
echo "  ┌──────────────────────────────────────────────"
echo "  │ async getItems() {"
echo "  │   const r = await this.svc.getAll()"
echo "  │   if (!r.ok) throw new InternalServerErrorException(r.error.message)"
echo "  │   return r.data"
echo "  │ }"
echo "  └──────────────────────────────────────────────"
echo ""

# ── NATIJA ──────────────────────────────────────────────────────
hdr "NATIJA"
if [ "$TC_COUNT" -eq 0 ] && [ "$HE_COUNT" -eq 0 ] && [ "$FO_COUNT" -eq 0 ]; then
  echo -e "  ${GRN}${BOLD}✅ FAZA 8 YAKUNLANDI — TO'LIQ REFAKTORING TUGADI!${NC}"
  echo ""
  echo -e "  ${GRN}${BOLD}🎉 EUROPRINT ERP arxitektura 100% ARCHITECTURE.md ga mos!${NC}"
else
  REMAIN=$((TC_COUNT + HE_COUNT + FO_COUNT))
  fail "$REMAIN ta muammo qoldi — AI agent bilan birma-bir hal qiling"
  info "Boshlash uchun: bash $(dirname "$0")/progress.sh"
fi
echo ""
