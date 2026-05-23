#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# EUROPRINT ERP — 12 MUAMMO TEKSHIRUVI
# Ishlatish : bash scripts/src/problems-audit.sh
# Yoki      : pnpm audit:problems
# ══════════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'
C='\033[0;36m'; B='\033[1m'; D='\033[2m'; N='\033[0m'
BOLD_RED='\033[1;31m'

ERRORS=0; WARNINGS=0

pass()  { printf "  ${G}✔${N}  %s\n" "$*"; }
fail()  { printf "  ${R}✘${N}  %s\n" "$*"; ERRORS=$((ERRORS+1)); }
warn()  { printf "  ${Y}⚠${N}  %s\n" "$*"; WARNINGS=$((WARNINGS+1)); }
inf()   { printf "  ${C}→${N}  %s\n" "$*"; }
hdr()   {
  printf "\n${B}══ #%-2s — %s${N}\n${D}%s${N}\n" "$1" "$2" \
    "────────────────────────────────────────────────────────────"
}
blk()   {
  printf "\n${B}╔══════════════════════════════════════════════════════════════╗\n"
  printf   "║  %-61s║\n" "$*"
  printf   "╚══════════════════════════════════════════════════════════════╝${N}\n"
}
top_files() {
  local pattern="$1" dir="$2" incl="${3:---include=*.ts}"
  grep -rlE "$pattern" "$dir" $incl 2>/dev/null \
    | while read -r f; do
        cnt=$(grep -cE "$pattern" "$f" 2>/dev/null || true)
        printf "%5d  %s\n" "$cnt" "$f"
      done \
    | sort -rn | head -5 \
    | while read -r cnt file; do
        printf "    ${D}%5d ta  %s${N}\n" "$cnt" "${file#$ROOT_DIR/}"
      done
}

SRC="apps/api/src"
MOD="$SRC/modules"
DASH="artifacts/erp-dashboard/src"
SITE="artifacts/europrint-site/src"
API_BASE="http://localhost:${PORT:-8080}/api"
HEALTH_URL="http://localhost:${PORT:-8080}/health"

printf "\n${B}╔══════════════════════════════════════════════════════════════╗\n"
printf   "║  EUROPRINT ERP — 12 MUAMMO TEKSHIRUVI                       ║\n"
printf   "║  %-61s║\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf   "╚══════════════════════════════════════════════════════════════╝${N}\n"

# ══════════════════════════════════════════════════════════════════
blk "BACKEND ARXITEKTURA (STATIK TEKSHIRUVLAR)"
# ══════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
hdr "1" "Raw SQL to'g'ridan (Drizzle ORM orqali bo'lishi kerak)"
# ─────────────────────────────────────────────────────────────────
# Xavfli raw SQL sinklar — barchasi nol bo'lishi kerak:
#   - "await db.execute" — runQuery obosilini chetlab o'tish
#   - "await db.query"   — to'g'ridan so'rov
#   - "sql.raw("        — qiymatlarni eskeylaydi (xavfli)
# Ruxsat etilgan:
#   - runQuery(sql`...`) — xavfsiz parametrlashtirilgan wrapper
#   - ddl-migrations.ts  — DDL (CREATE INDEX/TABLE) uchun ruxsat
#   - shared/db/         — Drizzle schema ta'rifi
#   - /compatibility/    — alohida task doirasida
RAW_COUNT=$(grep -rn "await db\.execute\|await db\.query\b\|sql\.raw(" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "\.spec\.\|\.d\.ts\|legacy/\|shared/db/\|/compatibility/\|ddl-migrations" \
  | wc -l | tr -d ' ')

if [[ $RAW_COUNT -eq 0 ]]; then
  pass "Raw SQL yo'q — barcha so'rovlar runQuery/Drizzle ORM orqali"
