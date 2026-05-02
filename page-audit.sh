#!/usr/bin/env bash
# ============================================================================
# EuroPrint — PAGE-BY-PAGE AUDIT v3 (TUZATILGAN)
# Tuzatildi:
#   - set +H (history expansion o'chirildi - !data xatosi)
#   - default values (${VAR:-0}) - unary operator expected xatosi
#   - awk bilan line count (wc -l muammosi)
#   - fallback patterns
# ============================================================================

set +e
set +H   # MUHIM: history expansion (!data) ni o'chirish

# ---- .env ----
if [ -f .env ]; then set -a; source .env 2>/dev/null; set +a; fi
if [ -f apps/api/.env ]; then set -a; source apps/api/.env 2>/dev/null; set +a; fi

ROOT="${PROJECT_ROOT:-$(pwd)}"
API_URL="${API_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@europrint.uz}"
ADMIN_PASS="${ADMIN_SEED_PASSWORD:-${ADMIN_PASS:-Admin123!}}"

FRONTEND=""
for p in apps/web/src apps/erp-dashboard/src artifacts/erp-dashboard/src frontend/src client/src; do
  if [ -d "$ROOT/$p" ]; then FRONTEND="$ROOT/$p"; break; fi
done
[ -z "$FRONTEND" ] && { echo "ERROR: Frontend topilmadi"; exit 1; }

PAGES_DIRS=()
for d in pages routes screens views; do
  [ -d "$FRONTEND/$d" ] && PAGES_DIRS+=("$FRONTEND/$d")
done
[ ${#PAGES_DIRS[@]} -eq 0 ] && PAGES_DIRS=("$FRONTEND")

REPORT="$ROOT/page-audit-$(date +%Y%m%d-%H%M%S).txt"

# ---- Bayroqlar ----
FAILS_ONLY=0; STUBS_ONLY=0; FILTER_PAGE=""; NO_COLOR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --fails-only) FAILS_ONLY=1 ;;
    --stubs-only) STUBS_ONLY=1 ;;
    --no-color)   NO_COLOR=1 ;;
    --page)       shift; FILTER_PAGE="$1" ;;
  esac
  shift
done

# ---- Ranglar ----
if [ "$NO_COLOR" = "1" ] || [ ! -t 1 ]; then
  RED=""; GRN=""; YLW=""; CYN=""; BOLD=""; DIM=""; RST=""
else
  RED=$'\033[0;31m'
  GRN=$'\033[0;32m'
  YLW=$'\033[1;33m'
  CYN=$'\033[0;36m'
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  RST=$'\033[0m'
fi

# ---- Backend tekshiruv ----
get_token() {
  local code
  code=$(curl -s -o /tmp/login.json -w '%{http_code}' --max-time 5 \
    -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null)
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    if command -v jq >/dev/null 2>&1; then
      jq -r '.access_token // .token // .data.token // empty' /tmp/login.json 2>/dev/null
    else
      grep -oE '"(access_)?token":"[^"]+"' /tmp/login.json | head -1 | cut -d'"' -f4
    fi
  fi
}

BACKEND_OK=0
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$API_URL/api/auth/health" 2>/dev/null)
if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "201" ]; then
  BACKEND_OK=1
fi
TOKEN=""
[ "$BACKEND_OK" = "1" ] && TOKEN=$(get_token)

extract_api_urls() {
  grep -ohE "(['\"\`])(/api/[a-zA-Z0-9_/\-{}:]+)\1" "$1" 2>/dev/null \
    | sed -E "s/['\"\`]//g" | sort -u
}

test_endpoint() {
  local url=$1
  url=$(echo "$url" | sed 's/{[^}]*}/1/g; s/:[a-zA-Z]*/1/g')
  if [ -n "$TOKEN" ]; then
    curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
      -H "Authorization: Bearer $TOKEN" "$API_URL$url" 2>/dev/null
  else
    curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$API_URL$url" 2>/dev/null
  fi
}

