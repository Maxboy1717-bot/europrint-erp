#!/usr/bin/env bash
# ============================================================================
# EuroPrint — TO'LIQ AUDIT (15 bo'lim + 200+ sahifa)
# Foydalanish:
#   bash scripts/full-audit.sh                    # Hammasi
#   bash scripts/full-audit.sh --no-pages         # Faqat 15 bo'lim
#   bash scripts/full-audit.sh --pages-only       # Faqat sahifalar
#   bash scripts/full-audit.sh --fails-only       # Faqat muammolilar
# ============================================================================

set +e
set +H

if [ -f .env ]; then set -a; source .env 2>/dev/null; set +a; fi
if [ -f apps/api/.env ]; then set -a; source apps/api/.env 2>/dev/null; set +a; fi

ROOT="${PROJECT_ROOT:-$(pwd)}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/europrint}"
API_URL="${API_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@europrint.uz}"
ADMIN_PASS="${ADMIN_SEED_PASSWORD:-${ADMIN_PASS:-Admin123!}}"

# Auto-detect frontend
FRONTEND=""
for p in apps/web/src apps/erp-dashboard/src artifacts/erp-dashboard/src frontend/src client/src; do
  [ -d "$ROOT/$p" ] && FRONTEND="$ROOT/$p" && break
done

BACKEND=""
for p in apps/api/src backend/src server/src; do
  [ -d "$ROOT/$p" ] && BACKEND="$ROOT/$p" && break
done

DB_DIR=""
for p in lib/db apps/api/src/db packages/db; do
  [ -d "$ROOT/$p" ] && DB_DIR="$ROOT/$p" && break
done

PAGES_DIRS=()
[ -n "$FRONTEND" ] && for d in pages routes screens views; do
  [ -d "$FRONTEND/$d" ] && PAGES_DIRS+=("$FRONTEND/$d")
done

REPORT="$ROOT/full-audit-$(date +%Y%m%d-%H%M%S).txt"

# Bayroqlar
NO_PAGES=0; PAGES_ONLY=0; FAILS_ONLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --no-pages)   NO_PAGES=1 ;;
    --pages-only) PAGES_ONLY=1 ;;
    --fails-only) FAILS_ONLY=1 ;;
  esac
  shift
done

