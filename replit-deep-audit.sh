#!/usr/bin/env bash
# ============================================================================
# EuroPrint ERP — REPLIT CHUQUR TAHLIL v4
# Replit shell uchun to'liq audit (kod + DB + runtime + xavfsizlik)
#
# Foydalanish:
#   chmod +x replit-deep-audit.sh
#   bash replit-deep-audit.sh
#
# Yoki to'g'ridan-to'g'ri:
#   bash replit-deep-audit.sh
# ============================================================================

set +e

# ---- Sozlamalar (.env'dan o'qish) ----
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env 2>/dev/null
  set +a
fi
if [ -f apps/api/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source apps/api/.env 2>/dev/null
  set +a
fi

ROOT="${PROJECT_ROOT:-$(pwd)}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/europrint}"
API_URL="${API_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@europrint.uz}"
ADMIN_PASS="${ADMIN_SEED_PASSWORD:-${ADMIN_PASS:-Admin123!}}"

# Loyiha yo'lini avto-aniqlash
detect_path() {
  local found
  for p in "$@"; do
    if [ -d "$ROOT/$p" ]; then
      echo "$ROOT/$p"
      return 0
    fi
  done
  echo ""
}

BACKEND=$(detect_path "apps/api/src" "backend/src" "server/src")
FRONTEND=$(detect_path "apps/web/src" "apps/erp-dashboard/src" "artifacts/erp-dashboard/src" "frontend/src" "client/src")
DB_DIR=$(detect_path "lib/db" "apps/api/src/db" "packages/db")

REPORT="$ROOT/deep-audit-$(date +%Y%m%d-%H%M%S).txt"
PASS=0; FAIL=0; WARN=0; INFO_=0

# ---- Ranglar ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ---- Yordamchi funksiyalar ----
header() {
  echo -e "\n${BOLD}${CYAN}====================================================${RESET}" | tee -a "$REPORT"
  echo -e "${BOLD}${CYAN}  $1${RESET}" | tee -a "$REPORT"
  echo -e "${BOLD}${CYAN}====================================================${RESET}" | tee -a "$REPORT"
}
ok()     { echo -e "  ${GREEN}OK${RESET}    $1" | tee -a "$REPORT"; PASS=$((PASS+1)); }
fail()   { echo -e "  ${RED}FAIL${RESET}  $1" | tee -a "$REPORT"; FAIL=$((FAIL+1)); }
warn()   { echo -e "  ${YELLOW}WARN${RESET}  $1" | tee -a "$REPORT"; WARN=$((WARN+1)); }
info()   { echo -e "  ${CYAN}INFO${RESET}  $1" | tee -a "$REPORT"; INFO_=$((INFO_+1)); }
detail() { echo -e "        ${YELLOW}-> $1${RESET}" | tee -a "$REPORT"; }

have()   { command -v "$1" >/dev/null 2>&1; }
rgrep()  { grep -rn --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist "$1" "$2" 2>/dev/null; }
rcount() { rgrep "$1" "$2" 2>/dev/null | wc -l | tr -d ' \n'; }
rhas()   { rgrep "$1" "$2" 2>/dev/null | grep -q .; }
fcount() { find "$1" -name "$2" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l | tr -d ' \n'; }

psql_q() {
  if have psql && [ -n "$DB_URL" ]; then
    psql "$DB_URL" -tAc "$1" 2>/dev/null | tr -d '[:space:]'
  fi
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null
}

# ============================================================================
echo "EuroPrint Deep Audit v4 — $(date)" | tee "$REPORT"
echo "ROOT:     $ROOT" | tee -a "$REPORT"
echo "BACKEND:  ${BACKEND:-(topilmadi)}" | tee -a "$REPORT"
echo "FRONTEND: ${FRONTEND:-(topilmadi)}" | tee -a "$REPORT"
echo "DB_DIR:   ${DB_DIR:-(topilmadi)}" | tee -a "$REPORT"
echo "DB_URL:   $DB_URL" | tee -a "$REPORT"
echo "API_URL:  $API_URL" | tee -a "$REPORT"
echo "Hisobot:  $REPORT" | tee -a "$REPORT"
# ============================================================================


header "1/15  MUHIT VA VOSITALAR"
have node && ok "node $(node -v)" || fail "node yo'q"
have pnpm && ok "pnpm $(pnpm -v)" || warn "pnpm yo'q"
have psql && ok "psql $(psql --version | awk '{print $3}')" || warn "psql yo'q (DB tekshiruvi cheklanadi)"
have redis-cli && ok "redis-cli mavjud" || warn "redis-cli yo'q"
have curl && ok "curl mavjud" || warn "curl yo'q (endpoint testlari cheklanadi)"
have jq && ok "jq mavjud" || warn "jq yo'q"
have git && ok "git mavjud" || warn "git yo'q"

if [ -f "$ROOT/package.json" ]; then
  ok "package.json topildi (root)"
  WORKSPACE=$(grep -c '"workspaces"' "$ROOT/package.json")
  [ "$WORKSPACE" -gt 0 ] && ok "Monorepo (workspaces)" || info "Single package"
fi


header "2/15  LOYIHA TUZILMASI"
[ -n "$BACKEND" ]  && ok "Backend: $BACKEND"   || fail "Backend papkasi topilmadi"
[ -n "$FRONTEND" ] && ok "Frontend: $FRONTEND" || warn "Frontend papkasi topilmadi"
[ -n "$DB_DIR" ]   && ok "DB papka: $DB_DIR"   || warn "DB papka topilmadi"

if [ -n "$BACKEND" ]; then
  TOTAL_TS=$(fcount "$BACKEND" "*.ts")
  info "Backend .ts fayllar: $TOTAL_TS"
  MOD_COUNT=$(find "$BACKEND/modules" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' \n')
  info "Backend modullar: $MOD_COUNT"
  [ "$MOD_COUNT" -gt 10 ] && ok "Modullar yetarli ($MOD_COUNT)" || warn "Modullar kam ($MOD_COUNT)"
fi


header "3/15  DATABASE — ULANISH VA ASOSIY HOLAT"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  ok "PostgreSQL ulanish ishlaydi"
  PG_VER=$(psql_q "SHOW server_version")
  ok "Server versiya: $PG_VER"
  DB_NAME=$(psql_q "SELECT current_database()")
  ok "DB nomi: $DB_NAME"
  TBL_CNT=$(psql_q "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
  IDX_CNT=$(psql_q "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'")
  TRG_CNT=$(psql_q "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema='public'")
  FK_CNT=$(psql_q "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY'")
  info "Jadvallar: $TBL_CNT  |  Indekslar: $IDX_CNT  |  Triggerlar: $TRG_CNT  |  FK: $FK_CNT"
  [ "$TBL_CNT" -gt 50 ]  && ok "Jadvallar boy ($TBL_CNT)"   || warn "Jadvallar kam ($TBL_CNT)"
  [ "$IDX_CNT" -gt 30 ]  && ok "Indekslar yetarli ($IDX_CNT)" || warn "Indekslar kam ($IDX_CNT)"
  [ "$TRG_CNT" -gt 0 ]   && ok "Triggerlar bor ($TRG_CNT)"  || warn "Triggerlar yo'q (invariantlar himoyasiz)"
  [ "$FK_CNT" -gt 10 ]   && ok "Foreign keys bor ($FK_CNT)" || warn "FK kam ($FK_CNT)"
else
  fail "DB ga ulana olmadi: $DB_URL"
fi


header "4/15  DATABASE — KRITIK JADVALLAR"
TABLES=(
  users employees positions org_departments
  sd_orders sd_invoices sd_customers sd_contracts sales_orders
  pp_orders pp_routing pp_work_centers
  mes_sessions mes_operations
  wms_stock wms_warehouses wms_inventory
  qc_inspections qc_defects
  hr_v2_documents hr_v2_daily_reports
  crm_leads crm_deals crm_contacts crm_companies
  finance_invoices finance_payments fi_gl_documents
  mm_materials mm_purchase_orders mm_vendors
  iot_devices iot_alerts
  marketing_campaigns
  kanban_boards kanban_cards
  notifications cron_status
  discipline_records adaptation_programs
)
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  MISSING=0
  for t in "${TABLES[@]}"; do
    if [ "$(psql_q "SELECT 1 FROM information_schema.tables WHERE table_name='$t' LIMIT 1")" = "1" ]; then
      ok "$t"
    else
      fail "$t — yo'q"
      MISSING=$((MISSING+1))
    fi
  done
  [ "$MISSING" -eq 0 ] && ok "Barcha kritik jadvallar mavjud" || warn "$MISSING ta jadval yetishmaydi"
fi


header "5/15  DATABASE — KRITIK USTUNLAR"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  check_col() {
    local table=$1 col=$2
    local exists
    exists=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='$table' AND column_name='$col' LIMIT 1")
    [ "$exists" = "1" ] && ok "$table.$col" || fail "$table.$col yo'q"
  }
  check_col users id
  check_col users email
  check_col users password_hash
  check_col users role
  check_col users full_name
  check_col users deleted_at
  check_col employees id
  check_col employees full_name
  check_col employees status
  check_col employees department_id
  check_col org_departments parent_id
  check_col sd_orders status
  check_col crm_companies title
  check_col crm_companies date_create
fi


header "6/15  DATABASE — SEED DATA"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  ADMIN=$(psql_q "SELECT COUNT(*) FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL")
  [ "$ADMIN" -gt 0 ] && ok "Admin user bor ($ADMIN)" || fail "Admin user yo'q"

  EMP=$(psql_q "SELECT COUNT(*) FROM employees")
  [ "$EMP" -gt 0 ] && ok "Xodimlar: $EMP" || warn "Xodimlar yo'q"

  DEPT=$(psql_q "SELECT COUNT(*) FROM org_departments WHERE is_active=true")
  [ "$DEPT" -gt 0 ] && ok "Aktiv bo'limlar: $DEPT" || warn "Bo'limlar yo'q"
fi


header "7/15  SERVICE QATLAMI — KOD TAHLIL"
if [ -n "$BACKEND" ]; then
  SVC_COUNT=$(fcount "$BACKEND" "*.service.ts")
  info "Service fayllar: $SVC_COUNT"
  [ "$SVC_COUNT" -gt 50 ] && ok "Service'lar yetarli ($SVC_COUNT)" || warn "Service'lar kam ($SVC_COUNT)"

  STUB=0
  while IFS= read -r f; do
    L=$(wc -l < "$f" 2>/dev/null || echo 0)
    [ "$L" -lt 20 ] && STUB=$((STUB+1))
  done < <(find "$BACKEND" -name "*.service.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)
  [ "$STUB" -eq 0 ] && ok "Stub service'lar yo'q" || warn "$STUB ta stub service (<20 qator)"

  TRY_COUNT=$(rcount "try {" "$BACKEND")
  [ "$TRY_COUNT" -gt 50 ] && ok "try/catch yetarli ($TRY_COUNT)" || warn "try/catch kam ($TRY_COUNT)"

  for exc in BadRequestException NotFoundException ForbiddenException UnauthorizedException ConflictException; do
    rhas "$exc" "$BACKEND" && ok "$exc qo'llanilgan" || warn "$exc qo'llanilmagan"
  done

  rhas "OEE\|oee\|efficiency"           "$BACKEND" && ok "OEE hisob-kitob bor"          || warn "OEE topilmadi"
  rhas "salary\|maosh\|calculatePayroll" "$BACKEND" && ok "Maosh hisob-kitob bor"        || warn "Maosh topilmadi"
  rhas "invoice.*total\|calculatePrice" "$BACKEND" && ok "Narx/invoice formula bor"     || warn "Narx formulasi topilmadi"
fi


header "8/15  CONTROLLER QATLAMI — ENDPOINTLAR"
if [ -n "$BACKEND" ]; then
  GET_C=$(rcount "@Get("    "$BACKEND")
  POST_C=$(rcount "@Post("   "$BACKEND")
  PATCH_C=$(rcount "@Patch(" "$BACKEND")
  PUT_C=$(rcount "@Put("    "$BACKEND")
  DEL_C=$(rcount "@Delete(" "$BACKEND")
  TOTAL_EP=$((GET_C + POST_C + PATCH_C + PUT_C + DEL_C))
  info "GET=$GET_C  POST=$POST_C  PATCH=$PATCH_C  PUT=$PUT_C  DELETE=$DEL_C"
  [ "$TOTAL_EP" -gt 100 ] && ok "Endpointlar yetarli ($TOTAL_EP)" || warn "Endpointlar kam ($TOTAL_EP)"

  UNGUARDED=0
  while IFS= read -r f; do
    if ! grep -q "@UseGuards\|@Public()" "$f" 2>/dev/null; then
      SHORT=$(echo "$f" | sed "s|$BACKEND/||")
      if echo "$SHORT" | grep -qvE "auth\.controller|public\.controller|webhook"; then
        UNGUARDED=$((UNGUARDED+1))
      fi
    fi
  done < <(find "$BACKEND" -name "*.controller.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)
  [ "$UNGUARDED" -eq 0 ] && ok "Barcha biznes controller himoyalangan" || warn "Himoyasiz controller: $UNGUARDED"

  APIRESP=$(rcount "@ApiResponse\|@ApiOkResponse\|@ApiCreatedResponse" "$BACKEND")
  [ "$APIRESP" -gt 50 ] && ok "API hujjatlash yetarli ($APIRESP)" || warn "API hujjatlash kam ($APIRESP)"

  DTO_COUNT=$(fcount "$BACKEND" "*.dto.ts")
  ZOD_DTO=$(rcount "createZodDto" "$BACKEND")
  info "DTO fayllar: $DTO_COUNT  |  createZodDto: $ZOD_DTO"
  [ "$ZOD_DTO" -gt 0 ] && ok "Zod DTO ishlatilgan" || warn "Zod DTO topilmadi"
fi


header "9/15  AUTH — JWT, ROLLAR, GUARD"
if [ -n "$BACKEND" ]; then
  JWT_FILE=$(find "$BACKEND" -name "jwt.strategy.ts" -o -name "jwt-auth.guard.ts" 2>/dev/null | head -1)
  if [ -n "$JWT_FILE" ]; then
    ok "JWT fayl: $(echo $JWT_FILE | sed "s|$BACKEND/||")"
    grep -q "userId\|sub\|payload" "$JWT_FILE" 2>/dev/null && ok "JWT payload validate to'g'ri" || warn "JWT payload aniq emas"
  else
    fail "JWT strategy/guard topilmadi"
  fi

  ROLES_COUNT=$(rcount "@Roles\|RolesGuard" "$BACKEND")
  [ "$ROLES_COUNT" -gt 5 ] && ok "@Roles qo'llanilgan ($ROLES_COUNT)" || warn "@Roles kam ($ROLES_COUNT)"

  rhas "bcrypt\|argon2\|hashPassword" "$BACKEND" && ok "Password hashing bor" || fail "Password hashing yo'q"
  rhas "refreshToken\|refresh_token"  "$BACKEND" && ok "Refresh token bor"   || warn "Refresh token yo'q"
  rhas "@Public()\|IS_PUBLIC_KEY"     "$BACKEND" && ok "@Public() dekorator bor" || warn "@Public() yo'q"
fi


header "10/15  FRONTEND — KOMPONENT VA SAHIFALAR"
if [ -n "$FRONTEND" ]; then
  TSX_COUNT=$(fcount "$FRONTEND" "*.tsx")
  TS_COUNT=$(fcount "$FRONTEND" "*.ts")
  info "TSX: $TSX_COUNT  |  TS: $TS_COUNT"
  [ "$TSX_COUNT" -gt 50 ] && ok "Komponentlar yetarli ($TSX_COUNT)" || warn "Komponentlar kam ($TSX_COUNT)"

  STUB_TSX=0
  while IFS= read -r f; do
    L=$(wc -l < "$f" 2>/dev/null || echo 0)
    [ "$L" -lt 10 ] && STUB_TSX=$((STUB_TSX+1))
  done < <(find "$FRONTEND" -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null)
  [ "$STUB_TSX" -eq 0 ] && ok "Stub TSX yo'q" || warn "$STUB_TSX ta stub TSX"

  rhas "useQuery\|useMutation\|@tanstack/react-query" "$FRONTEND" && ok "React Query qo'llanilgan" || warn "React Query yo'q"
  rhas "zodResolver\|@hookform/resolvers/zod" "$FRONTEND" && ok "Zod form validation bor" || warn "Zod form yo'q"
  rhas "catch\|onError\|isError" "$FRONTEND" && ok "API xatolik handling bor" || fail "Xatolik handling yo'q"
  rhas "Skeleton\|skeleton" "$FRONTEND" && ok "Skeleton loading bor" || warn "Skeleton yo'q"
  rhas "ErrorBoundary" "$FRONTEND" && ok "ErrorBoundary bor" || warn "ErrorBoundary yo'q"
  rhas "import\.meta\.env\|VITE_" "$FRONTEND" && ok "Env vars qo'llanilgan" || warn "Env vars topilmadi"
fi


header "11/15  ROUTING VA LAZY LOAD"
if [ -n "$FRONTEND" ]; then
  if rhas "@tanstack/router\|createRoute" "$FRONTEND"; then
    ok "TanStack Router"
    ROUTES=$(rcount "createRoute\|createFileRoute" "$FRONTEND")
    info "Route ta'riflari: $ROUTES"
  elif rhas "react-router-dom\|createBrowserRouter" "$FRONTEND"; then
    ok "react-router-dom"
    ROUTES=$(rcount "<Route\|path:" "$FRONTEND")
    info "Route ta'riflari: $ROUTES"
  else
    fail "Router topilmadi"
  fi
  rhas "NotFound\|404" "$FRONTEND" && ok "404 sahifasi bor" || warn "404 yo'q"
  LAZY_C=$(rcount "React\.lazy\|lazy(\|Suspense" "$FRONTEND")
  [ "$LAZY_C" -gt 5 ] && ok "Lazy load yetarli ($LAZY_C)" || warn "Lazy load kam ($LAZY_C)"
fi


header "12/15  i18n — TARJIMALAR"
if [ -n "$FRONTEND" ]; then
  for lang in uz ru en; do
    LFILE=$(find "$ROOT" -name "${lang}.json" -not -path "*/node_modules/*" 2>/dev/null | head -1)
    if [ -n "$LFILE" ]; then
      KEYS=$(grep -c "\":" "$LFILE" 2>/dev/null || echo 0)
      ok "$lang.json: $KEYS kalit"
    else
      LFILE=$(find "$ROOT" -name "${lang}.ts" -not -path "*/node_modules/*" 2>/dev/null | head -1)
      [ -n "$LFILE" ] && ok "$lang.ts mavjud" || warn "$lang tarjima yo'q"
    fi
  done
  rhas "i18next\|useTranslation\|useIntl" "$FRONTEND" && ok "i18n hooks qo'llanilgan" || warn "i18n hook yo'q"
fi


header "13/15  XAVFSIZLIK — SQL INJECTION, SECRETS, CORS"
if [ -n "$BACKEND" ]; then
  RAW_SQL=$(rgrep "sql\.raw(" "$BACKEND" | grep -v "//\|\.spec\." 2>/dev/null | wc -l | tr -d ' \n')
  [ "$RAW_SQL" -eq 0 ] && ok "sql.raw() yo'q (xavfsiz)" || warn "sql.raw() $RAW_SQL ta — interpolyatsiya tekshiring"

  REAL_LEAK=$(rgrep "console\.log.*password\|logger\.log.*password\|logger\.log.*secret" "$BACKEND" | grep -v "not configured\|missing\|\.spec\." | wc -l | tr -d ' \n')
  [ "$REAL_LEAK" -eq 0 ] && ok "Parol/secret log'da emas" || fail "Parol/secret log'da: $REAL_LEAK ta"

  rhas "helmet\|@fastify/helmet" "$BACKEND" && ok "Helmet bor" || warn "Helmet yo'q"
  rhas "enableCors\|CORS_ORIGINS\|allowedOrigins" "$BACKEND" && ok "CORS sozlangan" || fail "CORS yo'q"
  rhas "ValidationPipe\|ZodValidationPipe" "$BACKEND" && ok "ValidationPipe bor" || fail "ValidationPipe yo'q"
  rhas "rateLimit\|throttle\|Throttler" "$BACKEND" && ok "Rate limit bor" || warn "Rate limit yo'q"
  rhas "csrf\|csurf" "$BACKEND" && ok "CSRF bor" || warn "CSRF yo'q (JWT bo'lsa OK)"
fi

# .env tekshiruvi
[ -f "$ROOT/.env" ] && ok ".env mavjud" || warn ".env yo'q"
[ -f "$ROOT/.env.example" ] && ok ".env.example mavjud" || warn ".env.example yo'q"
[ -f "$ROOT/apps/api/.env" ] && ok "apps/api/.env mavjud" || info "apps/api/.env yo'q"


header "14/15  RUNTIME — BACKEND VA ENDPOINTLAR"
HEALTH=$(http_code "$API_URL/api/auth/health")
case "$HEALTH" in
  200|201) ok "Backend tirik (/api/auth/health)" ;;
  000)     fail "Backend yoqilmagan ($API_URL javob bermayapti)" ;;
  *)       warn "Health code: $HEALTH" ;;
esac

if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "201" ]; then
  LOGIN_RESP=$(curl -s --max-time 5 -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null)
  LOGIN_CODE=$(http_code -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
  if [ "$LOGIN_CODE" = "200" ] || [ "$LOGIN_CODE" = "201" ]; then
    ok "Login muvaffaqiyatli ($LOGIN_CODE)"
    if have jq; then
      TOKEN=$(echo "$LOGIN_RESP" | jq -r '.access_token // .token // .data.token // empty' 2>/dev/null)
    else
      TOKEN=$(echo "$LOGIN_RESP" | grep -oE '"(access_)?token":"[^"]+"' | head -1 | cut -d'"' -f4)
    fi
    [ -n "$TOKEN" ] && ok "JWT token olindi" || warn "Token javobda yo'q"
  else
    fail "Login muvaffaqiyatsiz: $LOGIN_CODE"
    detail "Javob: $(echo "$LOGIN_RESP" | head -c 200)"
    TOKEN=""
  fi

  ENDPOINTS=(
    "GET|/api/auth/me|Joriy user"
    "GET|/api/hr/employees?limit=1|HR xodimlar"
    "GET|/api/hr/dashboard-stats|HR dashboard"
    "GET|/api/hr/birthdays|HR tug'ilgan kunlar"
    "GET|/api/sd/orders?limit=1|Sotuv buyurtmalari"
    "GET|/api/sd/contracts|Shartnomalar"
    "GET|/api/sd/customers?limit=1|Mijozlar"
    "GET|/api/wms/stock?limit=1|Ombor"
    "GET|/api/wms/warehouses|Omborlar"
    "GET|/api/mes/sessions/active|MES sessions"
    "GET|/api/mes/oee|OEE"
    "GET|/api/qc/dashboard|QC"
    "GET|/api/crm/leads?limit=1|CRM leads"
    "GET|/api/crm/companies|CRM kompaniyalar"
    "GET|/api/crm/dashboard|CRM dashboard"
    "GET|/api/finance/dashboard|Moliya"
    "GET|/api/finance/invoices|Schetlar"
    "GET|/api/mm/dashboard|MM"
    "GET|/api/mm/materials?limit=1|Materiallar"
    "GET|/api/iot/dashboard|IoT"
    "GET|/api/director/dashboard|Direktor"
    "GET|/api/notifications/my|Bildirishnomalar"
    "GET|/api/kanban/boards|Kanban"
    "GET|/api/marketing/campaigns|Marketing"
  )

  ENDPOINT_FAIL=0
  for ep in "${ENDPOINTS[@]}"; do
    METHOD=$(echo "$ep" | cut -d'|' -f1)
    PATH_=$(echo "$ep" | cut -d'|' -f2)
    NAME=$(echo "$ep" | cut -d'|' -f3)
    if [ -n "$TOKEN" ]; then
      CODE=$(http_code -X "$METHOD" "$API_URL$PATH_" -H "Authorization: Bearer $TOKEN")
    else
      CODE=$(http_code -X "$METHOD" "$API_URL$PATH_")
    fi
    case "$CODE" in
      200|201|204) ok "[$CODE] $NAME" ;;
      401)         warn "[$CODE] $NAME (auth kerak)" ;;
      404)         warn "[$CODE] $NAME (yo'q)" ;;
      500|502)     fail "[$CODE] $NAME (SERVER XATOSI: $METHOD $PATH_)"; ENDPOINT_FAIL=$((ENDPOINT_FAIL+1)) ;;
      *)           warn "[$CODE] $NAME" ;;
    esac
  done
  echo ""
  [ "$ENDPOINT_FAIL" -eq 0 ] && ok "Hech bir endpoint 500 qaytarmadi" || fail "$ENDPOINT_FAIL endpoint 500 qaytardi"
