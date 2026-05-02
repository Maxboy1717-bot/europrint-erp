#!/usr/bin/env bash
# EUROPRINT ERP — MASTER AUDIT SKRIPT
# Barcha tekshiruvlar: FAZA 1-8 + Kod sifati + Array xavfsizlik
# bash scripts/src/master-audit.sh
# pnpm audit:master

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'
C='\033[0;36m'; B='\033[1m'; D='\033[2m'; N='\033[0m'

pass() { printf "  ${G}✔${N}  %s\n" "$*"; }
fail() { printf "  ${R}✘${N}  %s\n" "$*"; ERRORS=$((ERRORS+1)); }
warn() { printf "  ${Y}⚠${N}  %s\n" "$*"; WARNINGS=$((WARNINGS+1)); }
inf()  { printf "  ${C}→${N}  %s\n" "$*"; }
hdr()  { printf "\n${B}══ %s${N}\n${D}%s${N}\n" "$*" "────────    ────────────────────────────────"; }
blk()  {
  printf "\n${B}╔══════════════════════════════════════════════════╗\n"
  printf "║  %-49s║\n" "$*"
  printf "╚══════════════════════════════════════════════════╝${N}\n"
}

SRC="apps/api/src"
MOD="$SRC/modules"
DASH="artifacts/erp-dashboard/src"
SITE="artifacts/europrint-site/src"
ALL_SRC=("$SRC" "$DASH" "$SITE")
MAIN_MODS="crm director hr finance pos iot mes wms mm qc sd lms core security mro logistics ai"

ERRORS=0; WARNINGS=0
FAZA1_OK=true; FAZA23_OK=true; FAZA45_OK=true
FAZA6_OK=true; FAZA7_OK=true; FAZA8_OK=true

printf "\n${B}╔══════════════════════════════════════════════════╗\n"
printf "║     EUROPRINT ERP — MASTER AUDIT SKRIPT          ║\n"
printf "║  FAZA 1-8  ·  KOD SIFATI  ·  ARRAY XAVFSIZLIK   ║\n"
printf "║  %-47s║\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf "╚══════════════════════════════════════════════════╝${N}\n"

# ════════════════════════════════════════════════════
blk "BLOK A — FAZA 1: Fayl hajmi · @Roles · Boilerplate"
# ════════════════════════════════════════════════════

hdr "A1 — Fayl hajmi (max 300 qator)"
BIG_COUNT=0
while IFS= read -r f; do
  lines=$(wc -l < "$f")
  if [[ $lines -gt 300 ]]; then
    fail "$lines qator: ${f#$SRC/}"
    BIG_COUNT=$((BIG_COUNT+1)); FAZA1_OK=false
  fi
done < <(find "$SRC" -name "*.ts" ! -name "*.spec.ts" ! -name "*.d.ts" \
  | grep -v "compatibility/\|legacy/" | sort)
[[ $BIG_COUNT -eq 0 ]] && pass "300+ qatorli fayl yo'q"

hdr "A2 — @Roles/@Public barcha controllerlarda"
NO_ROLES=0
while IFS= read -r ctrl; do
  if ! grep -qE "@Roles\b|@Public\b|@RequirePermission\b" "$ctrl" 2>/dev/null; then
    fail "@Roles yo'q: ${ctrl#$SRC/}"; NO_ROLES=$((NO_ROLES+1)); FAZA1_OK=false
  fi