# Ranglar
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GRN=$'\033[0;32m'; YLW=$'\033[1;33m'
  CYN=$'\033[0;36m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RST=$'\033[0m'
else
  RED=""; GRN=""; YLW=""; CYN=""; BOLD=""; DIM=""; RST=""
fi

PASS=0; FAIL=0; WARN=0

header() {
  echo "" | tee -a "$REPORT"
  echo "${BOLD}${CYN}===================================================${RST}" | tee -a "$REPORT"
  echo "${BOLD}${CYN}  $1${RST}" | tee -a "$REPORT"
  echo "${BOLD}${CYN}===================================================${RST}" | tee -a "$REPORT"
}
ok()   { echo "  ${GRN}OK${RST}    $1" | tee -a "$REPORT"; PASS=$((PASS+1)); }
fail() { echo "  ${RED}FAIL${RST}  $1" | tee -a "$REPORT"; FAIL=$((FAIL+1)); }
warn() { echo "  ${YLW}WARN${RST}  $1" | tee -a "$REPORT"; WARN=$((WARN+1)); }
info() { echo "  ${CYN}INFO${RST}  $1" | tee -a "$REPORT"; }

have() { command -v "$1" >/dev/null 2>&1; }
rgrep() { grep -rn --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist "$1" "$2" 2>/dev/null; }
rcount() { rgrep "$1" "$2" 2>/dev/null | wc -l | tr -d ' \n'; }
rhas()   { rgrep "$1" "$2" 2>/dev/null | grep -q .; }
fcount() { find "$1" -name "$2" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l | tr -d ' \n'; }

psql_q() {
  have psql && [ -n "$DB_URL" ] && psql "$DB_URL" -tAc "$1" 2>/dev/null | tr -d '[:space:]'
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null
}

# === Boshlanish ===
echo "EuroPrint TO'LIQ AUDIT — $(date)" | tee "$REPORT"
echo "ROOT:     $ROOT" | tee -a "$REPORT"
echo "BACKEND:  ${BACKEND:-yo'q}" | tee -a "$REPORT"
echo "FRONTEND: ${FRONTEND:-yo'q}" | tee -a "$REPORT"
echo "DB:       $DB_URL" | tee -a "$REPORT"
echo "API:      $API_URL" | tee -a "$REPORT"

# Backend tirikmi?
BACKEND_OK=0
H=$(http_code "$API_URL/api/auth/health")
[ "$H" = "200" ] || [ "$H" = "201" ] && BACKEND_OK=1

if [ "$PAGES_ONLY" = "1" ]; then
  goto_pages=1
else
  goto_pages=0
fi

# ============================================================================
# 1-15 BO'LIM (faqat --pages-only emas)
# ============================================================================
if [ "$PAGES_ONLY" != "1" ]; then

header "1/15  MUHIT VA VOSITALAR"
have node && ok "node $(node -v)" || fail "node yo'q"
have pnpm && ok "pnpm $(pnpm -v)" || warn "pnpm yo'q"
have psql && ok "psql $(psql --version | awk '{print $3}')" || warn "psql yo'q"
have redis-cli && ok "redis-cli mavjud" || warn "redis-cli yo'q"
have curl && ok "curl mavjud" || fail "curl yo'q"
have jq && ok "jq mavjud" || warn "jq yo'q"
have git && ok "git mavjud" || warn "git yo'q"

header "2/15  LOYIHA TUZILMASI"
[ -n "$BACKEND" ]  && ok "Backend: $BACKEND"   || fail "Backend yo'q"
[ -n "$FRONTEND" ] && ok "Frontend: $FRONTEND" || warn "Frontend yo'q"
[ -n "$DB_DIR" ]   && ok "DB papka: $DB_DIR"   || warn "DB papka yo'q"
[ -n "$BACKEND" ] && {
  TS=$(fcount "$BACKEND" "*.ts")
  M=$(find "$BACKEND/modules" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  info "Backend .ts: $TS  Modullar: $M"
  [ "$M" -gt 10 ] && ok "Modullar yetarli ($M)" || warn "Modullar kam ($M)"
}

header "3/15  DATABASE ULANISH"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  ok "PostgreSQL ulanish"
  PV=$(psql_q "SHOW server_version")
  DN=$(psql_q "SELECT current_database()")
  TC=$(psql_q "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
  IC=$(psql_q "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'")
  TG=$(psql_q "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema='public'")
  FK=$(psql_q "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY'")
  info "Versiya: $PV | DB: $DN"
  info "Jadvallar: $TC | Indekslar: $IC | Triggerlar: $TG | FK: $FK"
  [ "${TC:-0}" -gt 50 ] && ok "Jadvallar boy" || warn "Jadvallar kam"
else
  fail "DB'ga ulana olmadi"
fi

header "4/15  KRITIK JADVALLAR"
TABLES="users employees positions org_departments sd_orders sd_invoices sd_customers sd_contracts sales_orders pp_orders pp_routing pp_work_centers mes_sessions mes_operations wms_stock wms_warehouses wms_inventory qc_inspections qc_defects hr_v2_documents hr_v2_daily_reports crm_leads crm_deals crm_contacts crm_companies finance_invoices finance_payments fi_gl_documents mm_materials mm_purchase_orders mm_vendors iot_devices iot_alerts marketing_campaigns kanban_boards kanban_cards notifications cron_status discipline_records adaptation_programs"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  M=0; for t in $TABLES; do
    [ "$(psql_q "SELECT 1 FROM information_schema.tables WHERE table_name='$t' LIMIT 1")" = "1" ] && ok "$t" || { fail "$t — yo'q"; M=$((M+1)); }
  done
  [ "$M" -eq 0 ] && ok "Barcha jadvallar bor" || warn "$M ta yetishmaydi"
fi

header "5/15  KRITIK USTUNLAR"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  cc() {
    [ "$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='$1' AND column_name='$2' LIMIT 1")" = "1" ] && ok "$1.$2" || fail "$1.$2 yo'q"
  }
  for col in id email password_hash role full_name deleted_at; do cc users $col; done
  for col in id full_name status department_id; do cc employees $col; done
  cc org_departments parent_id
  cc sd_orders status
  cc crm_companies title
  cc crm_companies date_create
fi

header "6/15  SEED DATA"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  A=$(psql_q "SELECT COUNT(*) FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL")
  [ "${A:-0}" -gt 0 ] && ok "Admin user: $A" || fail "Admin yo'q"
  E=$(psql_q "SELECT COUNT(*) FROM employees")
  ok "Xodimlar: ${E:-0}"
  D=$(psql_q "SELECT COUNT(*) FROM org_departments WHERE is_active=true")
  ok "Bo'limlar: ${D:-0}"
fi

header "7/15  SERVICE QATLAMI"
if [ -n "$BACKEND" ]; then
  S=$(fcount "$BACKEND" "*.service.ts")
  info "Service fayllar: $S"
  [ "$S" -gt 50 ] && ok "Service'lar yetarli" || warn "Service'lar kam"
  T=$(rcount "try {" "$BACKEND")
  [ "$T" -gt 50 ] && ok "try/catch ($T)" || warn "try/catch kam ($T)"
  for E in BadRequestException NotFoundException ForbiddenException UnauthorizedException ConflictException; do
    rhas "$E" "$BACKEND" && ok "$E" || warn "$E yo'q"
  done
fi

header "8/15  CONTROLLER QATLAMI"
if [ -n "$BACKEND" ]; then
  G=$(rcount "@Get(" "$BACKEND")
  P=$(rcount "@Post(" "$BACKEND")
  PC=$(rcount "@Patch(" "$BACKEND")
  D=$(rcount "@Delete(" "$BACKEND")
  TT=$((G+P+PC+D))
  info "GET=$G POST=$P PATCH=$PC DELETE=$D = $TT"
  [ "$TT" -gt 100 ] && ok "Endpointlar yetarli ($TT)" || warn "Endpointlar kam"
  Z=$(rcount "createZodDto" "$BACKEND")
  [ "$Z" -gt 0 ] && ok "Zod DTO ($Z)" || warn "Zod DTO yo'q"
fi

header "9/15  AUTH"
if [ -n "$BACKEND" ]; then
  J=$(find "$BACKEND" -name "jwt*.ts" 2>/dev/null | head -1)
  [ -n "$J" ] && ok "JWT: $(echo $J | sed "s|$BACKEND/||")" || fail "JWT yo'q"
  rhas "@Roles\|RolesGuard" "$BACKEND" && ok "Roles" || warn "Roles yo'q"
  rhas "bcrypt\|argon2" "$BACKEND" && ok "Password hashing" || fail "Hashing yo'q"
  rhas "refreshToken" "$BACKEND" && ok "Refresh token" || warn "Refresh yo'q"
  rhas "@Public()" "$BACKEND" && ok "@Public()" || warn "@Public yo'q"
fi

header "10/15  FRONTEND"
if [ -n "$FRONTEND" ]; then
  TX=$(fcount "$FRONTEND" "*.tsx")
  info "TSX: $TX"
  rhas "useQuery\|useMutation" "$FRONTEND" && ok "React Query" || warn "RQ yo'q"
  rhas "zodResolver" "$FRONTEND" && ok "Zod form" || warn "Zod form yo'q"
  rhas "Skeleton" "$FRONTEND" && ok "Skeleton" || warn "Skeleton yo'q"
  rhas "ErrorBoundary" "$FRONTEND" && ok "ErrorBoundary" || warn "ErrorBoundary yo'q"
fi

header "11/15  ROUTING"
if [ -n "$FRONTEND" ]; then
  if rhas "@tanstack/router\|createRoute" "$FRONTEND"; then
    ok "TanStack Router"
  elif rhas "react-router-dom" "$FRONTEND"; then
    ok "react-router-dom"
  else
    fail "Router yo'q"
  fi
  rhas "NotFound\|404" "$FRONTEND" && ok "404 sahifa" || warn "404 yo'q"
  L=$(rcount "lazy(\|Suspense" "$FRONTEND")
  [ "$L" -gt 5 ] && ok "Lazy ($L)" || warn "Lazy kam"
fi

header "12/15  i18n"
if [ -n "$FRONTEND" ]; then
  for lang in uz ru en; do
    F=$(find "$ROOT" -name "${lang}.json" -not -path "*/node_modules/*" 2>/dev/null | head -1)
    if [ -n "$F" ]; then
      K=$(grep -c '":' "$F" 2>/dev/null)
      ok "$lang.json: ${K:-0} kalit"
    else
      warn "$lang yo'q"
    fi
  done
  IC=$(rcount "useTranslation\|useIntl" "$FRONTEND")
  TX=$(fcount "$FRONTEND" "*.tsx")
  if [ "$IC" -gt 0 ] && [ "$TX" -gt 0 ]; then
    PCT=$((IC * 100 / TX))
    if [ "$PCT" -gt 60 ]; then
      ok "i18n qoplash: ${PCT}% (${IC}/${TX} fayl)"
    else
      warn "i18n qoplash past: ${PCT}% (${IC}/${TX} fayl)"
    fi
  fi
fi

header "13/15  XAVFSIZLIK"
if [ -n "$BACKEND" ]; then
  R=$(rgrep "sql\.raw(" "$BACKEND" | grep -v "//\|\.spec\." | wc -l | tr -d ' ')
  [ "$R" -eq 0 ] && ok "sql.raw() yo'q" || warn "sql.raw() $R ta"
  rhas "helmet" "$BACKEND" && ok "Helmet" || warn "Helmet yo'q"
  rhas "enableCors\|allowedOrigins" "$BACKEND" && ok "CORS" || fail "CORS yo'q"
  rhas "ValidationPipe" "$BACKEND" && ok "ValidationPipe" || fail "ValidationPipe yo'q"
  rhas "throttle\|Throttler" "$BACKEND" && ok "Rate limit" || warn "Rate limit yo'q"
fi
[ -f "$ROOT/.env" ] && ok ".env" || warn ".env yo'q"

header "14/15  RUNTIME ENDPOINTLAR"
if [ "$BACKEND_OK" = "1" ]; then
  ok "Backend tirik (/api/auth/health)"
  LR=$(curl -s --max-time 5 -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null)
  LC=$(http_code -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
  if [ "$LC" = "200" ] || [ "$LC" = "201" ]; then
    ok "Login muvaffaqiyatli"
    if have jq; then
      TOKEN=$(echo "$LR" | jq -r '.access_token // .token // .data.token // empty' 2>/dev/null)
    else
      TOKEN=$(echo "$LR" | grep -oE '"(access_)?token":"[^"]+"' | head -1 | cut -d'"' -f4)
    fi
  else
    fail "Login: HTTP $LC"
    TOKEN=""
  fi

  EPS="GET|/api/auth/me|me
GET|/api/hr/employees?limit=1|HR xodimlar
GET|/api/hr/dashboard-stats|HR dashboard
GET|/api/sd/orders?limit=1|Buyurtmalar
GET|/api/sd/contracts|Shartnomalar
GET|/api/wms/stock?limit=1|Ombor
GET|/api/mes/sessions/active|MES
GET|/api/qc/dashboard|QC
GET|/api/crm/leads?limit=1|CRM leads
GET|/api/crm/companies|CRM companies
GET|/api/finance/dashboard|Moliya
GET|/api/mm/dashboard|MM
GET|/api/iot/dashboard|IoT
GET|/api/director/dashboard|Direktor"

  EF=0
  while IFS='|' read -r M P N; do
    [ -z "$M" ] && continue
    if [ -n "$TOKEN" ]; then
      C=$(http_code -X "$M" "$API_URL$P" -H "Authorization: Bearer $TOKEN")
    else
      C=$(http_code -X "$M" "$API_URL$P")
    fi
    case "$C" in
      200|201|204) ok "[$C] $N" ;;
      401|403)     warn "[$C] $N (auth)" ;;
      404)         warn "[$C] $N (yo'q)" ;;
      500|502)     fail "[$C] $N — 500"; EF=$((EF+1)) ;;
      *)           warn "[$C] $N" ;;
    esac
  done <<< "$EPS"
  [ "$EF" -eq 0 ] && ok "500 yo'q" || fail "$EF endpoint 500"
