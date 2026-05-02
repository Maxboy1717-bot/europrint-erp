#!/usr/bin/env bash
# ============================================================================
# EuroPrint ERP — To'liq diagnostika skripti (12 qatlam)
# Replit shell / Git Bash / Linux'da ishlaydi.
#
# Foydalanish:
#   chmod +x diagnose.sh
#   ./diagnose.sh
#
# Yoki to'g'ridan-to'g'ri:
#   bash diagnose.sh
#
# Kerakli vositalar: bash, curl, psql (ixtiyoriy: redis-cli, jq, pnpm)
# ============================================================================

set +e  # xatolikda to'xtamaslik — barcha tekshiruvlar yakunlanadi

# ---- Sozlamalar (.env'dan o'qish) ----
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env 2>/dev/null
  set +a
fi

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/europrint}"
API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost:20806}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@europrint.uz}"
ADMIN_PASS="${ADMIN_PASS:-admin}"

REPORT="diagnose-$(date +%Y%m%d-%H%M%S).txt"
PASS=0; FAIL=0; WARN=0

# ---- Yordamchi funksiyalar ----
c_red()    { printf '\033[31m%s\033[0m' "$*"; }
c_grn()    { printf '\033[32m%s\033[0m' "$*"; }
c_ylw()    { printf '\033[33m%s\033[0m' "$*"; }
c_blu()    { printf '\033[36m%s\033[0m' "$*"; }

log()  { printf '%s\n' "$*" | tee -a "$REPORT"; }
ok()   { printf '  %s %s\n' "$(c_grn '✓')" "$1" | tee -a "$REPORT"; PASS=$((PASS+1)); }
fail() { printf '  %s %s\n' "$(c_red '✗')" "$1" | tee -a "$REPORT"; FAIL=$((FAIL+1)); }
warn() { printf '  %s %s\n' "$(c_ylw '⚠')" "$1" | tee -a "$REPORT"; WARN=$((WARN+1)); }
hr()   { printf '\n%s\n' "$(c_blu "━━━ $* ━━━")" | tee -a "$REPORT"; }

have() { command -v "$1" >/dev/null 2>&1; }

psql_q() {
  # psql query — bitta qator chiqaradi, xato bo'lsa empty
  if have psql; then
    psql "$DB_URL" -tAc "$1" 2>/dev/null | tr -d '[:space:]'
  fi
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null
}

http_body() {
  curl -s --max-time 5 "$@" 2>/dev/null
}

# ============================================================================
log "EuroPrint ERP diagnostika — $(date)"
log "DB:  $DB_URL"
log "API: $API_URL"
log "WEB: $WEB_URL"
log "Hisobot: $REPORT"
# ============================================================================


hr "1/12 — MUHIT (Node, pnpm, psql, redis-cli, curl)"
have node       && ok "node $(node -v)"             || fail "node yo'q"
have pnpm       && ok "pnpm $(pnpm -v)"             || warn "pnpm yo'q"
have psql       && ok "psql $(psql --version | awk '{print $3}')" || warn "psql yo'q (DB tekshiruvi o'tkazib yuboriladi)"
have redis-cli  && ok "redis-cli mavjud"            || warn "redis-cli yo'q"
have curl       && ok "curl mavjud"                 || fail "curl yo'q (API tekshirib bo'lmaydi)"
have jq         && ok "jq mavjud"                   || warn "jq yo'q (JSON parse'siz)"


hr "2/12 — .env va kritik o'zgaruvchilar"
[ -f .env ] && ok ".env fayl bor" || fail ".env fayl YO'Q"
for v in DATABASE_URL JWT_SECRET REDIS_HOST; do
  if grep -q "^${v}=" .env 2>/dev/null; then
    val=$(grep "^${v}=" .env | head -1 | cut -d= -f2-)
    [ -n "$val" ] && ok "${v} o'rnatilgan" || fail "${v} bo'sh"
  else
    fail "${v} .env'da YO'Q"
  fi
done


