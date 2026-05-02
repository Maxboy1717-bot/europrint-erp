#!/usr/bin/env bash
# ─── EuroPrint Kod Qoidalari Audit ──────────────────────────────────────────
# Ishlash: bash apps/api/audit.sh   YOKI   cd apps/api && bash audit.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/src"
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
ERRORS=0; WARNINGS=0

header() { echo -e "\n${BOLD}═══ $1 ═══${NC}"; }
fail()   { echo -e "  ${RED}✗  $1${NC}"; ((ERRORS++)) || true; }
warn()   { echo -e "  ${YELLOW}⚠  $1${NC}"; ((WARNINGS++)) || true; }
pass()   { echo -e "  ${GREEN}✓  $1${NC}"; }

# ─── 1. Fayl hajmi (maks 300 qator) ─────────────────────────────────────────
header "1. FAYL HAJMI (maks 300 qator)"
BIG=$(find "$SRC" -name "*.ts" ! -name "*.spec.ts" ! -name "*.d.ts" \
  | grep -v "compatibility/\|legacy/" \
  | while read -r f; do
    lines=$(wc -l < "$f")
    [[ $lines -gt 300 ]] && echo "$lines  $f"
  done | sort -rn | head -20)
if [[ -z "$BIG" ]]; then pass "Barcha fayllar 300 qatordan kam"
else while IFS= read -r l; do fail "$l"; done <<< "$BIG"; fi

# ─── 2. Funksiya hajmi (maks 40 qator) ──────────────────────────────────────
header "2. UZUN FUNKSIYALAR (maks 40 qator — taxminiy hisob)"
LONG=$(grep -rn "^\s*async " "$SRC" --include="*.ts" -l \
  | grep -v "compatibility/\|legacy/\|\.d\.ts" | while read -r f; do
    awk '
      /^\s*async [a-zA-Z]/ { fn=NR; name=$0 }
      fn && /^\s*\}$/ {
        len = NR - fn
        if (len > 40) printf "%s:%d: %d qator\n", FILENAME, fn, len
        fn = 0
      }
    ' "$f"
  done | head -15)
if [[ -z "$LONG" ]]; then pass "Aniq 40+ qatorli funksiya topilmadi"
else while IFS= read -r l; do warn "$l"; done <<< "$LONG"; fi

# ─── 3. any tipi (TAQIQLANGAN) ───────────────────────────────────────────────
header "3. 'any' TIPI (TAQIQLANGAN)"
HITS=$(grep -rn ": any\b\|as any\b\| any,\|<any>" "$SRC" --include="*.ts" \
  | grep -v "legacy/\|\.d\.ts" | wc -l)
if [[ "$HITS" -eq 0 ]]; then pass "'any' tipi topilmadi"
else
  fail "Jami $HITS ta 'any' (birinchi 5 ta):"
  grep -rn ": any\b\|as any\b\|<any>" "$SRC" --include="*.ts" \
    | grep -v "legacy/\|\.d\.ts" | head -5 | sed "s|^|      |"
fi

# ─── 4. console.log (TAQIQLANGAN) ────────────────────────────────────────────
header "4. console.log / console.error (TAQIQLANGAN)"
SKIP2="compatibility/\|legacy/\|\.d\.ts\|\.spec\."
CNT=$(grep -rn "console\.\(log\|warn\|error\|info\|debug\)" "$SRC" --include="*.ts" \
  | grep -v "$SKIP2" | wc -l)
if [[ "$CNT" -eq 0 ]]; then pass "console.* yo'q"
else
  fail "$CNT ta console.* topildi:"
  grep -rn "console\.\(log\|warn\|error\|info\)" "$SRC" --include="*.ts" \
    | grep -v "$SKIP2" | head -5 | sed "s|^|      |"
fi

# ─── 5. Controller da if/else (biznes logika) ────────────────────────────────
header "5. CONTROLLER DA if/else (Result.ok bundan mustasno)"
CTRL_IF=$(grep -rn "^\s*if\s*(" "$SRC" --include="*.controller.ts" \
  | grep -v "compatibility/\|legacy/\|\.ok\b\|result\.\|isErr\|Response\|status" | wc -l)
if [[ "$CTRL_IF" -eq 0 ]]; then pass "Controllerlarda biznes if/else yo'q"
else
  warn "$CTRL_IF ta shubhali if/else controller da:"
  grep -rn "^\s*if\s*(" "$SRC" --include="*.controller.ts" \
    | grep -v "compatibility/\|legacy/\|\.ok\b\|result\.\|isErr\|Response\|status" | head -5 | sed "s|^|      |"