else
  fail "Raw SQL (await db.execute/sql.raw): ${B}$RAW_COUNT${N} ta satr"
  inf "Eng ko'p ishlatilgan fayllar:"
  grep -rn "await db\.execute\|await db\.query\b\|sql\.raw(" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "\.spec\.\|\.d\.ts\|legacy/\|shared/db/\|/compatibility/\|ddl-migrations" \
    | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -5 \
    | while read -r cnt file; do
        printf "    ${D}%5d ta  %s${N}\n" "$cnt" "${file#$ROOT_DIR/}"
      done
  inf "Namunalar:"
  grep -rn "await db\.execute\|await db\.query\b\|sql\.raw(" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "\.spec\.\|\.d\.ts\|legacy/\|shared/db/\|/compatibility/\|ddl-migrations" | head -5 \
    | while read -r l; do printf "    ${R}%s${N}\n" "${l#$ROOT_DIR/}"; done
fi

# ─────────────────────────────────────────────────────────────────
hdr "2" "Service fayllarida db.* to'g'ridan ishlatish (repository pattern kerak)"
# ─────────────────────────────────────────────────────────────────
SVC_DB_PATTERN="db\.(select|insert|update|delete|execute|query)\("
# compatibility/ → alohida task #316 doirasida; pos-svc → legacy
SVC_FILES=$(grep -rlE "$SVC_DB_PATTERN" "$MOD" --include="*.service.ts" 2>/dev/null \
  | grep -v "\.spec\.\|legacy/\|pos-svc\|/compatibility/" | sort)
if [[ -z "$SVC_FILES" ]]; then
  SVC_FILE_COUNT=0
else
  SVC_FILE_COUNT=$(echo "$SVC_FILES" | wc -l | tr -d ' ')
fi
SVC_LINE_COUNT=$(grep -rEn "$SVC_DB_PATTERN" "$MOD" --include="*.service.ts" 2>/dev/null \
  | grep -v "\.spec\.\|legacy/\|pos-svc\|/compatibility/" | wc -l | tr -d ' ')

if [[ $SVC_FILE_COUNT -eq 0 ]]; then
  pass "Servicelarda bevosita db.* yo'q"
else
  fail "db.* bevosita: ${B}$SVC_FILE_COUNT ta fayl${N} ($SVC_LINE_COUNT ta satr)"
  inf "Fayllar:"
  echo "$SVC_FILES" | head -10 | while read -r f; do
    cnt=$(grep -cE "$SVC_DB_PATTERN" "$f" 2>/dev/null || true)
    printf "    ${R}%4d ta${N}  ${D}%s${N}\n" "$cnt" "${f#$ROOT_DIR/}"
  done
  [[ $SVC_FILE_COUNT -gt 10 ]] && printf "    ${D}... va yana %d ta fayl${N}\n" $((SVC_FILE_COUNT-10))
fi

# ─────────────────────────────────────────────────────────────────
hdr "3" "Controller ichida biznes logika (if/else/switch)"
# ─────────────────────────────────────────────────────────────────
# Controller fayllarida if/else/switch — Result pattern tashqari
RAW_CTRL_LINES=$(grep -rEn "^\s*(if|else|switch)\s*[\(\{]" "$MOD" \
  --include="*.controller.ts" 2>/dev/null \
  | grep -v "\.spec\.\|legacy/\|/compatibility/" \
  | grep -v "isOk\|isErr\|\.ok\b\|HttpStatus\|HttpException\|status\b\|\.err\b" \
  | wc -l | tr -d ' ')

if [[ $RAW_CTRL_LINES -eq 0 ]]; then
  pass "Controller ichida biznes logika (if/else/switch) yo'q"