hr "3/12 — DATABASE ulanish"
if have psql; then
  if psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
    ok "PostgreSQL ulanish ishlaydi"
    PG_VER=$(psql_q "SHOW server_version")
    ok "PostgreSQL versiya: $PG_VER"
    DB_NAME=$(psql_q "SELECT current_database()")
    ok "DB nomi: $DB_NAME"
    TBL_CNT=$(psql_q "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
    ok "Jami jadvallar: $TBL_CNT"
  else
    fail "PostgreSQL'ga ulana olmadi: $DB_URL"
    fail "Servis ishlaganini tekshiring: pg_isready -h localhost -p 5432"
  fi
else
  warn "psql yo'q — DB tekshiruvi o'tkazib yuboriladi"
fi


hr "4/12 — DATABASE: kritik jadvallar"
TABLES=(
  users employees positions org_departments
  sd_orders sd_invoices sd_customers
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
)

if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  MISSING=()
  for t in "${TABLES[@]}"; do
    EXISTS=$(psql_q "SELECT 1 FROM information_schema.tables WHERE table_name='$t' LIMIT 1")
    if [ "$EXISTS" = "1" ]; then
      ok "$t"
    else
      fail "$t — JADVAL YO'Q"
      MISSING+=("$t")
    fi
  done
  if [ ${#MISSING[@]} -gt 0 ]; then
    log ""
    warn "Yetishmagan jadvallar: ${MISSING[*]}"
    warn "Yechim: fix-schema-FINAL*.sql fayllarini qo'llang"
  fi
fi


hr "5/12 — DATABASE: kritik ustunlar"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then

  check_col() {
    local table=$1 col=$2
    local exists
    exists=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='$table' AND column_name='$col' LIMIT 1")
    if [ "$exists" = "1" ]; then
      ok "$table.$col"
    else
      fail "$table.$col — USTUN YO'Q"
    fi
  }

  # Login uchun kritik
  check_col users id
  check_col users email
  check_col users password_hash
  check_col users role
  check_col users full_name
  check_col users deleted_at
  check_col users employee_id

  # Employees uchun kritik
  check_col employees id
  check_col employees full_name
  check_col employees status
  check_col employees department_id
  check_col employees position_id
  check_col employees email_work
  check_col employees employee_code
  check_col employees hire_date
  check_col employees is_blocked

  # Org structure
  check_col org_departments parent_id
  check_col org_departments node_type
  check_col org_departments level

  # Orders
  check_col sd_orders status
  check_col sd_orders total_amount

  # Discipline
  check_col discipline_records employee_id
  check_col discipline_records type
fi


hr "6/12 — DATABASE: seed data (admin user, default settings)"
if have psql && psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  USR_CNT=$(psql_q "SELECT COUNT(*) FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL")
  if [ -n "$USR_CNT" ] && [ "$USR_CNT" -gt 0 ]; then
    ok "Admin user mavjud (soni: $USR_CNT)"
    ADMIN_EMAILS=$(psql_q "SELECT string_agg(email, ', ') FROM users WHERE role IN ('admin','super_admin')")
    log "    📧 $ADMIN_EMAILS"
  else
    fail "Admin user YO'Q — login ishlamaydi"
    log "    Yechim: INSERT INTO users (email, password_hash, role) VALUES (...)"
  fi

  EMP_CNT=$(psql_q "SELECT COUNT(*) FROM employees")
  [ -n "$EMP_CNT" ] && ok "Xodimlar soni: $EMP_CNT" || warn "employees jadvali bo'sh"

  DEPT_CNT=$(psql_q "SELECT COUNT(*) FROM org_departments WHERE is_active=true")
  [ -n "$DEPT_CNT" ] && ok "Aktiv bo'limlar: $DEPT_CNT" || warn "Bo'limlar yo'q"
fi


hr "7/12 — BACKEND: ishga tushganmi?"
HEALTH=$(http_code "$API_URL/api/auth/health")
case "$HEALTH" in
  200|201) ok "Backend tirik (/api/auth/health = $HEALTH)" ;;
  000)     fail "Backend YOQILMAGAN — port $API_URL javob bermayapti"
           fail "  → pnpm --filter @europrint/api run dev:unsafe" ;;
  *)       fail "Health endpoint javob: $HEALTH (kutilgan 200)" ;;