fi

# ─── 6. Service da bevosita DB ───────────────────────────────────────────────
header "6. SERVICE DA BEVOSITA db.select/insert (TAQIQLANGAN)"
SVC_DB=$(grep -rn "\bdb\.\(select\|insert\|update\|delete\|execute\)" "$SRC" \
  --include="*.service.ts" | grep -v "compatibility/\|legacy/\|pos-svc\|\.spec\." | wc -l)
if [[ "$SVC_DB" -eq 0 ]]; then pass "Servicelarda bevosita db.* yo'q"
else warn "$SVC_DB ta db.* service fayllarida topildi (repository pattern tavsiya)"; fi

# ─── 7. Controller try/catch (TAQIQLANGAN) ───────────────────────────────────
# @Cron va @OnEvent metodlari ichida try/catch qabul qilinadi
header "7. try/catch — Controller (Cron/@OnEvent bundan mustasno)"
CTL_TRY=0
while IFS= read -r ctrl; do
  [[ -z "$ctrl" ]] && continue
  # Remove Cron/OnEvent-annotated methods, then count remaining try{
  stripped=$(perl -0777 -pe '
    # Remove @Cron/@OnEvent method blocks (annotation + method until next @annotation or end)
    s/@(Cron|OnEvent)[^\n]*\n(.*?)(?=\n\s*@[A-Z]|\z)//gs
  ' "$ctrl" 2>/dev/null)
  cnt=$(echo "$stripped" | grep -cE "^\s*try\s*\{" 2>/dev/null); cnt=${cnt:-0}
  if [[ "$cnt" -gt 0 ]]; then
    fail "$(basename "$ctrl") — $cnt ta try/catch (Cron/Event da emas, TAQIQLANGAN)"
    CTL_TRY=$((CTL_TRY+1))
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)
[[ "$CTL_TRY" -eq 0 ]] && pass "Controller ichida try/catch yo'q (Cron/Event mustasno) ✅"
# ─── 7b. Fake {ok: true} / {success: true} (TAQIQLANGAN) ─────────────────────
header "7b. Fake ok:true / success:true — Controller"
FAKE_OK=0
while IFS= read -r ctrl; do
  [[ -z "$ctrl" ]] && continue
  # Check single-line and multiline patterns
  if grep -qPzo "return\s*\{[^}]*\bok\s*:\s*true\b" "$ctrl" 2>/dev/null || \
     grep -qPzo "return\s*\{[^}]*\bsuccess\s*:\s*true\b" "$ctrl" 2>/dev/null; then
    fail "$(basename "$ctrl") — fake {ok:true} yoki {success:true} (TAQIQLANGAN)"
    FAKE_OK=$((FAKE_OK+1))
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)
[[ "$FAKE_OK" -eq 0 ]] && pass "Controller da fake ok:true yo'q ✅"

# ─── 7c. catch + return[] / return null / return {} (CONTROLLER — TAQIQLANGAN) ──
header "7c. catch+return[]/null/{} — Controller (xato yashirish taqiqlangan)"
CATCH_RETURN=0
while IFS= read -r ctrl; do
  [[ -z "$ctrl" ]] && continue
  # Look for catch block followed by return [] / return null / return {} / return false within 3 lines
  if grep -qPzo "catch\s*(\([^)]*\))?\s*\{[^}]*\breturn\s+(null|undefined|\[\]|\{\}|false|0|''|\"\")" "$ctrl" 2>/dev/null; then
    fail "$(basename "$ctrl") — catch{return[]/null/{}} (xato yashirilmoqda!)"
    CATCH_RETURN=$((CATCH_RETURN+1))
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)
[[ "$CATCH_RETURN" -eq 0 ]] && pass "Controller da catch+return[] yo'q ✅"

# ─── 8. Non-null assertion (!) ───────────────────────────────────────────────
header "8. NON-NULL ASSERTION (!) (TAQIQLANGAN)"
NN=$(grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;) ]" "$SRC" --include="*.ts" \
  | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s|'[^']*!|\"[^\"]*!|\`[^\`]*!" | wc -l)
if [[ "$NN" -eq 0 ]]; then pass "Non-null assertion yo'q"
else
  fail "$NN ta non-null assertion (!) topildi (TAQIQLANGAN):"
  grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;) ]" "$SRC" --include="*.ts" \
    | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s|'[^']*!|\"[^\"]*!|\`[^\`]*!" | head -5 | sed "s|^|      |"
fi