done < <(find "$MOD" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/\|compatibility/" | sort)
[[ $NO_ROLES -eq 0 ]] && pass "Barcha controllerlarda @Roles bor"

hdr "A3 — console.log / @ts-ignore"
BOILER=$(grep -rEc "console\.(log|warn|error|info|debug)" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|compatibility/\|\.spec\." | awk -F: '{s+=$2} END{print s+0}')
TS_IGN=$(grep -rEc "@ts-ignore" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/" | awk -F: '{s+=$2} END{print s+0}')
[[ $BOILER -eq 0 ]] && pass "console.*: 0" || { fail "console.*: $BOILER ta"; FAZA1_OK=false; }
[[ $TS_IGN -eq 0 ]] && pass "@ts-ignore: 0" || { fail "@ts-ignore: $TS_IGN ta"; FAZA1_OK=false; }

# ════════════════════════════════════════════════════
blk "BLOK B — FAZA 2+3: Controller/Service juftligi"
# ════════════════════════════════════════════════════

hdr "B1 — compatibility/ va remaining/ Controller↔Service"
TOTAL_CTRL=0; READY_CTRL=0
for DIR in "$MOD/compatibility" "$MOD/remaining"; do
  [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    TOTAL_CTRL=$((TOTAL_CTRL+1))
    base=$(basename "$ctrl" .controller.ts)
    if [[ -f "$DIR/${base}.service.ts" ]]; then
      READY_CTRL=$((READY_CTRL+1))
    else
      fail "Service yo'q: $(basename "$DIR")/${base}.service.ts"; FAZA23_OK=false
    fi
  done < <(find "$DIR" -maxdepth 1 -name "*.controller.ts" | sort)
done
inf "Holat: $READY_CTRL / $TOTAL_CTRL tayyor"
[[ $READY_CTRL -eq $TOTAL_CTRL ]] && pass "Barcha Controller↔Service juftliklari to'liq"

hdr "B2 — AuditInterceptor (write endpointlarda)"
MISSING_AUDIT=0
while IFS= read -r ctrl; do
  grep -qE "@Post\b|@Put\b|@Patch\b|@Delete\b" "$ctrl" 2>/dev/null || continue
  if ! grep -q "AuditInterceptor" "$ctrl" 2>/dev/null; then
    warn "AuditInterceptor yo'q: ${ctrl#$SRC/}"; MISSING_AUDIT=$((MISSING_AUDIT+1))
  fi
done < <(find "$MOD" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/" | sort)
[[ $MISSING_AUDIT -eq 0 ]] && pass "Barcha write controllerlarda AuditInterceptor bor" \
  || { fail "$MISSING_AUDIT ta write controller AuditInterceptor'siz"; FAZA23_OK=false; }

# ════════════════════════════════════════════════════
blk "BLOK C — FAZA 4+5: Controller ichida SQL yo'q"
# ════════════════════════════════════════════════════

hdr "C1 — Asosiy modul controllerlari SQL-free"
SQL_TOTAL=0
for MOD_NAME in $MAIN_MODS; do
  DIR="$MOD/$MOD_NAME"; [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    cnt=$(grep -cE "\bdb\.(execute|select|insert|update|delete|query)\(" "$ctrl" 2>/dev/null || true)
    if [[ ${cnt:-0} -gt 0 ]]; then
      fail "[$MOD_NAME] $(basename "$ctrl") — $cnt ta SQL"; SQL_TOTAL=$((SQL_TOTAL+1)); FAZA45_OK=false
    fi
  done < <(find "$DIR" -name "*.controller.ts" | grep -v "\.spec\." | sort)
done
[[ $SQL_TOTAL -eq 0 ]] && pass "Barcha asosiy modul controllerlari SQL-free" \
  || warn "Jami $SQL_TOTAL ta controller SQL bilan"

hdr "C2 — compatibility/ controllerlari SQL-free"
COMPAT_SQL=0
for DIR in "$MOD/compatibility" "$MOD/remaining"; do
  [[ -d "$DIR" ]] || continue
  while IFS= read -r ctrl; do
    cnt=$(grep -cE "db\.(execute|select|insert|update|delete|query)" "$ctrl" 2>/dev/null || true)
    [[ ${cnt:-0} -gt 0 ]] && { fail "$(basename "$ctrl") — $cnt ta SQL"; COMPAT_SQL=$((COMPAT_SQL+1)); }
  done < <(find "$DIR" -maxdepth 1 -name "*.controller.ts" | sort)
done
[[ $COMPAT_SQL -eq 0 ]] && pass "compatibility/ controllerlari SQL-free"

# ════════════════════════════════════════════════════
blk "BLOK D — FAZA 6: 'any' tipi va TypeScript"
# ════════════════════════════════════════════════════

hdr "D1 — Backend 'any' tipi"
BE_ANY=$(grep -rEc ": any\b|as any\b| any,|<any>" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.d\.ts\|\.spec\." | awk -F: '{s+=$2} END{print s+0}')
[[ $BE_ANY -eq 0 ]] && pass "Backend 'any': 0" \
  || { fail "Backend 'any': $BE_ANY ta"; FAZA6_OK=false
       grep -rEn ": any\b|as any\b|<any>" "$SRC" --include="*.ts" 2>/dev/null \
         | grep -v "legacy/\|\.d\.ts" | head -3 | while read -r l; do printf "    ${D}%s${N}\n" "$l"; done; }

hdr "D2 — Frontend 'any' tipi"
for FE_SRC in "$DASH" "$SITE"; do
  FE_ANY=$(grep -rEc ": any\b|as any\b|<any>" "$FE_SRC" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
  [[ $FE_ANY -eq 0 ]] && pass "$FE_SRC: 'any' 0" \
    || { fail "$FE_SRC: $FE_ANY ta 'any'"; FAZA6_OK=false; }
done

hdr "D3 — TypeScript xatolari (apps/api)"
TS_ERR=$(cd apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
[[ $TS_ERR -eq 0 ]] && pass "TypeScript: 0 xato" \
  || { fail "TypeScript: $TS_ERR ta xato"; FAZA6_OK=false; }

# ════════════════════════════════════════════════════
blk "BLOK E — FAZA 7: Type-safety"
# ════════════════════════════════════════════════════

hdr "E1 — 'as unknown as'"
AS_UNK=$(grep -rEc "as unknown as" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/" | awk -F: '{s+=$2} END{print s+0}')
[[ $AS_UNK -eq 0 ]] && pass "'as unknown as': 0" \
  || warn "'as unknown as': $AS_UNK ta"

hdr "E2 — Result<unknown> (aniq tip kerak)"
RES_UNK=$(grep -rEn "Result<unknown" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.d\.ts" | wc -l | tr -d ' ')
[[ $RES_UNK -eq 0 ]] && pass "Result<unknown>: 0" \
  || warn "Result<unknown>: $RES_UNK ta (aniq tip ishlatilsin)"

hdr "E3 — @ts-nocheck (faqat legacy)"
ILLEGAL_NOCHECK=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  echo "$f" | grep -qv "legacy/" && { fail "Ruxsatsiz @ts-nocheck: $f"; ILLEGAL_NOCHECK=$((ILLEGAL_NOCHECK+1)); FAZA7_OK=false; }
done < <(grep -rln "@ts-nocheck" "$SRC" --include="*.ts" 2>/dev/null)
[[ $ILLEGAL_NOCHECK -eq 0 ]] && pass "@ts-nocheck faqat legacy fayllarda"

hdr "E4 — Non-null assertion (!)"
NN=$(grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;) ]" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s" | grep -c "." || true)
[[ $NN -eq 0 ]] && pass "Non-null (!): 0" || warn "Non-null (!): $NN ta"

# ════════════════════════════════════════════════════
blk "BLOK F — FAZA 8: Result pattern · try/catch · Fake"
# ════════════════════════════════════════════════════

hdr "F1 — Result pattern qamrovi"
SVC_TOTAL=$(find "$MOD" -name "*.service.ts" | grep -v "\.spec\.\|legacy/" | wc -l | tr -d ' ')
SVC_WITH=$(grep -rlE "Result<|okOk|okErr" "$MOD" --include="*.service.ts" 2>/dev/null \
  | grep -v "legacy/" | wc -l | tr -d ' ')
inf "Service qamrovi: $SVC_WITH / $SVC_TOTAL"
[[ $SVC_WITH -ge $SVC_TOTAL ]] && pass "Barcha servicelarda Result pattern" \
  || warn "$((SVC_TOTAL - SVC_WITH)) ta service Result pattern'siz"

hdr "F2 — Controller ichida try/catch yo'q"
CTL_TRY=0
while IFS= read -r ctrl; do
  cnt=$(grep -cE "^\s*try\s*\{" "$ctrl" 2>/dev/null || true)
  [[ ${cnt:-0} -gt 0 ]] && { fail "$(basename "$ctrl") — $cnt ta try/catch"; CTL_TRY=$((CTL_TRY+1)); FAZA8_OK=false; }
done < <(find "$MOD" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/" | sort)
[[ $CTL_TRY -eq 0 ]] && pass "Controller ichida try/catch yo'q"

hdr "F3 — Fake {ok:true} / {success:true}"
FAKE=0
while IFS= read -r ctrl; do
  grep -qE "return\s*\{[^}]*\bok\s*:\s*true|return\s*\{[^}]*\bsuccess\s*:\s*true" \
    "$ctrl" 2>/dev/null && { fail "Fake response: ${ctrl#$SRC/}"; FAKE=$((FAKE+1)); FAZA8_OK=false; }
done < <(find "$MOD" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/" | sort)
[[ $FAKE -eq 0 ]] && pass "Fake {ok:true} yo'q"

hdr "F4 — Service da return null/[] (xato yashirish)"
HIDDEN=0
while IFS= read -r svc; do
  cnt=$(grep -cE "return (null|undefined|\[\]|\{\});" "$svc" 2>/dev/null || true)
  [[ ${cnt:-0} -gt 0 ]] && { warn "$(basename "$svc") — $cnt ta return null/[]"; HIDDEN=$((HIDDEN+1)); }
done < <(find "$MOD" -name "*.service.ts" | grep -v "\.spec\.\|legacy/" | sort)
[[ $HIDDEN -eq 0 ]] && pass "return null/[] yo'q"

# ════════════════════════════════════════════════════
blk "BLOK G — KOD SIFATI: Frontend tekshiruvlar"
# ════════════════════════════════════════════════════

hdr "G1 — dangerouslySetInnerHTML (XSS xavfi)"
DANGEROUS=$(grep -rEn "dangerouslySetInnerHTML" "$DASH" "$SITE" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "sanitize\|DOMPurify\|//" | wc -l | tr -d ' ')
if [[ $DANGEROUS -eq 0 ]]; then pass "dangerouslySetInnerHTML: 0 ta himoyasiz"
else
  fail "dangerouslySetInnerHTML: $DANGEROUS ta (DOMPurify ishlatilsin!)"
  grep -rEn "dangerouslySetInnerHTML" "$DASH" "$SITE" \
    --include="*.tsx" 2>/dev/null | grep -v "sanitize\|DOMPurify\|//" | head -5 \
    | while read -r l; do printf "    ${R}%s${N}\n" "$l"; done
fi

hdr "G2 — key={index} (render muammosi)"
KEY_IDX=$(grep -rEn "key=\{[a-zA-Z]*[Ii]ndex\}|key=\{i\}" "$DASH" "$SITE" \
  --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
[[ $KEY_IDX -eq 0 ]] && pass "key={index}: 0" \
  || warn "key={index}: $KEY_IDX ta (unikal ID ishlatilsin)"

hdr "G3 — localStorage xavfsizlik"
LS_UNSAFE=$(grep -rEn "localStorage\.(getItem|setItem)" "$DASH" "$SITE" \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "try\|catch\|JSON\.parse.*try\|//" | wc -l | tr -d ' ')
[[ $LS_UNSAFE -eq 0 ]] && pass "localStorage: 0 ta himoyasiz" \
  || warn "localStorage: $LS_UNSAFE ta try/catch'siz ishlatish"

hdr "G4 — process.env to'g'ridan ishlatish (frontend)"
PROC_ENV=$(grep -rEn "process\.env\." "$DASH" "$SITE" \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "import\.meta\.env\|//" | wc -l | tr -d ' ')
[[ $PROC_ENV -eq 0 ]] && pass "process.env: 0 ta (import.meta.env to'g'ri)" \
  || warn "process.env: $PROC_ENV ta (import.meta.env ishlatilsin)"

hdr "G5 — Promise.all catch yo'q (Frontend)"
# Faqat frontend fayllar tekshiriladi; backend Promise.all safeCall/try bloki ichida
PROM_ALL=$(grep -rEn "Promise\.all\(" "$DASH" "$SITE" \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "\.catch\|try\|//" | wc -l | tr -d ' ')
[[ $PROM_ALL -eq 0 ]] && pass "Promise.all: 0 ta catch'siz (frontend)" \
  || warn "Promise.all: $PROM_ALL ta catch yo'q (frontend)"

hdr "G6 — eval() ishlatish (TAQIQLANGAN)"
EVAL_CNT=$(grep -rEn "\beval\s*\(" "$SRC" "$DASH" "$SITE" \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "//\|evaluat" | wc -l | tr -d ' ')
[[ $EVAL_CNT -eq 0 ]] && pass "eval(): 0" || fail "eval(): $EVAL_CNT ta (TAQIQLANGAN!)"

hdr "G7 — Hardcoded secret / password (backend)"
SECRET_CNT=$(grep -rEin \
  "password\s*=\s*['\"][^'\"]{4,}['\"]|secret\s*=\s*['\"][^'\"]{4,}['\"]|api_key\s*=\s*['\"][^'\"]{4,}['\"]" \
  "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "process\.env\|\.env\|legacy/\|\.spec\.\|placeholder\|example\|your_\|<" | wc -l | tr -d ' ')
[[ $SECRET_CNT -eq 0 ]] && pass "Hardcoded secret: 0" \
  || fail "Hardcoded secret: $SECRET_CNT ta (process.env ishlatilsin!)"

hdr "G8 — Backend hardcoded config (JWT secret, port)"
HCF=$(grep -rEn \
  "jwt.*secret.*['\"][a-zA-Z0-9]{8,}['\"]|port\s*[=:]\s*(3000|8080|4000)\b" \
  "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "process\.env\|legacy/\|\.spec\.\|//" | wc -l | tr -d ' ')
[[ $HCF -eq 0 ]] && pass "Hardcoded config: 0" \
  || warn "Hardcoded config: $HCF ta (process.env ishlatilsin)"

# ════════════════════════════════════════════════════
blk "BLOK H — ARRAY XAVFSIZLIK (10 metod)"
# ════════════════════════════════════════════════════

count_unsafe() {
  local src="$1" method="$2"
  grep -rEn "[^?.[:space:]]\.$method\(" "$src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -vE "\?\.$method\(|Array\.isArray|//.*\.$method|\?\? \[\]\)\.$method\(|\?\? \{\}\)\.$method\(|\?\? \[\] as [^)]+\)\.$method\(|Object\.(values|keys|entries)\(|this\.[a-z][a-zA-Z0-9_]*\.$method\(|\s[A-Z][A-Z_]{2,}\.$method\(|[.)(][A-Z][A-Z_]{2,}\.$method\(|\.split\([^)]*\)\.$method\(|\.slice\([^)]*\)\.$method\(|\.filter\([^)]*\)\.$method\(|\.sort\([^)]*\)\.$method\(|\.concat\([^)]*\)\.$method\(|as [A-Za-z<>, ]+\[\]\)\.$method\(|\]\)\.$method\(|\)\.$method\(" \
    | grep -c "." || true
}

top_files_unsafe() {
  local src="$1" method="$2"
  grep -rEn "[^?.[:space:]]\.$method\(" "$src" \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -vE "\?\.$method\(|Array\.isArray|//.*\.$method|\?\? \[\]\)\.$method\(|\?\? \{\}\)\.$method\(|\?\? \[\] as [^)]+\)\.$method\(|Object\.(values|keys|entries)\(|this\.[a-z][a-zA-Z0-9_]*\.$method\(|\s[A-Z][A-Z_]{2,}\.$method\(|[.)(][A-Z][A-Z_]{2,}\.$method\(|\.split\([^)]*\)\.$method\(|\.slice\([^)]*\)\.$method\(|\.filter\([^)]*\)\.$method\(|\.sort\([^)]*\)\.$method\(|\.concat\([^)]*\)\.$method\(|as [A-Za-z<>, ]+\[\]\)\.$method\(|\]\)\.$method\(|\)\.$method\(" \
    | sed 's/:[0-9]*:.*//' | sort | uniq -c | sort -rn | head -3
}

ARRAY_GRAND=0
declare -A METHOD_TOTALS

for METHOD in reduce map filter forEach find findIndex some every flat flatMap; do
  hdr "H — .$METHOD() himoyasiz"
  METHOD_TOTAL=0
  printf "  ${B}%-45s %-8s${N}\n" "Manba" "Son"
  for SRC2 in "${ALL_SRC[@]}"; do
    CNT=$(count_unsafe "$SRC2" "$METHOD")
    METHOD_TOTAL=$((METHOD_TOTAL + CNT))
    ARRAY_GRAND=$((ARRAY_GRAND + CNT))
    if [[ $CNT -eq 0 ]]; then
      printf "  ${G}✔${N}  %-45s %s\n" "$SRC2" "0"
    else
      printf "  ${Y}⚠${N}  %-45s ${Y}%s ta${N}\n" "$SRC2" "$CNT"
      WARNINGS=$((WARNINGS+1))
    fi
  done
  METHOD_TOTALS[$METHOD]=$METHOD_TOTAL
  if [[ $METHOD_TOTAL -gt 0 ]]; then
    echo "  Top fayllar:"
    for SRC2 in "${ALL_SRC[@]}"; do top_files_unsafe "$SRC2" "$METHOD"; done \
      | sort -rn | head -4 \
      | while read -r cnt file; do printf "    ${D}%5s ta  %s${N}\n" "$cnt" "$file"; done
  fi
done

printf "\n  ${B}To'g'ri yozish:${N}\n"
printf "  ${R}❌${N}  items.map(...)   data.reduce(...)   list.filter(...)\n"
printf "  ${G}✔${N}   items?.map(...)   (data ?? []).reduce(...)   Array.isArray(list) ? list.filter(...) : []\n"

# ════════════════════════════════════════════════════
printf "\n${B}╔══════════════════════════════════════════════════════════╗\n"
printf "║                   YAKUNIY JADVAL                         ║\n"
printf "╠══════════════════════════════════════════════════════════╣${N}\n"

# FAZA holati
faza_row() {
  local name="$1" ok="$2"
  [[ $ok == "true" ]] \
    && printf "${G}║  ✅  %-52s║${N}\n" "$name" \
    || printf "${R}║  ❌  %-52s║${N}\n" "$name"
}
faza_row "FAZA 1  — Fayl hajmi · @Roles · Boilerplate"   "$FAZA1_OK"
faza_row "FAZA 2+3 — Controller↔Service · AuditInterceptor" "$FAZA23_OK"
faza_row "FAZA 4+5 — Controller SQL-free"                "$FAZA45_OK"
faza_row "FAZA 6  — 'any' tipi yo'q · TS 0-xato"         "$FAZA6_OK"
faza_row "FAZA 7  — Type-safety (as unknown, !)"          "$FAZA7_OK"
faza_row "FAZA 8  — Result · try/catch · Fake response"   "$FAZA8_OK"

printf "${B}╠══════════════════════════════════════════════════════════╣\n"

# Array holati
printf "║  ${B}%-54s${N}${B}║${N}\n" "Array Xavfsizlik:"
for METHOD in reduce map filter forEach find findIndex some every flat flatMap; do
  T=${METHOD_TOTALS[$METHOD]:-0}
  if [[ $T -eq 0 ]]; then
    printf "${G}║    ✔  .%-12s — 0 ta${N}${G}%-28s║${N}\n" "$METHOD()" ""
  else
    printf "${Y}║    ⚠  .%-12s — %-5s ta%-22s║${N}\n" "$METHOD()" "$T" ""
  fi
done

printf "${B}╠══════════════════════════════════════════════════════════╣\n"
printf "║  %-54s║\n" "Umumiy natija:"
[[ $ERRORS -gt 0 ]]   && printf "${R}║  ✘  %-52s║${N}\n" "$ERRORS ta XATO" \
                       || printf "${G}║  ✔  %-52s║${N}\n" "Xatolar yo'q"
[[ $WARNINGS -gt 0 ]] && printf "${Y}║  ⚠  %-52s║${N}\n" "$WARNINGS ta ogohlantirish" \
                       || printf "${G}║  ✔  %-52s║${N}\n" "Ogohlantirishlar yo'q"
printf "${C}║  →  %-52s║${N}\n" "Array himoyasiz jami: $ARRAY_GRAND ta"
printf "${B}╚══════════════════════════════════════════════════════════╝${N}\n"
printf "  ${D}Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')${N}\n\n"

# Skript oxirida (exit dan oldin):
cat > audit-master-report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "errors": $ERRORS,
  "warnings": $WARNINGS,
  "arrayUnsafe": $ARRAY_GRAND,
  "faza": {
    "faza1": $FAZA1_OK,
    "faza23": $FAZA23_OK,
    "faza45": $FAZA45_OK,
    "faza6": $FAZA6_OK,
    "faza7": $FAZA7_OK,
    "faza8": $FAZA8_OK
  }
}
EOF
echo "  JSON: audit-master-report.json"

[[ $ERRORS -gt 0 ]] && exit 1 || exit 0