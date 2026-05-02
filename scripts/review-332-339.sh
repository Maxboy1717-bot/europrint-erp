#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# EUROPRINT ERP — TASK #332-#339 REVIEW SKRIPT
# Tasklar holatini va audit natijalarini ko'rsatadi
#
# Ishlatish: bash scripts/review-332-339.sh
# Yoki     : pnpm review:tasks
# ══════════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$ROOT/apps/api/src"
DASH="$ROOT/artifacts/erp-dashboard/src"
MOD="$SRC/modules"

cd "$ROOT"

# ── Ranglar ────────────────────────────────────────────────────────
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'
C='\033[0;36m'; B='\033[1m'; D='\033[2m'; N='\033[0m'
MAGENTA='\033[0;35m'; CYAN='\033[1;36m'; WHITE='\033[1;37m'

pass()  { printf "  ${G}✔${N}  %s\n" "$*"; }
fail()  { printf "  ${R}✘${N}  %s\n" "$*"; TOTAL_FAILS=$((TOTAL_FAILS+1)); }
warn()  { printf "  ${Y}⚠${N}  %s\n" "$*"; TOTAL_WARNS=$((TOTAL_WARNS+1)); }
inf()   { printf "  ${C}→${N}  %s\n" "$*"; }
skip()  { printf "  ${D}○  %s${N}\n" "$*"; }

task_header() {
  local ref="$1" title="$2" cmd="$3"
  printf "\n${WHITE}┌──────────────────────────────────────────────────────────┐${N}\n"
  printf "${WHITE}│${N}  ${CYAN}${B}${ref}${N}  ${B}${title}${N}\n"
  printf "${WHITE}│${N}  ${D}Tekshiruv: ${cmd}${N}\n"
  printf "${WHITE}└──────────────────────────────────────────────────────────┘${N}\n"
}

section() { printf "\n  ${MAGENTA}▸ %s${N}\n" "$*"; }

TOTAL_FAILS=0; TOTAL_WARNS=0

printf "\n${B}${CYAN}"
printf "╔══════════════════════════════════════════════════════════════╗\n"
printf "║   EUROPRINT ERP — TASK #332-#339 JORIY HOLATI              ║\n"
printf "║   Sana: $(date '+%Y-%m-%d %H:%M')                               ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${N}\n"

# ════════════════════════════════════════════════════════════════════
# TASK #332 — HARDCODED SECRET
# ════════════════════════════════════════════════════════════════════
task_header "#332" "Hardcoded Secret — Darhol To'g'rish" "pnpm audit:master (G7, G8)"