esac


hr "8/12 — BACKEND: kritik endpoint'lar"
if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "201" ]; then

  # Login test
  log "  → POST /api/auth/login (admin sifatida)"
  LOGIN_RESP=$(http_body -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
  LOGIN_CODE=$(http_code -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

  if [ "$LOGIN_CODE" = "200" ] || [ "$LOGIN_CODE" = "201" ]; then
    ok "Login ishladi ($LOGIN_CODE)"
    if have jq; then
      TOKEN=$(printf '%s' "$LOGIN_RESP" | jq -r '.access_token // .token // .data.token // empty' 2>/dev/null)
    else
      TOKEN=$(printf '%s' "$LOGIN_RESP" | grep -oE '"(access_)?token":"[^"]+"' | head -1 | cut -d'"' -f4)
    fi
    [ -n "$TOKEN" ] && ok "JWT token olindi (${#TOKEN} belgi)" || warn "Token javobda yo'q"
  else
    fail "Login muvaffaqiyatsiz: HTTP $LOGIN_CODE"
    log "    Javob: $(printf '%s' "$LOGIN_RESP" | head -c 200)"
    TOKEN=""
  fi

  # Auth bilan tekshiriladigan endpoint'lar
  ENDPOINTS=(
    "GET|/api/auth/me|Joriy foydalanuvchi"
    "GET|/api/hr/employees?limit=1|HR — xodimlar"
    "GET|/api/hr/dashboard-stats|HR dashboard"
    "GET|/api/sd/orders?limit=1|Savdo buyurtmalari"
    "GET|/api/wms/stock?limit=1|Ombor zaxirasi"
    "GET|/api/mes/sessions/active|MES sessions"
    "GET|/api/qc/dashboard|QC dashboard"
    "GET|/api/crm/leads?limit=1|CRM lead'lar"
    "GET|/api/crm/dashboard|CRM dashboard"
    "GET|/api/finance/dashboard|Moliya dashboard"
    "GET|/api/mm/dashboard|MM dashboard"
    "GET|/api/iot/dashboard|IoT dashboard"
    "GET|/api/director/dashboard|Direktor dashboard"
    "GET|/api/notifications/my|Bildirishnomalar"
    "GET|/api/kanban/boards|Kanban"
  )

  for ep in "${ENDPOINTS[@]}"; do
    METHOD=$(echo "$ep" | cut -d'|' -f1)
    PATH_=$(echo "$ep" | cut -d'|' -f2)
    NAME=$(echo "$ep" | cut -d'|' -f3)

    if [ -n "$TOKEN" ]; then
      CODE=$(http_code -X "$METHOD" "$API_URL$PATH_" \
        -H "Authorization: Bearer $TOKEN")
    else
      CODE=$(http_code -X "$METHOD" "$API_URL$PATH_")
    fi

    case "$CODE" in
      200|201|204) ok "[$CODE] $METHOD $PATH_  ($NAME)" ;;
      401)         warn "[$CODE] $METHOD $PATH_  ($NAME) — auth kerak" ;;
      404)         warn "[$CODE] $METHOD $PATH_  ($NAME) — yo'q" ;;
      500|502)     fail "[$CODE] $METHOD $PATH_  ($NAME) — SERVER XATOSI" ;;
      *)           warn "[$CODE] $METHOD $PATH_  ($NAME)" ;;
    esac
  done
fi


hr "9/12 — FRONTEND fayllari"
WEB_DIRS=(apps/web apps/erp-dashboard apps/europrint-site frontend)
WEB_FOUND=""
for d in "${WEB_DIRS[@]}"; do
  if [ -d "$d/src" ]; then
    WEB_FOUND="$d"
    ok "Frontend topildi: $d"
    break
  fi