else
  warn "Controller biznes logika: ${B}$RAW_CTRL_LINES ta satr${N}"
  inf "Eng ko'p fayllar:"
  grep -rlE "^\s*(if|else|switch)\s*[\(\{]" "$MOD" \
    --include="*.controller.ts" 2>/dev/null \
    | grep -v "\.spec\.\|legacy/\|/compatibility/" \
    | while read -r f; do
        cnt=$(grep -cE "^\s*(if|else|switch)\s*[\(\{]" "$f" 2>/dev/null || true)
        printf "%5d  %s\n" "$cnt" "$f"
      done | sort -rn | head -5 \
    | while read -r cnt file; do
        printf "    ${D}%5d ta  %s${N}\n" "$cnt" "${file#$ROOT_DIR/}"
      done
  inf "Namunalar (birinchi 5 ta):"
  grep -rEn "^\s*(if|else|switch)\s*[\(\{]" "$MOD" \
    --include="*.controller.ts" 2>/dev/null \
    | grep -v "\.spec\.\|legacy/\|/compatibility/" \
    | grep -v "isOk\|isErr\|\.ok\b\|HttpStatus\|HttpException" \
    | head -5 \
    | while read -r l; do printf "    ${Y}%s${N}\n" "${l#$ROOT_DIR/}"; done
fi

# ─────────────────────────────────────────────────────────────────
hdr "4" "Guard o'rnatilmagan controller fayllar"
# ─────────────────────────────────────────────────────────────────
UNGUARDED_COUNT=0
UNGUARDED_LIST=""

while IFS= read -r ctrl; do
  [[ -z "$ctrl" ]] && continue
  if ! grep -qE "@Roles\b|@Public\b|@RequirePermission\b|@UseGuards" "$ctrl" 2>/dev/null; then
    UNGUARDED_COUNT=$((UNGUARDED_COUNT+1))
    UNGUARDED_LIST="$UNGUARDED_LIST\n    ${R}${ctrl#$ROOT_DIR/}${N}"
  fi
done < <(find "$MOD" -name "*.controller.ts" | grep -v "\.spec\.\|legacy/\|compatibility/" | sort)

if [[ $UNGUARDED_COUNT -eq 0 ]]; then
  pass "Barcha controllerlarda guard bor"
else
  fail "Guard yo'q: ${B}$UNGUARDED_COUNT ta controller${N}"
  printf "$UNGUARDED_LIST\n" | head -15
  [[ $UNGUARDED_COUNT -gt 15 ]] && printf "    ${D}... va yana %d ta${N}\n" $((UNGUARDED_COUNT-15))
fi

# ─────────────────────────────────────────────────────────────────
hdr "5" "Magic numbers (hardcoded raqamlar)"
# ─────────────────────────────────────────────────────────────────
# 2+ raqamli konstantalar — port, limit, id, timeout kabi
MAGIC_PAT="[^a-zA-Z_'\"](([2-9][0-9]+|1[0-9][0-9]+)[^a-zA-Z0-9_])"
# Simpler pattern for practical use:
MAGIC_SIMPLE="\b(200|201|400|401|403|404|409|422|429|500|503|1000|2000|3000|4000|5000|8080|60000|30000|3600|86400|[0-9]{4,})\b"

MAGIC_COUNT=$(grep -rEn "$MAGIC_SIMPLE" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "\.spec\.\|\.d\.ts\|legacy/\|HttpStatus\.\|enum\|// \|/\*\|status:" \
  | grep -v "\.constants\.ts:\|seed\.service\.ts:\|seed\.repository\.ts:" \
  | grep -v "00000000-0000\|postgresql://\|targetValue:\|style=\"color:\|chatId:\|padStart\|companyInn:\|company_size:\|[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]" \
  | wc -l | tr -d ' ')

if [[ $MAGIC_COUNT -eq 0 ]]; then
  pass "Magic numbers yo'q"
else
  warn "Magic numbers: ${B}$MAGIC_COUNT ta satr${N}"
  inf "Namunalar:"
  grep -rEn "$MAGIC_SIMPLE" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "\.spec\.\|\.d\.ts\|legacy/\|HttpStatus\.\|enum\|// \|/\*\|status:" | head -8 \
    | while read -r l; do printf "    ${Y}%s${N}\n" "${l#$ROOT_DIR/}"; done
fi