# ─── 8b. as unknown as (TYPE-SAFETY BYPASS) ────────────────────────────────
header "8b. 'as unknown as' (TYPE-SAFETY BYPASS — Faza 7 da kamaytirish kerak)"
UNK_CNT=$(grep -rn " as unknown as " "$SRC" --include="*.ts" | grep -v "legacy/\|\.d\.ts" | wc -l)
if [[ "$UNK_CNT" -eq 0 ]]; then pass "'as unknown as' yo'q"
elif [[ "$UNK_CNT" -le 50 ]]; then warn "$UNK_CNT ta 'as unknown as' (maqsad: 0, Drizzle/legacy chegaralarida)"
else warn "$UNK_CNT ta 'as unknown as' — Faza 7 da barcha chegaralar uchun to'g'ri tiplar bilan almashtirilsin"; fi

# ─── 9a. @ts-ignore (TAQIQLANGAN — Faza 6 dan keyin) ───────────────────────
header "9a. @ts-ignore (TAQIQLANGAN)"
IGN_CNT=$(grep -rn "@ts-ignore" "$SRC" --include="*.ts" | grep -v "legacy/\|\.d\.ts" | wc -l | tr -d ' ')
if [[ "$IGN_CNT" -eq 0 ]]; then pass "@ts-ignore yo'q (non-legacy fayllarda)"
else
  fail "$IGN_CNT ta @ts-ignore topildi (TAQIQLANGAN):"
  grep -rn "@ts-ignore" "$SRC" --include="*.ts" | grep -v "legacy/\|\.d\.ts" | head -3 | sed "s|^|      |"
fi

# ─── 9b. @Roles/@Public/@RequirePermission (barcha controllerda majburiy) ────
header "9b. Access control (*.controller.ts — faqat legacy/ bundan mustasno)"
CTRL_NO_ROLES=0
while IFS= read -r f; do
  if ! grep -qE "@Roles|@Public|@RequirePermission" "$f" 2>/dev/null; then
    fail "$(basename "$f") — @Roles/@Public/@RequirePermission yo'q: ${f#$SRC/}"
    CTRL_NO_ROLES=$((CTRL_NO_ROLES+1))
  fi
done < <(find "$SRC" -name "*.controller.ts" | grep -v "legacy/\|\.spec\.\|\.d\.ts" | sort)
[[ "$CTRL_NO_ROLES" -eq 0 ]] && pass "Barcha controllerlar access control ga ega (@Roles/@Public/@RequirePermission)"

# ─── 9. @ts-nocheck ──────────────────────────────────────────────────────────
header "9. @ts-nocheck (faqat 11 legacy fayl ruxsat)"
NOCHECK=$(grep -rln "@ts-nocheck" "$SRC" --include="*.ts")
ILLEGAL=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if echo "$f" | grep -qv "legacy/"; then
    fail "Ruxsatsiz @ts-nocheck: $f"; ((ILLEGAL++)) || true
  fi
done <<< "$NOCHECK"
[[ "$ILLEGAL" -eq 0 ]] && pass "@ts-nocheck faqat ruxsat berilgan fayllarda"

# ─── 10. TypeScript typecheck ─────────────────────────────────────────────────
header "10. TypeScript TYPECHECK"
TS_ERRORS=$(pnpm --dir "$SCRIPT_DIR" typecheck 2>&1 | grep -c "error TS" || true)
if [[ "$TS_ERRORS" -eq 0 ]]; then pass "0 TypeScript xato"
else fail "$TS_ERRORS ta TypeScript xato"; ((ERRORS++)) || true; fi