find_pages() {
  for d in "${PAGES_DIRS[@]}"; do
    find "$d" -type f \( -name "*.tsx" -o -name "*.jsx" \) \
      -not -path "*/node_modules/*" -not -path "*/dist/*" \
      -not -name "*.test.tsx" -not -name "*.spec.tsx" \
      -not -name "*.stories.tsx" 2>/dev/null
  done | sort -u
}

# ---- Ishonchli line count: grep -c '' ----
get_lines() {
  local n
  n=$(grep -c '' "$1" 2>/dev/null)
  echo "${n:-0}"
}

real_lines() {
  local n
  n=$(grep -cvE '^[[:space:]]*$|^[[:space:]]*//|^[[:space:]]*\*|^[[:space:]]*import |^[[:space:]]*export[[:space:]]+\{|^[[:space:]]*from ' "$1" 2>/dev/null)
  echo "${n:-0}"
}

# ---- Boshlanish ----
echo "EuroPrint Page Audit v3 — $(date)" | tee "$REPORT"
echo "Frontend: $FRONTEND" | tee -a "$REPORT"
echo "Sahifalar: ${PAGES_DIRS[*]}" | tee -a "$REPORT"
echo "API: $API_URL" | tee -a "$REPORT"
if [ "$BACKEND_OK" = "1" ]; then
  echo "Backend: ${GRN}ONLINE${RST}" | tee -a "$REPORT"
else
  echo "Backend: ${RED}OFFLINE${RST}" | tee -a "$REPORT"
  echo "${YLW}DIQQAT: API testlari skip qilinadi${RST}" | tee -a "$REPORT"
fi
echo "" | tee -a "$REPORT"

TOTAL=0; PERFECT=0; PARTIAL=0; BROKEN=0; STUBS=0
HAS_LOADING=0; HAS_ERROR=0; HAS_EMPTY=0; HAS_I18N=0
TOTAL_API=0; OK_API=0; FAIL_API=0
declare -A FAIL_ENDPOINTS