# ─────────────────────────────────────────────────────────────────
hdr "6" "Non-null assertion (!) — taqiqlangan"
# ─────────────────────────────────────────────────────────────────
NN_COUNT=$(grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;)\] ]" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s|'[^']*!|\"[^\"]*!|\`[^\`]*!" | wc -l | tr -d ' ')

if [[ $NN_COUNT -eq 0 ]]; then
  pass "Non-null assertion (!) yo'q"
else
  fail "Non-null (!): ${B}$NN_COUNT ta${N}"
  inf "Namunalar:"
  grep -rPn "[a-zA-Z0-9_)\]]\![\.\[\(,;)\] ]" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -Pv "legacy/|\.spec\.|\.d\.ts|!==|!=\s|'[^']*!|\"[^\"]*!|\`[^\`]*!" | head -8 \
    | while read -r l; do printf "    ${R}%s${N}\n" "${l#$ROOT_DIR/}"; done
fi

# ─────────────────────────────────────────────────────────────────
hdr "7" "Express qoldiqlari (to'g'ridan import yoki require)"
# ─────────────────────────────────────────────────────────────────
# Faqat Express modulini to'g'ridan import/require qilish — NestJS platformasi emas
EXPRESS_PAT="require\(['\"]express['\"]\)|from ['\"]express['\"]|import \* as express"
EXPRESS_EXCL="@nestjs/platform-express|type.*Express|Request,|Response,|NextFunction|\.d\.ts"

EXPRESS_COUNT=$(grep -rEn "$EXPRESS_PAT" "$SRC" --include="*.ts" 2>/dev/null \
  | grep -v "$EXPRESS_EXCL\|\.spec\.\|legacy/" | wc -l | tr -d ' ')

if [[ $EXPRESS_COUNT -eq 0 ]]; then
  pass "Express to'g'ridan import yo'q"
else
  fail "Express import: ${B}$EXPRESS_COUNT ta satr${N}"
  grep -rEn "$EXPRESS_PAT" "$SRC" --include="*.ts" 2>/dev/null \
    | grep -v "$EXPRESS_EXCL\|\.spec\.\|legacy/" | head -5 \
    | while read -r l; do printf "    ${R}%s${N}\n" "${l#$ROOT_DIR/}"; done
fi

# ══════════════════════════════════════════════════════════════════
blk "XAVFSIZLIK PENTEST (API ishlab turishi kerak)"
# ══════════════════════════════════════════════════════════════════

API_UP=false
HEALTH_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time 3 2>/dev/null)
if [[ "$HEALTH_STATUS" == "200" ]]; then
  API_UP=true
  pass "API ishlayapti ($HEALTH_URL)"
else
  warn "API javob bermayapti ($HEALTH_URL → $HEALTH_STATUS) — pentest o'tkazib yuborildi"
fi

# ─────────────────────────────────────────────────────────────────
hdr "8" "Katta payload / nested JSON → 429 (413 yoki 400 kutilgan)"
# ─────────────────────────────────────────────────────────────────
if [[ "$API_UP" == "true" ]]; then
  # 8a: 1MB payload
  BIG_STR=$(python3 -c "print('A'*1000000)" 2>/dev/null || printf '%0.sA' {1..1000})
  S8A=$(curl -sk -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$BIG_STR\",\"password\":\"test\"}" \
    --max-time 5 2>/dev/null)

  # 8b: deeply nested JSON
  NESTED='{"a":{"a":{"a":{"a":{"a":{"a":{"a":{"a":{"a":{"a":{"a":"deep"}}}}}}}}}}}'
  S8B=$(curl -sk -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "$NESTED" --max-time 5 2>/dev/null)

  # Katta payload
  if [[ "$S8A" =~ ^(400|413|422|431)$ ]]; then
    pass "Katta payload bloklandi ($S8A) ✓"
  else
    warn "Katta payload → ${B}$S8A${N} (413 yoki 400 kutilgan edi)"
    inf "Tuzatish: NestJS PayloadTooLargeException yoki body-parser limit o'rnating"
  fi

  # Nested JSON
  if [[ "$S8B" =~ ^(400|413|422)$ ]]; then
    pass "Chuqur nested JSON bloklandi ($S8B) ✓"
  else
    warn "Chuqur nested JSON → ${B}$S8B${N} (400/413 kutilgan)"
    inf "Tuzatish: json({limit:'1mb', strict:true}) yoki custom middleware qo'shing"
  fi