section "G7 — Backend hardcoded secret/password"
SECRET_CNT=$(grep -rEin \
  "password\s*=\s*['\"][^'\"]{4,}['\"]|secret\s*=\s*['\"][^'\"]{4,}['\"]|api_key\s*=\s*['\"][^'\"]{4,}['\"]" \
  "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "process\.env\|\.env\|legacy/\|\.spec\.\|placeholder\|example\|your_\|<" | wc -l | tr -d ' ')
[[ $SECRET_CNT -eq 0 ]] \
  && pass "Hardcoded secret: 0" \
  || fail "Hardcoded secret: $SECRET_CNT ta"

if [[ $SECRET_CNT -gt 0 ]]; then
  grep -rEin \
    "password\s*=\s*['\"][^'\"]{4,}['\"]|secret\s*=\s*['\"][^'\"]{4,}['\"]" \
    "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "process\.env\|\.env\|legacy/\|\.spec\.\|placeholder\|example\|your_\|<" \
    | head -5 | while IFS= read -r line; do inf "  $line"; done
fi

section "G4 — Frontend'da process.env (SECRET)"
FRONTEND_SECRET=$(grep -rn "process\.env\.[A-Z_]*SECRET\|process\.env\.[A-Z_]*KEY\|process\.env\.[A-Z_]*TOKEN" \
  "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "\.spec\.\|//\|NODE_ENV" | wc -l | tr -d ' ')
[[ $FRONTEND_SECRET -eq 0 ]] \
  && pass "Frontend'da SECRET/KEY/TOKEN process.env: 0" \
  || fail "Frontend'da SECRET/KEY/TOKEN process.env: $FRONTEND_SECRET ta"
if [[ $FRONTEND_SECRET -gt 0 ]]; then
  grep -rn "process\.env\.[A-Z_]*SECRET\|process\.env\.[A-Z_]*KEY\|process\.env\.[A-Z_]*TOKEN" \
    "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.spec\.\|//\|NODE_ENV" | head -3 | while IFS= read -r line; do inf "  $line"; done
fi

# ════════════════════════════════════════════════════════════════════
# TASK #333 — TYPE-SAFETY
# ════════════════════════════════════════════════════════════════════
task_header "#333" "Type-Safety Faza 7 — as unknown as, Result<unknown>, Non-null" "pnpm audit:master (E1/E2/E4)"

section "E1 — as unknown as (maqsad: ≤ 30)"
AU=$(grep -rn "as unknown as" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|\.d\.ts" | wc -l | tr -d ' ')
[[ $AU -le 30 ]] && pass "as unknown as: $AU ta ✔" \
  || { [[ $AU -le 100 ]] && warn "as unknown as: $AU ta (maqsad ≤30)" \
       || fail "as unknown as: $AU ta (maqsad ≤30)"; }
inf "Top fayllar:"
grep -rn "as unknown as" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|\.d\.ts" | awk -F: '{print $1}' \
  | sed "s|$SRC/||" | sort | uniq -c | sort -rn | head -5 \
  | while read cnt f; do inf "  $cnt ta — $f"; done

section "E2 — Result<unknown> (maqsad: ≤ 30)"
RU=$(grep -rn "Result<unknown>" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|\.d\.ts" | wc -l | tr -d ' ')
[[ $RU -le 30 ]] && pass "Result<unknown>: $RU ta ✔" \
  || { [[ $RU -le 100 ]] && warn "Result<unknown>: $RU ta (maqsad ≤30)" \
       || fail "Result<unknown>: $RU ta (maqsad ≤30)"; }

section "E4 — Non-null assertion ! (maqsad: 0)"
NN=$(grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;) ]" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s" | grep -c "." || true)
[[ $NN -eq 0 ]] && pass "Non-null (!): 0 ✔" || fail "Non-null (!): $NN ta"

# ════════════════════════════════════════════════════════════════════
# TASK #334 — ERROR HANDLING
# ════════════════════════════════════════════════════════════════════
task_header "#334" "Error Handling — return null, .catch(()=>{}), catch+silent" "pnpm audit:master (F4)"

section "F4 — .catch(() => {}) yoki .catch(() => null)"
CATCH_EMPTY=$(grep -rn "\.catch(\s*(" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." \
  | grep -E "\.catch\(\s*\([^)]*\)\s*=>\s*(\{\s*\}|null|undefined|\[\])" | wc -l | tr -d ' ')
[[ $CATCH_EMPTY -eq 0 ]] && pass ".catch(()=>{}): 0 ✔" || fail ".catch(()=>{}): $CATCH_EMPTY ta"
if [[ $CATCH_EMPTY -gt 0 ]]; then
  grep -rn "\.catch(\s*(" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "legacy/\|\.spec\." \
    | grep -E "\.catch\(\s*\([^)]*\)\s*=>\s*(\{\s*\}|null|undefined|\[\])" \
    | sed "s|$SRC/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

section "F4 — Service'larda return null/[]/{}"
RN=$(grep -rn "return null\|return \[\]\|return {}" "$SRC" --include="*.service.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." | wc -l | tr -d ' ')
[[ $RN -eq 0 ]] && pass "Service'da return null/[]: 0 ✔" || fail "Service'da return null/[]: $RN ta"
if [[ $RN -gt 0 ]]; then
  grep -rn "return null\|return \[\]\|return {}" "$SRC" --include="*.service.ts" 2>/dev/null \
    | grep -v "legacy/\|\.spec\." | sed "s|$SRC/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

# ════════════════════════════════════════════════════════════════════
# TASK #335 — ARXITEKTURA
# ════════════════════════════════════════════════════════════════════
task_header "#335" "Arxitektura — Controller Guard, if/else, Result Pattern" "pnpm audit:arch"

section "Guard yo'q controllerlar (maqsad: 0)"
NO_GUARD=$(grep -rL "@Roles\|@Public\|@UseGuards" "$SRC" --include="*.controller.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." | wc -l | tr -d ' ')
[[ $NO_GUARD -eq 0 ]] && pass "Guard yo'q controller: 0 ✔" || fail "Guard yo'q controller: $NO_GUARD ta"

section "Controller'da if/else satrlar (maqsad: ≤ 50)"
CTRL_IFELSE=$(grep -rn "\bif\b\|\belse\b\|\bswitch\b" "$SRC" --include="*.controller.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|\/\/" | wc -l | tr -d ' ')
[[ $CTRL_IFELSE -le 50 ]] && pass "Controller if/else: $CTRL_IFELSE ≤ 50 ✔" \
  || { [[ $CTRL_IFELSE -le 200 ]] && warn "Controller if/else: $CTRL_IFELSE satr (maqsad ≤50)" \
       || fail "Controller if/else: $CTRL_IFELSE satr (maqsad ≤50)"; }

section "Result pattern qamrovi"
SVC_TOTAL=$(find "$MOD" -name "*.service.ts" 2>/dev/null | grep -v "\.spec\.\|legacy/" | wc -l | tr -d ' ')
SVC_WITH=$(grep -rlE "Result<|okOk|okErr" "$MOD" --include="*.service.ts" 2>/dev/null \
  | grep -v "\.spec\.\|legacy/" | wc -l | tr -d ' ')
inf "Result pattern: $SVC_WITH / $SVC_TOTAL ta service"
[[ $SVC_WITH -eq $SVC_TOTAL ]] && pass "Hammasi to'liq ✔" \
  || warn "$((SVC_TOTAL - SVC_WITH)) ta service hali Result pattern'siz"

# ════════════════════════════════════════════════════════════════════
# TASK #336 — FRONTEND SIFATI
# ════════════════════════════════════════════════════════════════════
task_header "#336" "Frontend Sifati — process.env, localStorage, || [], eslint-disable" "pnpm audit:master (G3/G4)"

section "G4 — Frontend'da process.env (maqsad: 0)"
FE_PENV=$(grep -rn "process\.env" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "\.spec\.\|//" | wc -l | tr -d ' ')
[[ $FE_PENV -eq 0 ]] && pass "process.env frontend'da: 0 ✔" || fail "process.env frontend'da: $FE_PENV ta"
if [[ $FE_PENV -gt 0 ]]; then
  grep -rn "process\.env" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.spec\.\|//" | sed "s|$DASH/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

section "G3 — localStorage try/catch'siz (maqsad: 0)"
LS_UNSAFE=0
while IFS= read -r file; do
  # Fayl ichida localStorage ishlatilgan, lekin try/catch yo'q
  if grep -q "localStorage\." "$file" 2>/dev/null; then
    if ! grep -q "try\s*{" "$file" 2>/dev/null; then
      LS_UNSAFE=$((LS_UNSAFE+1))
      inf "  $(echo "$file" | sed "s|$DASH/||")"
    fi
  fi
done < <(grep -rl "localStorage\." "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "\.spec\.\|__tests__")
[[ $LS_UNSAFE -eq 0 ]] && pass "localStorage try/catch'siz: 0 ✔" \
  || fail "localStorage try/catch'siz fayl: $LS_UNSAFE ta"

section "eslint-disable qoidalar soni"
ESLINT_DIS=$(grep -rn "eslint-disable" "$SRC" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "legacy/\|\.eslintignore" | wc -l | tr -d ' ')
[[ $ESLINT_DIS -eq 0 ]] && pass "eslint-disable: 0 ✔" \
  || { [[ $ESLINT_DIS -le 3 ]] && warn "eslint-disable: $ESLINT_DIS ta" \
       || fail "eslint-disable: $ESLINT_DIS ta (3 dan ko'p)"; }
if [[ $ESLINT_DIS -gt 0 ]]; then
  grep -rn "eslint-disable" "$SRC" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "legacy/\|\.eslintignore" | sed "s|$ROOT/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

# ════════════════════════════════════════════════════════════════════
# TASK #337 — ARRAY XAVFSIZLIK
# ════════════════════════════════════════════════════════════════════
task_header "#337" "Array Xavfsizlik — .map()/.filter()/.reduce() himoyasi" "pnpm audit:master (H bloki)"

section "Backend .reduce() (maqsad: boshlang'ich qiymat majburiy)"
REDUCE_TOTAL=$(grep -rn "\.reduce(" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." | wc -l | tr -d ' ')
# Boshlang'ich qiymatsiz .reduce() — virgulsiz, faqat callback
REDUCE_UNSAFE=$(grep -rn "\.reduce(\s*(" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." \
  | grep -v ",\s*[0-9\[\{\"']" | wc -l | tr -d ' ')
inf "Backend .reduce() jami: $REDUCE_TOTAL ta"
[[ $REDUCE_UNSAFE -eq 0 ]] && pass "Boshlang'ich qiymatsiz .reduce(): 0 ✔" \
  || fail "Boshlang'ich qiymatsiz .reduce(): $REDUCE_UNSAFE ta"

section "Backend .map() jami (maqsad: ≤ 30 himoyasiz)"
MAP_BACKEND=$(grep -rn "\.map(" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." | wc -l | tr -d ' ')
inf "Backend .map() jami: $MAP_BACKEND ta"
MAP_FE=$(grep -rn "\.map(" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "\.spec\." | wc -l | tr -d ' ')
inf "Frontend .map() jami: $MAP_FE ta"

section "Frontend API response null himoyasi"
FE_MAP_UNSAFE=$(grep -rn "response\.\(data\|result\|items\)\.map\|apiRequest.*\.map\|data\.map(" \
  "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "??\|?\." | wc -l | tr -d ' ')
[[ $FE_MAP_UNSAFE -eq 0 ]] && pass "API response.map() himoyasiz: 0 ✔" \
  || warn "API response himoyasiz .map(): $FE_MAP_UNSAFE ta (tekshiring)"

# ════════════════════════════════════════════════════════════════════
# TASK #338 — API GAP
# ════════════════════════════════════════════════════════════════════
task_header "#338" "Frontend ↔ Backend API Qamrovi — Yo'q Endpointlar" "pnpm audit:full, pnpm audit:buttons, pnpm audit:gap"

section "Audit buyruqlari (to'liq natija uchun alohida ishlatilsin)"
inf "pnpm audit:full     — Qamrov foizi va yo'q endpointlar"
inf "pnpm audit:buttons  — Yo'q tugmalar ro'yxati"
inf "pnpm audit:gap      — Frontend sahifalar bo'shliqlari"
inf "pnpm audit:404      — 404 xavfi bo'lgan URL'lar"
inf "pnpm audit:coverage — Backend → Frontend qamrov foizi"

section "Tezkor tekshiruv — Approval workflow tugmalari"
APW_APPROVE=$(grep -rn "approve\|/approve" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -iv "\.spec\.\|//\|import\|type\s" | wc -l | tr -d ' ')
[[ $APW_APPROVE -gt 0 ]] && pass "Approval tugmalari: $APW_APPROVE ta topildi" \
  || warn "Approval tugmalari: topilmadi — ButtonWorkflow.tsx ga qo'shing"

section "Tezkor tekshiruv — API_ROUTES konstantalar"
API_ROUTES=$(grep -rn "API_ROUTES\|apiRoutes\|API_URL" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "\.spec\." | wc -l | tr -d ' ')
[[ $API_ROUTES -gt 0 ]] && pass "API_ROUTES: $API_ROUTES ta ishlatilmoqda" \
  || warn "API_ROUTES: topilmadi — URL konstantalarni birlashtiring"

# ════════════════════════════════════════════════════════════════════
# TASK #339 — KOD TOZALASH
# ════════════════════════════════════════════════════════════════════
task_header "#339" "Kod Tozalash — TODO/FIXME, eslint-disable, console.log" "pnpm audit:master (A3)"

section "TODO/FIXME/HACK izohlar (maqsad: 0 yoki #NNN ref bilan)"
TODO_CNT=$(grep -rn "TODO\|FIXME\|HACK" "$SRC" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|#[0-9]" | wc -l | tr -d ' ')
[[ $TODO_CNT -eq 0 ]] && pass "TODO/FIXME/HACK: 0 ✔" \
  || warn "TODO/FIXME/HACK: $TODO_CNT ta (task ref bilan belgilang)"
if [[ $TODO_CNT -gt 0 ]]; then
  grep -rn "TODO\|FIXME\|HACK" "$SRC" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "legacy/\|\.spec\.\|#[0-9]" | sed "s|$ROOT/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

section "console.log/error backend'da (maqsad: 0)"
CONSOLE_BE=$(grep -rn "console\.\(log\|error\|warn\|info\)" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "legacy/\|\.spec\.\|\.d\.ts\|//" | wc -l | tr -d ' ')
[[ $CONSOLE_BE -eq 0 ]] && pass "Backend console.*: 0 ✔" || fail "Backend console.*: $CONSOLE_BE ta"
if [[ $CONSOLE_BE -gt 0 ]]; then
  grep -rn "console\.\(log\|error\|warn\|info\)" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "legacy/\|\.spec\.\|\.d\.ts\|//" | sed "s|$SRC/||" | head -5 | while IFS= read -r l; do inf "  $l"; done
fi

section "@ts-ignore (maqsad: 0)"
TSIGNORE=$(grep -rn "@ts-ignore\|@ts-nocheck" "$SRC" "$DASH" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "legacy/\|\.spec\." | wc -l | tr -d ' ')
[[ $TSIGNORE -eq 0 ]] && pass "@ts-ignore: 0 ✔" || fail "@ts-ignore: $TSIGNORE ta"

# ════════════════════════════════════════════════════════════════════
# YAKUNIY NATIJA
# ════════════════════════════════════════════════════════════════════
printf "\n${B}${CYAN}"
printf "╔══════════════════════════════════════════════════════════════╗\n"
printf "║   YAKUNIY NATIJA                                            ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${N}\n\n"

if [[ $TOTAL_FAILS -eq 0 && $TOTAL_WARNS -eq 0 ]]; then
  printf "  ${G}${B}🎉 BARCHA TEKSHIRUVLAR MUVAFFAQIYATLI! Tasklar tayyor.${N}\n"
elif [[ $TOTAL_FAILS -eq 0 ]]; then
  printf "  ${Y}${B}⚠  $TOTAL_WARNS ta OGOHLANTIRISH — ularni tekshiring${N}\n"
else
  printf "  ${R}${B}✘  $TOTAL_FAILS ta XATO + $TOTAL_WARNS ta OGOHLANTIRISH — hal qiling${N}\n"
fi

printf "\n  ${D}To'liq audit uchun:${N}\n"
printf "  ${C}  pnpm audit:master${N}   ${D}— barcha fazalar${N}\n"
printf "  ${C}  pnpm audit:problems${N} ${D}— 12 asosiy qoida${N}\n"
printf "  ${C}  pnpm audit:full${N}     ${D}— tizim qamrovi${N}\n"
printf "  ${C}  pnpm audit:buttons${N}  ${D}— tugmalar${N}\n"
printf "  ${C}  pnpm audit:gap${N}      ${D}— bo'sh sahifalar${N}\n"
printf "  ${C}  pnpm audit:arch${N}     ${D}— arxitektura${N}\n"
printf "  ${C}  pnpm audit:pentest${N}  ${D}— xavfsizlik${N}\n"
printf "\n"