# ─── 11. compatibility/ va remaining/ — Har bir controller uchun service bor ─
header "11. compatibility/ va remaining/ — Controller/Service juftligi"
MISSING_SVC=0
for DIR in "$SRC/modules/compatibility" "$SRC/modules/remaining"; do
  [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    base=$(basename "$ctrl" .controller.ts)
    svc="$DIR/${base}.service.ts"
    if [[ ! -f "$svc" ]]; then
      fail "Service yo'q: $(basename "$DIR")/${base}.service.ts"
      MISSING_SVC=$((MISSING_SVC+1))
    fi
  done < <(find "$DIR" -maxdepth 1 -name "*.controller.ts" | sort)
done
[[ "$MISSING_SVC" -eq 0 ]] && pass "Barcha compatibility/remaining controllerlari uchun service mavjud"

# ─── 12. compatibility/ va remaining/ — Controller ichida SQL yo'q ────────────
header "12. compatibility/ va remaining/ — Controller ichida db.execute yo'q"
SQL_IN_CTRL=0
for DIR in "$SRC/modules/compatibility" "$SRC/modules/remaining"; do
  [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    cnt=$(grep -c "db\.execute\|db\.query\|db\.select\|db\.insert\|db\.update\|db\.delete" "$ctrl" 2>/dev/null); cnt=${cnt:-0}
    if [[ "$cnt" -gt 0 ]]; then
      fail "$(basename "$ctrl") — $cnt ta SQL chaqiruvi controller ichida"
      SQL_IN_CTRL=$((SQL_IN_CTRL+1))
    fi
  done < <(find "$DIR" -maxdepth 1 -name "*.controller.ts" | sort)
done
[[ "$SQL_IN_CTRL" -eq 0 ]] && pass "Barcha compatibility/remaining controllerlari SQL-free"

# ─── 13. compatibility/ va remaining/ — Servisda yashirin muvaffaqiyatsizlik yo'q ───
header "13. compatibility/ va remaining/ — return null / return { error: tekshiruvi"
HIDDEN_FAIL=0
for DIR in "$SRC/modules/compatibility" "$SRC/modules/remaining"; do
  [[ -d "$DIR" ]] || continue
  while IFS= read -r svc; do
    cnt=$(grep -cE "return (null|undefined|\{ error:)" "$svc" 2>/dev/null); cnt=${cnt:-0}
    if [[ "$cnt" -gt 0 ]]; then
      warn "$(basename "$svc") — $cnt ta yashirin muvaffaqiyatsizlik (return null/error obj)"
      HIDDEN_FAIL=$((HIDDEN_FAIL+1))
    fi
  done < <(find "$DIR" -maxdepth 1 -name "*.service.ts" | sort)
done
[[ "$HIDDEN_FAIL" -eq 0 ]] && pass "Servislar to'g'ri exception tashlaydi (null/error return yo'q)"

# ─── 14. ASOSIY MODULLAR — Controller ichida SQL yo'q (Faza 4+5) ─────────────
header "14. Asosiy modullar — Controller ichida db.execute yo'q"
MAIN_MODS="crm director hr finance pos iot mes wms mm qc sd lms core security mro logistics"
SQL_IN_MAIN=0
for MOD in $MAIN_MODS; do
  DIR="$SRC/modules/$MOD"
  [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    [[ -z "$ctrl" ]] && continue
    cnt=$(grep -cE "\bdb\.(execute|select|insert|update|delete|query)\(" "$ctrl" 2>/dev/null); cnt=${cnt:-0}
    if [[ "$cnt" -gt 0 ]]; then
      fail "[$MOD] $(basename "$ctrl") — $cnt ta SQL chaqiruvi controller ichida"
      SQL_IN_MAIN=$((SQL_IN_MAIN+1))
    fi
  done < <(find "$DIR" -name "*.controller.ts" | grep -v "\.spec\." | sort)
done
[[ "$SQL_IN_MAIN" -eq 0 ]] && pass "Barcha asosiy modul controllerlari SQL-free"

# ─── 15. §6 AuditInterceptor (write endpointlarda majburiy) ─────────────────
header "15. §6 AuditInterceptor (write metodlari bor controllerlarda majburiy)"
MISSING_AUDIT=0
while IFS= read -r ctrl; do
  has_write=$(grep -qE "@Post\b|@Put\b|@Patch\b|@Delete\b" "$ctrl" 2>/dev/null && echo yes || echo no)
  [ "$has_write" = "no" ] && continue
  if ! grep -q "AuditInterceptor" "$ctrl" 2>/dev/null; then
    fail "AuditInterceptor yo'q: ${ctrl#$SRC/}"
    MISSING_AUDIT=$((MISSING_AUDIT+1))
  fi
done < <(find "$SRC/modules" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/" | sort)
[ "$MISSING_AUDIT" -eq 0 ] && pass "Barcha write controllerlarda AuditInterceptor bor ✓"

# ─── YAKUNIY HISOBOT ─────────────────────────────────────────────────────────
echo -e "\n${BOLD}══════════════════════════════════════════${NC}"
[[ "$ERRORS" -gt 0 ]]   && echo -e "  ${RED}✗  $ERRORS ta XATO${NC}"       || echo -e "  ${GREEN}✓  Xatolar yo'q${NC}"
[[ "$WARNINGS" -gt 0 ]] && echo -e "  ${YELLOW}⚠  $WARNINGS ta ogohlantirish${NC}" || echo -e "  ${GREEN}✓  Ogohlantirishlar yo'q${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"
[[ "$ERRORS" -gt 0 ]] && exit 1 || exit 0