else
  warn "#8 o'tkazib yuborildi — API o'chiq"
fi

# ─────────────────────────────────────────────────────────────────
hdr "9" "CONNECT metodi → 000 yoki boshqa (405 bo'lishi kerak)"
# ─────────────────────────────────────────────────────────────────
if [[ "$API_UP" == "true" ]]; then
  S9=$(curl -sk -o /dev/null -w "%{http_code}" -X CONNECT "$API_BASE/auth/health" \
    --max-time 3 2>/dev/null)
  if [[ "$S9" =~ ^(405|404|400)$ ]]; then
    pass "CONNECT → bloklandi ($S9) ✓"
  elif [[ "$S9" == "000" ]]; then
    warn "CONNECT → ${B}000${N} (ulanish rad etildi — 405 qaytarilishi yaxshi bo'lardi)"
    inf "Tuzatish: Nginx/proxy darajasida CONNECT metodini aniqlash"
    inf "NestJS ichida: app.use((req,res,next) => { if(req.method==='CONNECT') res.status(405)...; })"
  else
    warn "CONNECT → ${B}$S9${N} (405 kutilgan)"
  fi

  # TRACE ham tekshirish
  S9T=$(curl -sk -o /dev/null -w "%{http_code}" -X TRACE "$API_BASE/auth/health" \
    --max-time 3 2>/dev/null)
  if [[ "$S9T" =~ ^(405|404|400)$ ]]; then
    pass "TRACE → bloklandi ($S9T) ✓"
  else
    warn "TRACE → ${B}$S9T${N} (405 kutilgan)"
  fi
else
  warn "#9 o'tkazib yuborildi — API o'chiq"
fi