fi


header "15/15  PERFORMANCE / INFRA"
if [ -n "$BACKEND" ]; then
  rhas "redis\|@InjectRedis\|RedisModule" "$BACKEND" && ok "Redis qo'llanilgan" || warn "Redis yo'q"
  QUEUE_C=$(rcount "@Processor\|@InjectQueue\|BullModule" "$BACKEND")
  [ "$QUEUE_C" -gt 3 ] && ok "BullMQ queue ($QUEUE_C)" || warn "Queue kam ($QUEUE_C)"
  rhas "WebSocketGateway\|@WebSocketGateway" "$BACKEND" && ok "WebSocket gateway bor" || warn "WebSocket yo'q"

  N1=$(rgrep "for.*await.*\.find\|\.map(.*await.*db\." "$BACKEND" | grep -v "//\|\.spec\." | wc -l | tr -d ' \n')
  [ "$N1" -eq 0 ] && ok "N+1 query patterni topilmadi" || warn "N+1 xavfi: $N1 ta joy"

  CACHE_C=$(rcount "@Cache\|cacheable\|CacheInterceptor" "$BACKEND")
  [ "$CACHE_C" -gt 0 ] && ok "Cache qo'llanilgan ($CACHE_C)" || warn "Cache yo'q"
fi


# ============================================================================
header "YAKUNIY NATIJA"
TOTAL=$((PASS + FAIL + WARN))
[ "$TOTAL" -eq 0 ] && TOTAL=1
SCORE=$((PASS * 100 / TOTAL))