else
  fail "Backend OFFLINE — endpointlar sinov o'tmadi"
fi

header "15/15  PERFORMANCE"
if [ -n "$BACKEND" ]; then
  rhas "redis\|RedisModule" "$BACKEND" && ok "Redis" || warn "Redis yo'q"
  Q=$(rcount "@Processor\|BullModule" "$BACKEND")
  [ "$Q" -gt 3 ] && ok "BullMQ ($Q)" || warn "Queue kam"
  rhas "WebSocketGateway" "$BACKEND" && ok "WebSocket" || warn "WS yo'q"
fi

fi  # PAGES_ONLY emas

# ============================================================================
# 200+ SAHIFA AUDITI (faqat --no-pages emas)
# ============================================================================
if [ "$NO_PAGES" != "1" ] && [ -n "$FRONTEND" ] && [ ${#PAGES_DIRS[@]} -gt 0 ]; then

header "16/16  HAR SAHIFA AUDITI (200+)"

# JWT olish (agar olmagan bo'lsak)
if [ "$BACKEND_OK" = "1" ] && [ -z "$TOKEN" ]; then
  LR=$(curl -s --max-time 5 -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null)
  if have jq; then
    TOKEN=$(echo "$LR" | jq -r '.access_token // .token // .data.token // empty' 2>/dev/null)
  else
    TOKEN=$(echo "$LR" | grep -oE '"(access_)?token":"[^"]+"' | head -1 | cut -d'"' -f4)
  fi
fi

PAGE_TOTAL=0; PAGE_OK=0; PAGE_PART=0; PAGE_BROK=0; PAGE_STUB=0
H_LOAD=0; H_ERR=0; H_EMP=0; H_I18N=0
TOTAL_API=0; OK_API=0; FAIL_API=0
declare -A FAIL_EPS

while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue
  REL=$(echo "$FILE" | sed "s|$FRONTEND/||")
  PAGE_TOTAL=$((PAGE_TOTAL+1))

  LINES=$(grep -c '' "$FILE" 2>/dev/null)
  LINES=${LINES:-0}
  CODE_L=$(grep -cvE '^[[:space:]]*$|^[[:space:]]*//|^[[:space:]]*\*|^[[:space:]]*import |^[[:space:]]*export[[:space:]]+\{|^[[:space:]]*from ' "$FILE" 2>/dev/null)
  CODE_L=${CODE_L:-0}

  IS_STUB=0
  [ "$CODE_L" -lt 15 ] 2>/dev/null && IS_STUB=1
  [ "$LINES" -lt 30 ] 2>/dev/null && IS_STUB=1
  [ "$IS_STUB" = "1" ] && PAGE_STUB=$((PAGE_STUB+1))

  LOAD=0; ERR=0; EMP=0; I18N=0
  grep -qE 'Skeleton|isLoading|isPending|<Spinner|<Loader' "$FILE" 2>/dev/null && LOAD=1
  grep -qE 'isError|onError|catch[[:space:]]*\(|<ErrorState|toast\.error' "$FILE" 2>/dev/null && ERR=1
  grep -qE 'EmptyState|<NoData|<Empty[[:space:]]|length[[:space:]]*===[[:space:]]*0|no.data' "$FILE" 2>/dev/null && EMP=1
  grep -qE 'useTranslation|useIntl' "$FILE" 2>/dev/null && I18N=1

  [ "$LOAD" = "1" ] && H_LOAD=$((H_LOAD+1))
  [ "$ERR" = "1" ]  && H_ERR=$((H_ERR+1))
  [ "$EMP" = "1" ]  && H_EMP=$((H_EMP+1))
  [ "$I18N" = "1" ] && H_I18N=$((H_I18N+1))

  URLS=()
  while IFS= read -r u; do
    [ -n "$u" ] && URLS+=("$u")
  done < <(grep -ohE "(['\"\`])(/api/[a-zA-Z0-9_/\-{}:]+)\1" "$FILE" 2>/dev/null | sed -E "s/['\"\`]//g" | sort -u)

  P_OK=1
  RES=()
  for u in "${URLS[@]}"; do
    TOTAL_API=$((TOTAL_API+1))
    if [ "$BACKEND_OK" = "1" ]; then
      tu=$(echo "$u" | sed 's/{[^}]*}/1/g; s/:[a-zA-Z]*/1/g')
      if [ -n "$TOKEN" ]; then
        c=$(http_code -X GET "$API_URL$tu" -H "Authorization: Bearer $TOKEN")
      else
        c=$(http_code -X GET "$API_URL$tu")
      fi
    else
      c="000"
    fi
    case "$c" in
      200|201|204|304) OK_API=$((OK_API+1)); RES+=("OK $c $u") ;;
      401|403)         OK_API=$((OK_API+1)); RES+=("AUTH $c $u") ;;
      404|500|502)     FAIL_API=$((FAIL_API+1)); RES+=("$c $u"); FAIL_EPS["$u"]="$c"; P_OK=0 ;;
      000)             RES+=("OFFLINE $u") ;;
      *)               RES+=("$c $u") ;;
    esac
  done

  SCORE=0
  [ "$LOAD" = "1" ] && SCORE=$((SCORE+1))
  [ "$ERR" = "1" ]  && SCORE=$((SCORE+1))
  [ "$EMP" = "1" ]  && SCORE=$((SCORE+1))
  [ "$I18N" = "1" ] && SCORE=$((SCORE+1))
  [ "$IS_STUB" = "0" ] && SCORE=$((SCORE+1))
  [ ${#URLS[@]} -gt 0 ] && SCORE=$((SCORE+1))
  if [ "$BACKEND_OK" = "1" ]; then
    [ "$P_OK" = "1" ] && [ ${#URLS[@]} -gt 0 ] && SCORE=$((SCORE+2))
  else
    [ ${#URLS[@]} -gt 0 ] && SCORE=$((SCORE+2))
  fi

  if [ "$SCORE" -ge 7 ]; then
    PAGE_OK=$((PAGE_OK+1)); ST="OK"; SC="$GRN"
  elif [ "$SCORE" -ge 4 ]; then
    PAGE_PART=$((PAGE_PART+1)); ST="PARTIAL"; SC="$YLW"
  else
    PAGE_BROK=$((PAGE_BROK+1)); ST="BROKEN"; SC="$RED"
  fi

  [ "$FAILS_ONLY" = "1" ] && [ "$SCORE" -ge 7 ] && continue

  STUB_LBL=""
  [ "$IS_STUB" = "1" ] && STUB_LBL=" ${YLW}[STUB]${RST}"

  printf "${BOLD}[%3d]${RST} ${SC}%s${RST}%s ${DIM}%s${RST}\n" "$PAGE_TOTAL" "$ST ($SCORE/8)" "$STUB_LBL" "$REL" | tee -a "$REPORT"

  S_LINE="      $LINES qator (kod: $CODE_L)  "
  [ "$LOAD" = "1" ] && S_LINE="${S_LINE}${GRN}+load${RST} " || S_LINE="${S_LINE}${RED}-load${RST} "
  [ "$ERR" = "1" ]  && S_LINE="${S_LINE}${GRN}+err${RST} " || S_LINE="${S_LINE}${RED}-err${RST} "
  [ "$EMP" = "1" ]  && S_LINE="${S_LINE}${GRN}+empty${RST} " || S_LINE="${S_LINE}${YLW}-empty${RST} "
  [ "$I18N" = "1" ] && S_LINE="${S_LINE}${GRN}+i18n${RST}" || S_LINE="${S_LINE}${RED}-i18n${RST}"
  echo -e "$S_LINE" | tee -a "$REPORT"

  for r in "${RES[@]}"; do
    case "$r" in
      OK*)      printf "      ${GRN}->${RST} %s\n" "$r" | tee -a "$REPORT" ;;
      AUTH*)    printf "      ${CYN}->${RST} %s\n" "$r" | tee -a "$REPORT" ;;
      OFFLINE*) printf "      ${DIM}->${RST} %s\n" "$r" | tee -a "$REPORT" ;;
      *)        printf "      ${RED}->${RST} %s\n" "$r" | tee -a "$REPORT" ;;
    esac
  done
done < <(for d in "${PAGES_DIRS[@]}"; do find "$d" -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -name "*.test.tsx" -not -name "*.spec.tsx" 2>/dev/null; done | sort -u)

# Sahifalar yakuni
echo "" | tee -a "$REPORT"
echo "${BOLD}===== SAHIFALAR YAKUNI =====${RST}" | tee -a "$REPORT"
printf "  ${GRN}OK:      %3d${RST}\n" "$PAGE_OK" | tee -a "$REPORT"
printf "  ${YLW}PARTIAL: %3d${RST}\n" "$PAGE_PART" | tee -a "$REPORT"
printf "  ${RED}BROKEN:  %3d${RST}\n" "$PAGE_BROK" | tee -a "$REPORT"
printf "  STUB:    %3d\n" "$PAGE_STUB" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "  Loading: $H_LOAD/$PAGE_TOTAL" | tee -a "$REPORT"
echo "  Error:   $H_ERR/$PAGE_TOTAL" | tee -a "$REPORT"
echo "  Empty:   $H_EMP/$PAGE_TOTAL" | tee -a "$REPORT"
echo "  i18n:    $H_I18N/$PAGE_TOTAL" | tee -a "$REPORT"
echo "  API:     $TOTAL_API ($OK_API ok, $FAIL_API xato)" | tee -a "$REPORT"

if [ ${#FAIL_EPS[@]} -gt 0 ]; then
  echo "" | tee -a "$REPORT"
  echo "${BOLD}MUAMMOLI ENDPOINTLAR:${RST}" | tee -a "$REPORT"
  for u in "${!FAIL_EPS[@]}"; do
    printf "  ${RED}[%s]${RST} %s\n" "${FAIL_EPS[$u]}" "$u" | tee -a "$REPORT"
  done | head -30
fi

fi  # NO_PAGES emas

# Yakuniy
header "YAKUNIY NATIJA"
TOTAL=$((PASS + FAIL + WARN))
[ "$TOTAL" -eq 0 ] && TOTAL=1
SCORE=$((PASS * 100 / TOTAL))
echo "  PASS: $PASS  FAIL: $FAIL  WARN: $WARN" | tee -a "$REPORT"
echo "  Backend audit: $SCORE%" | tee -a "$REPORT"
[ -n "$PAGE_TOTAL" ] && echo "  Sahifalar: $PAGE_TOTAL ($PAGE_OK ok, $PAGE_BROK broken)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "  Hisobot: $REPORT" | tee -a "$REPORT"