# ─────────────────────────────────────────────────────────────────
hdr "10" "Admin login — biznes logika testi"
# ─────────────────────────────────────────────────────────────────
AUDIT_ADMIN_PASS="${PENTEST_ADMIN_PASSWORD:-EuroPrint2024!}"
if [[ "$API_UP" == "true" ]]; then
  TOKEN_RESP=$(curl -sk -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"$AUDIT_ADMIN_PASS\"}" \
    --max-time 5 2>/dev/null)
  HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"$AUDIT_ADMIN_PASS\"}" \
    --max-time 5 2>/dev/null)

  TOKEN=$(echo "$TOKEN_RESP" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  [[ -z "$TOKEN" ]] && TOKEN=$(echo "$TOKEN_RESP" \
    | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  [[ -z "$TOKEN" ]] && TOKEN=$(echo "$TOKEN_RESP" \
    | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

  if [[ -n "$TOKEN" ]]; then
    pass "Admin login muvaffaqiyatli (token olindi) ✓"
    inf "Token: ${TOKEN:0:40}..."

    # Biznes logika: manfiy miqdor
    S10N=$(curl -sk -o /dev/null -w "%{http_code}" -X POST "$API_BASE/sd/orders" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity":-1,"price":-100}' --max-time 5 2>/dev/null)
    [[ "$S10N" =~ ^(400|422)$ ]] && pass "Manfiy miqdor bloklandi ($S10N)" \
      || warn "Manfiy miqdor → $S10N (400 kutilgan)"

    # Biznes logika: admin endpoint
    S10A=$(curl -sk -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $TOKEN" "$API_BASE/admin/users" \
      --max-time 5 2>/dev/null)
    [[ "$S10A" =~ ^(200|403)$ ]] && pass "Admin endpoint javob berdi ($S10A)" \
      || warn "Admin endpoint → $S10A"

  elif [[ "$HTTP_CODE" == "401" ]]; then
    fail "Admin login ishlamayapti → ${B}401${N} (noto'g'ri parol yoki account locked)"
    inf "Tekshiring: PENTEST_ADMIN_PASSWORD muhit o'zgaruvchisi yoki DB holati"
    inf "Yechim: ADMIN_SEED_PASSWORD='EuroPrint2024!' pnpm --filter @europrint/api run seed"
    inf "Xom javob: $(echo "$TOKEN_RESP" | head -c 200)"
  else
    warn "Admin login → ${B}$HTTP_CODE${N} (kutilmagan javob)"
    inf "Xom javob: $(echo "$TOKEN_RESP" | head -c 200)"
  fi
else
  warn "#10 o'tkazib yuborildi — API o'chiq"
fi

# ══════════════════════════════════════════════════════════════════
blk "FRONTEND TUGMA AUDITI (tsx fayllar)"
# ══════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
hdr "11" "Bo'sh onClick={() => {}} handlerlari"
# ─────────────────────────────────────────────────────────────────
EMPTY_ONCLICK_PAT='onClick=\{[[:space:]]*\(\)[[:space:]]*=>[[:space:]]*\{[[:space:]]*\}[[:space:]]*\}|onClick=\{[[:space:]]*\(\)[[:space:]]*=>[[:space:]]*undefined[[:space:]]*\}'

EMPTY_FILES=""
EMPTY_COUNT=0
EMPTY_FILE_COUNT=0

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  cnt=$(grep -cE "$EMPTY_ONCLICK_PAT" "$f" 2>/dev/null || true)
  if [[ ${cnt:-0} -gt 0 ]]; then
    EMPTY_COUNT=$((EMPTY_COUNT + cnt))
    EMPTY_FILE_COUNT=$((EMPTY_FILE_COUNT + 1))
    EMPTY_FILES="$EMPTY_FILES\n    ${R}${cnt} ta${N}  ${D}${f#$ROOT_DIR/}${N}"
    # Show exact lines
    grep -En "$EMPTY_ONCLICK_PAT" "$f" 2>/dev/null | head -2 \
      | while read -r l; do printf "           ${D}→ %s${N}\n" "$l"; done
  fi
done < <(find "$DASH" "$SITE" -name "*.tsx" 2>/dev/null | sort)

# Also check simpler pattern
EMPTY2_PAT='onClick=\{[[:space:]]*\(\)[[:space:]]*=>[[:space:]]*\{\}'
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if grep -qE "$EMPTY2_PAT" "$f" 2>/dev/null; then
    cnt=$(grep -cE "$EMPTY2_PAT" "$f" 2>/dev/null || true)
    # Avoid double counting
    already=$(echo "$EMPTY_FILES" | grep -c "${f#$ROOT_DIR/}" 2>/dev/null || true)
    if [[ ${already:-0} -eq 0 ]]; then
      EMPTY_COUNT=$((EMPTY_COUNT + cnt))
      EMPTY_FILE_COUNT=$((EMPTY_FILE_COUNT + 1))
      EMPTY_FILES="$EMPTY_FILES\n    ${R}${cnt} ta${N}  ${D}${f#$ROOT_DIR/}${N}"
    fi
  fi
done < <(find "$DASH" "$SITE" -name "*.tsx" 2>/dev/null | sort)

if [[ $EMPTY_COUNT -eq 0 ]]; then
  pass "Bo'sh onClick handler yo'q"
else
  fail "Bo'sh onClick: ${B}$EMPTY_COUNT ta${N} ($EMPTY_FILE_COUNT ta faylda)"
  printf "$EMPTY_FILES\n"
fi

# ─────────────────────────────────────────────────────────────────
hdr "12" "O'lik tugmalar (disabled bor, onClick yo'q)"
# ─────────────────────────────────────────────────────────────────
# Fayllar: disabled atributi bor LEKIN onClick/onPress/handler yo'q
DEAD_BTN_FILES=0
DEAD_BTN_LIST=""

# 1-qadam: barcha disabled bor fayllar
DISABLED_FILES=$(grep -rlE '<[Bb]utton[^>]{0,200}disabled|\sdisabled[[:space:]>]' \
  "$DASH" "$SITE" --include="*.tsx" 2>/dev/null | sort)

# 2-qadam: handler yo'q fayllarni filter
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  has_handler=$(grep -cE 'onClick=|onPress=|\.mutate\(|apiRequest|const handle[A-Z]|useMutation' \
    "$f" 2>/dev/null || true)
  if [[ ${has_handler:-0} -eq 0 ]]; then
    DEAD_BTN_FILES=$((DEAD_BTN_FILES + 1))
    DEAD_BTN_LIST="$DEAD_BTN_LIST\n    ${D}${f#$ROOT_DIR/}${N}"
  fi
done <<< "$DISABLED_FILES"

if [[ $DEAD_BTN_FILES -eq 0 ]]; then
  pass "O'lik tugmalar yo'q"
else
  warn "O'lik (disabled, handler yo'q): ${B}$DEAD_BTN_FILES ta fayl${N}"
  printf "$DEAD_BTN_LIST\n" | head -15
  [[ $DEAD_BTN_FILES -gt 15 ]] && \
    printf "    ${D}... va yana %d ta fayl${N}\n" $((DEAD_BTN_FILES - 15))
  inf "Tuzatish: disabled={isLoading} yoki real API ga ulash"
fi

# ══════════════════════════════════════════════════════════════════
# YAKUNIY JADVAL
# ══════════════════════════════════════════════════════════════════
printf "\n${B}╔══════════════════════════════════════════════════════════════╗\n"
printf   "║                      YAKUNIY JADVAL                         ║\n"
printf   "╠═══╦══════════════════════════════════════════════════════════╣${N}\n"

row() {
  local n="$1" label="$2" status="$3" detail="$4"
  if [[ "$status" == "ok" ]]; then
    printf "${G}║ %2s ║  ✔  %-52s║${N}\n" "$n" "$label"
  elif [[ "$status" == "warn" ]]; then
    printf "${Y}║ %2s ║  ⚠  %-52s║${N}\n" "$n" "$label ($detail)"
  else
    printf "${R}║ %2s ║  ✘  %-52s║${N}\n" "$n" "$label ($detail)"
  fi
}

# Determine statuses based on counts
[[ $RAW_COUNT -eq 0 ]]           && row  1 "Raw SQL"                          ok "" \
                                  || row  1 "Raw SQL"                          fail "$RAW_COUNT ta satr"
[[ $SVC_FILE_COUNT -eq 0 ]]      && row  2 "Service da db.*"                  ok "" \
                                  || row  2 "Service da db.*"                  fail "$SVC_FILE_COUNT ta fayl"
[[ $RAW_CTRL_LINES -eq 0 ]]      && row  3 "Controller biznes logika"          ok "" \
                                  || row  3 "Controller biznes logika"          warn "$RAW_CTRL_LINES ta satr"
[[ $UNGUARDED_COUNT -eq 0 ]]     && row  4 "Guard yo'q controllerlar"          ok "" \
                                  || row  4 "Guard yo'q controllerlar"          fail "$UNGUARDED_COUNT ta"
[[ $MAGIC_COUNT -eq 0 ]]         && row  5 "Magic numbers"                     ok "" \
                                  || row  5 "Magic numbers"                     warn "$MAGIC_COUNT ta"
[[ $NN_COUNT -eq 0 ]]            && row  6 "Non-null assertion (!)"             ok "" \
                                  || row  6 "Non-null assertion (!)"             fail "$NN_COUNT ta"
[[ $EXPRESS_COUNT -eq 0 ]]       && row  7 "Express qoldiqlari"                ok "" \
                                  || row  7 "Express qoldiqlari"                fail "$EXPRESS_COUNT ta"

if [[ "$API_UP" == "true" ]]; then
  [[ "$S8A" =~ ^(400|413|422|431)$ && "$S8B" =~ ^(400|413|422)$ ]] \
    && row  8 "Katta payload limitlash"           ok "" \
    || row  8 "Katta payload limitlash"           warn "429 qaytdi (413 kerak)"
  [[ "$S9" =~ ^(405|404|400)$ ]] \
    && row  9 "CONNECT/TRACE metodi"              ok "" \
    || row  9 "CONNECT/TRACE metodi"              warn "→ $S9 (405 kutilgan)"
  [[ -n "${TOKEN:-}" ]] \
    && row 10 "Admin login (EuroPrint2024!)"      ok "" \
    || row 10 "Admin login (EuroPrint2024!)"      fail "token olinmadi"
else
  printf "${D}║ 8 ║  →  %-52s║${N}\n" "Katta payload — API o'chiq, o'tkazildi"
  printf "${D}║ 9 ║  →  %-52s║${N}\n" "CONNECT/TRACE — API o'chiq, o'tkazildi"
  printf "${D}║10 ║  →  %-52s║${N}\n" "Admin login  — API o'chiq, o'tkazildi"
fi

[[ $EMPTY_COUNT -eq 0 ]]         && row 11 "Bo'sh onClick handler"             ok "" \
                                  || row 11 "Bo'sh onClick handler"             fail "$EMPTY_COUNT ta"
[[ $DEAD_BTN_FILES -eq 0 ]]      && row 12 "O'lik tugmalar (disabled)"         ok "" \
                                  || row 12 "O'lik tugmalar (disabled)"         warn "~$DEAD_BTN_FILES ta fayl"

printf "${B}╠═══╩══════════════════════════════════════════════════════════╣\n"
printf "║  Xatolar    : %d ta                                          ║\n" "$ERRORS"
printf "║  Ogohlant.  : %d ta                                          ║\n" "$WARNINGS"
printf "╚══════════════════════════════════════════════════════════════╝${N}\n"
printf "  ${D}Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')${N}\n\n"

# JSON chiqish
cat > problems-audit-report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "errors": $ERRORS,
  "warnings": $WARNINGS,
  "checks": {
    "1_raw_sql":           { "lines": $RAW_COUNT,          "status": "$([ $RAW_COUNT -eq 0 ] && echo ok || echo fail)" },
    "2_service_db_direct": { "files": $SVC_FILE_COUNT,     "lines": $SVC_LINE_COUNT, "status": "$([ $SVC_FILE_COUNT -eq 0 ] && echo ok || echo fail)" },
    "3_ctrl_business":     { "lines": $RAW_CTRL_LINES,     "status": "$([ $RAW_CTRL_LINES -eq 0 ] && echo ok || echo warn)" },
    "4_no_guard":          { "count": $UNGUARDED_COUNT,    "status": "$([ $UNGUARDED_COUNT -eq 0 ] && echo ok || echo fail)" },
    "5_magic_numbers":     { "lines": $MAGIC_COUNT,        "status": "$([ $MAGIC_COUNT -eq 0 ] && echo ok || echo warn)" },
    "6_non_null":          { "count": $NN_COUNT,           "status": "$([ $NN_COUNT -eq 0 ] && echo ok || echo fail)" },
    "7_express_remnants":  { "lines": $EXPRESS_COUNT,      "status": "$([ $EXPRESS_COUNT -eq 0 ] && echo ok || echo fail)" },
    "11_empty_onclick":    { "count": $EMPTY_COUNT,        "status": "$([ $EMPTY_COUNT -eq 0 ] && echo ok || echo fail)" },
    "12_dead_buttons":     { "files": $DEAD_BTN_FILES,     "status": "$([ $DEAD_BTN_FILES -eq 0 ] && echo ok || echo warn)" }
  }
}
EOF
inf "JSON: problems-audit-report.json"

[[ $ERRORS -gt 0 ]] && exit 1 || exit 0