echo "" | tee -a "$REPORT"
echo "  PASS:    $PASS" | tee -a "$REPORT"
echo "  FAIL:    $FAIL" | tee -a "$REPORT"
echo "  WARN:    $WARN" | tee -a "$REPORT"
echo "  INFO:    $INFO_" | tee -a "$REPORT"
echo "  Jami:    $TOTAL" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

if   [ "$SCORE" -ge 85 ]; then
  echo -e "  ${GREEN}${BOLD}NATIJA: $SCORE% — MUSTAHKAM${RESET}" | tee -a "$REPORT"
elif [ "$SCORE" -ge 65 ]; then
  echo -e "  ${YELLOW}${BOLD}NATIJA: $SCORE% — YAXSHILASH KERAK${RESET}" | tee -a "$REPORT"
elif [ "$SCORE" -ge 40 ]; then
  echo -e "  ${YELLOW}${BOLD}NATIJA: $SCORE% — JIDDIY MUAMMOLAR${RESET}" | tee -a "$REPORT"
else
  echo -e "  ${RED}${BOLD}NATIJA: $SCORE% — KRITIK${RESET}" | tee -a "$REPORT"
fi

echo "" | tee -a "$REPORT"
echo "  Hisobot: $REPORT" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

# Tavsiyalar
if [ "$FAIL" -gt 0 ] || [ "$WARN" -gt 5 ]; then
  echo -e "${BOLD}${YELLOW}KEYINGI QADAMLAR:${RESET}" | tee -a "$REPORT"
  [ "$HEALTH" != "200" ] && echo "  1) Backend ishga tushiring: pnpm --filter @europrint/api run dev:unsafe" | tee -a "$REPORT"
  [ "$ENDPOINT_FAIL" -gt 0 ] 2>/dev/null && echo "  2) 500 xatolarni tuzatish: backend log'da stack trace ko'ring" | tee -a "$REPORT"
  echo "  3) Schema patchlarni qo'llang: ls fix-schema-FINAL*.sql | xargs -I{} psql \"\$DATABASE_URL\" -f {}" | tee -a "$REPORT"
  echo "  4) Skriptni qaytadan oching: bash replit-deep-audit.sh" | tee -a "$REPORT"
  echo "" | tee -a "$REPORT"
fi

[ "$FAIL" -eq 0 ]