while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue
  REL_PATH=$(echo "$FILE" | sed "s|$FRONTEND/||")

  if [ -n "$FILTER_PAGE" ]; then
    echo "$REL_PATH" | grep -qi "$FILTER_PAGE" || continue
  fi

  TOTAL=$((TOTAL+1))

  # Hajm
  LINES=$(get_lines "$FILE")
  CODE_LINES=$(real_lines "$FILE")
  LINES=${LINES:-0}
  CODE_LINES=${CODE_LINES:-0}

  IS_STUB=0
  if [ "$CODE_LINES" -lt 15 ] 2>/dev/null || [ "$LINES" -lt 30 ] 2>/dev/null; then
    IS_STUB=1
    STUBS=$((STUBS+1))
  fi

  if [ "$STUBS_ONLY" = "1" ] && [ "$IS_STUB" = "0" ]; then continue; fi

  # State checks (single-quote bilan! ! belgisini escape qilmaymiz, faqat oddiy patterns)
  LOADING=0
  if grep -qE 'Skeleton|isLoading|isPending|isFetching|<Spinner|<Loader' "$FILE" 2>/dev/null; then
    LOADING=1
  fi

  ERROR=0
  if grep -qE 'isError|onError|catch[[:space:]]*\(|<ErrorState|toast\.error' "$FILE" 2>/dev/null; then
    ERROR=1
  fi

  # ! belgisini ishlatmaslik uchun [^a-z]data patternini ishlataman
  EMPTY=0
  if grep -qE 'EmptyState|<NoData|<Empty[[:space:]]|data\.length[[:space:]]*===[[:space:]]*0|length[[:space:]]*===[[:space:]]*0|no.data' "$FILE" 2>/dev/null; then
    EMPTY=1
  fi

  I18N=0
  if grep -qE 'useTranslation|useIntl' "$FILE" 2>/dev/null; then
    I18N=1
  fi

  # Default qiymatlar (xavfsizlik)
  LOADING=${LOADING:-0}
  ERROR=${ERROR:-0}
  EMPTY=${EMPTY:-0}
  I18N=${I18N:-0}

  [ "$LOADING" = "1" ] && HAS_LOADING=$((HAS_LOADING+1))
  [ "$ERROR" = "1" ]   && HAS_ERROR=$((HAS_ERROR+1))
  [ "$EMPTY" = "1" ]   && HAS_EMPTY=$((HAS_EMPTY+1))
  [ "$I18N" = "1" ]    && HAS_I18N=$((HAS_I18N+1))

  # API URL'lar
  URLS=()
  while IFS= read -r u; do
    [ -n "$u" ] && URLS+=("$u")
  done < <(extract_api_urls "$FILE")

  PAGE_OK=1
  PAGE_API=()
  for url in "${URLS[@]}"; do
    TOTAL_API=$((TOTAL_API+1))
    if [ "$BACKEND_OK" = "1" ]; then
      CODE=$(test_endpoint "$url")
    else
      CODE="000"
    fi
    case "$CODE" in
      200|201|204|304) OK_API=$((OK_API+1)); PAGE_API+=("OK $CODE $url") ;;
      401|403)         OK_API=$((OK_API+1)); PAGE_API+=("AUTH $CODE $url") ;;
      404)             FAIL_API=$((FAIL_API+1)); PAGE_API+=("404 $url"); FAIL_ENDPOINTS["$url"]="404"; PAGE_OK=0 ;;
      500|502|503)     FAIL_API=$((FAIL_API+1)); PAGE_API+=("500 $url"); FAIL_ENDPOINTS["$url"]="$CODE"; PAGE_OK=0 ;;
      000)             PAGE_API+=("OFFLINE $url") ;;
      *)               PAGE_API+=("$CODE $url") ;;
    esac
  done

  # Skor
  SCORE=0
  [ "$LOADING" = "1" ] && SCORE=$((SCORE+1))
  [ "$ERROR" = "1" ]   && SCORE=$((SCORE+1))
  [ "$EMPTY" = "1" ]   && SCORE=$((SCORE+1))
  [ "$I18N" = "1" ]    && SCORE=$((SCORE+1))
  [ "$IS_STUB" = "0" ] && SCORE=$((SCORE+1))
  [ ${#URLS[@]} -gt 0 ] && SCORE=$((SCORE+1))
  if [ "$BACKEND_OK" = "1" ]; then
    if [ "$PAGE_OK" = "1" ] && [ ${#URLS[@]} -gt 0 ]; then
      SCORE=$((SCORE+2))
    fi
  else
    if [ ${#URLS[@]} -gt 0 ]; then
      SCORE=$((SCORE+2))
    fi
  fi

  if [ "$SCORE" -ge 7 ]; then
    PERFECT=$((PERFECT+1)); STATUS="OK"; STATUS_CLR="$GRN"
  elif [ "$SCORE" -ge 4 ]; then
    PARTIAL=$((PARTIAL+1)); STATUS="PARTIAL"; STATUS_CLR="$YLW"
  else
    BROKEN=$((BROKEN+1)); STATUS="BROKEN"; STATUS_CLR="$RED"
  fi

  if [ "$FAILS_ONLY" = "1" ] && [ "$SCORE" -ge 7 ]; then continue; fi

  echo "" | tee -a "$REPORT"

  STUB_LABEL=""
  [ "$IS_STUB" = "1" ] && STUB_LABEL=" ${YLW}[STUB]${RST}"

  printf "${BOLD}[%3d]${RST} ${STATUS_CLR}${BOLD}%s${RST}%s  ${DIM}%s${RST}\n" \
    "$TOTAL" "$STATUS ($SCORE/8)" "$STUB_LABEL" "$REL_PATH" | tee -a "$REPORT"

  # Holat satrini bitta birga yig'ib chiqarish
  STATE_LINE="      qator: ${DIM}$LINES${RST} (kod: $CODE_LINES)  "
  [ "$LOADING" = "1" ] && STATE_LINE="${STATE_LINE}${GRN}+load${RST} " || STATE_LINE="${STATE_LINE}${RED}-load${RST} "
  [ "$ERROR" = "1" ]   && STATE_LINE="${STATE_LINE}${GRN}+error${RST} " || STATE_LINE="${STATE_LINE}${RED}-error${RST} "
  [ "$EMPTY" = "1" ]   && STATE_LINE="${STATE_LINE}${GRN}+empty${RST} " || STATE_LINE="${STATE_LINE}${YLW}-empty${RST} "
  [ "$I18N" = "1" ]    && STATE_LINE="${STATE_LINE}${GRN}+i18n${RST}" || STATE_LINE="${STATE_LINE}${YLW}-i18n${RST}"
  echo -e "$STATE_LINE" | tee -a "$REPORT"

  if [ ${#URLS[@]} -gt 0 ]; then
    for r in "${PAGE_API[@]}"; do
      if [[ "$r" == OK* ]]; then
        printf "      ${GRN}->${RST} %s\n" "$r" | tee -a "$REPORT"
      elif [[ "$r" == AUTH* ]]; then
        printf "      ${CYN}->${RST} %s\n" "$r" | tee -a "$REPORT"
      elif [[ "$r" == OFFLINE* ]]; then
        printf "      ${DIM}->${RST} %s\n" "$r" | tee -a "$REPORT"
      else
        printf "      ${RED}->${RST} %s\n" "$r" | tee -a "$REPORT"
      fi
    done
  fi
done < <(find_pages)

# ---- Yakuniy hisobot ----
echo "" | tee -a "$REPORT"
echo "===============================================" | tee -a "$REPORT"
echo "  YAKUNIY NATIJA — $TOTAL sahifa" | tee -a "$REPORT"
echo "===============================================" | tee -a "$REPORT"
printf "  ${GRN}OK (>=7/8):     %3d ta${RST}\n" "$PERFECT" | tee -a "$REPORT"
printf "  ${YLW}PARTIAL (4-6):  %3d ta${RST}\n" "$PARTIAL" | tee -a "$REPORT"
printf "  ${RED}BROKEN (<4):    %3d ta${RST}\n" "$BROKEN" | tee -a "$REPORT"
printf "  ${YLW}STUB sahifalar: %3d ta${RST}\n" "$STUBS" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "  Loading state:    $HAS_LOADING / $TOTAL" | tee -a "$REPORT"
echo "  Error state:      $HAS_ERROR / $TOTAL" | tee -a "$REPORT"
echo "  Empty state:      $HAS_EMPTY / $TOTAL" | tee -a "$REPORT"
echo "  i18n:             $HAS_I18N / $TOTAL" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "  API chaqiriqlar:  $TOTAL_API ta" | tee -a "$REPORT"
if [ "$BACKEND_OK" = "1" ]; then
  echo "    Ishlaydi:       $OK_API" | tee -a "$REPORT"
  echo "    Xato:           $FAIL_API" | tee -a "$REPORT"
else
  echo "    ${YLW}Backend OFFLINE — testlar o'tkazib yuborildi${RST}" | tee -a "$REPORT"
fi
echo "" | tee -a "$REPORT"

if [ ${#FAIL_ENDPOINTS[@]} -gt 0 ]; then
  echo "  ENG MUAMMOLI ENDPOINT'LAR:" | tee -a "$REPORT"
  for url in "${!FAIL_ENDPOINTS[@]}"; do
    printf "    ${RED}[%s]${RST} %s\n" "${FAIL_ENDPOINTS[$url]}" "$url" | tee -a "$REPORT"
  done | head -20
  echo "" | tee -a "$REPORT"
fi

echo "  Hisobot: $REPORT" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

if [ "$STUBS" -gt 50 ]; then
  echo "${YLW}MUHIM:${RST} $STUBS ta STUB sahifa bor" | tee -a "$REPORT"
  echo "Stub'larni alohida ko'rish: bash scripts/diagnostic.sh --stubs-only" | tee -a "$REPORT"
fi
if [ "$BACKEND_OK" = "0" ]; then
  echo "${YLW}MUHIM:${RST} Backend OFFLINE — API tekshiruvi uchun:" | tee -a "$REPORT"
  echo "   pnpm --filter @europrint/api run dev:unsafe &" | tee -a "$REPORT"
  echo "   sleep 25 && bash scripts/diagnostic.sh" | tee -a "$REPORT"
fi