done

if [ -n "$WEB_FOUND" ]; then
  PAGES_CNT=$(find "$WEB_FOUND/src" -type f \( -name '*.tsx' -o -name '*.jsx' \) 2>/dev/null | wc -l | tr -d ' ')
  ok "Component fayllar: $PAGES_CNT"

  # Auth fayli
  if find "$WEB_FOUND/src" -name 'useAuth*' -o -name 'AuthContext*' 2>/dev/null | grep -q .; then
    ok "Auth context/hook bor"
  else
    warn "Auth context topilmadi"
  fi

  # API client
  if find "$WEB_FOUND/src" -name 'api*.ts' -o -name 'apiClient*' -o -name 'axios*' 2>/dev/null | grep -q .; then
    ok "API client bor"
  else
    warn "API client topilmadi"
  fi

  # Router
  if grep -rq "react-router-dom\|createBrowserRouter" "$WEB_FOUND/src" 2>/dev/null; then
    ok "React Router ishlatilgan"
  else
    warn "React Router topilmadi"
  fi
else
  warn "Frontend papkasi topilmadi (apps/web, apps/erp-dashboard...)"
fi


hr "10/12 — i18n (uz/ru/en) tarjimalar"
if [ -n "$WEB_FOUND" ]; then
  for lang in uz ru en; do
    if find "$WEB_FOUND" -name "${lang}.json" -o -name "${lang}.ts" 2>/dev/null | grep -q .; then
      f=$(find "$WEB_FOUND" -name "${lang}.json" -o -name "${lang}.ts" 2>/dev/null | head -1)
      sz=$(wc -l < "$f" 2>/dev/null || echo 0)
      ok "$lang tarjima: $f ($sz qator)"
    else
      warn "$lang tarjima fayli topilmadi"
    fi
  done
fi


hr "11/12 — REDIS (queue, cache)"
if have redis-cli; then
  PING=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null)
  if [ "$PING" = "PONG" ]; then
    ok "Redis tirik ($REDIS_HOST:$REDIS_PORT)"
    REDIS_VER=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server 2>/dev/null | grep '^redis_version' | cut -d: -f2 | tr -d '\r')
    ok "Redis versiya: $REDIS_VER"
    if [ -n "$REDIS_VER" ]; then
      MAJOR=$(echo "$REDIS_VER" | cut -d. -f1)
      [ "$MAJOR" -ge 6 ] 2>/dev/null && ok "Versiya ≥ 6 (BullMQ uchun OK)" \
        || warn "Versiya < 6 (BullMQ ≥6.2 tavsiya qiladi)"
    fi
    KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE 2>/dev/null | awk '{print $NF}')
    ok "Keylar soni: $KEYS"
  else
    fail "Redis javob bermayapti"
  fi
else
  warn "redis-cli yo'q"
fi


hr "12/12 — XULOSA"
log ""
log "  $(c_grn "✓ Muvaffaqiyat: $PASS")"
log "  $(c_ylw "⚠ Ogohlantirish: $WARN")"
log "  $(c_red "✗ Xatolik:      $FAIL")"
log ""
if [ $FAIL -eq 0 ]; then
  log "$(c_grn '🎉 Hammasi joyida!')"
elif [ $FAIL -lt 5 ]; then
  log "$(c_ylw '⚠ Bir nechta muammo bor — yuqoridagi ✗ qatorlarni tuzating')"
else
  log "$(c_red '🔴 Jiddiy muammolar — schema va seed'ni qayta qo'llash kerak')"
fi
log ""
log "📄 To'liq hisobot: $REPORT"
log ""
log "Keyingi qadam:"
log "  1) ✗ qatorlardagi xatoliklarni tuzating"
log "  2) Schema patch qo'llang: psql \$DATABASE_URL -f fix-schema-FINAL4.sql"
log "  3) Skriptni qaytadan oching: bash diagnose.sh"

# Exit code: xatolik bo'lsa 1
[ $FAIL -eq 0 ]
