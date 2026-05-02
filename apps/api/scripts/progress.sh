#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  EUROPRINT ERP — Refaktoring Progress Tracker
#  Ishlatish: bash apps/api/scripts/progress.sh
# ═══════════════════════════════════════════════════════════════
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
SCRIPTS="$ROOT/scripts"

GRN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

bar()  { echo -e "${BLU}${BOLD}══════════════════════════════════════════════${NC}"; }
hdr()  { bar; echo -e "  ${BOLD}$1${NC}"; bar; }
ok()   { echo -e "  ${GRN}✅${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC}  $1"; }
warn() { echo -e "  ${YEL}⚠️ ${NC}  $1"; }
info() { echo -e "  ${CYN}ℹ️ ${NC}  $1"; }

count_ok=0; count_fail=0; count_warn=0
tick()  { count_ok=$((count_ok+1));   ok "$1"; }
cross() { count_fail=$((count_fail+1)); fail "$1"; }
caution(){ count_warn=$((count_warn+1)); warn "$1"; }

echo ""
echo -e "${BOLD}  EUROPRINT ERP — Refaktoring Progress${NC}"
echo -e "  $(date '+%Y-%m-%d %H:%M')  |  src: ${SRC#$ROOT/}"
echo ""

# ──────────────────────────────────────────────────────────────
hdr "🔴 FAZA 1 — XAVFSIZLIK"
# ──────────────────────────────────────────────────────────────
echo ""
echo "  [@Roles] 9 ta compat controller tekshiruvi:"
NO_ROLES=$(grep -rL "@Roles\|@Public" "$SRC/modules/compatibility/" \
  --include="*.controller.ts" 2>/dev/null | sort)
if [ -z "$NO_ROLES" ]; then
  tick "@Roles — barcha compat controllerlarda mavjud"
else
  N=$(echo "$NO_ROLES" | wc -l | tr -d ' ')
  cross "@Roles yo'q — $N ta fayl:"
  echo "$NO_ROLES" | while IFS= read -r f; do echo "       • ${f#$SRC/modules/compatibility/}"; done
fi

echo ""
echo "  [BOILERPLATE] rows()/safeInt() lokal nusxalar:"
BP=$(grep -rl "^function rows\|^function safeInt" "$SRC" --include="*.ts" 2>/dev/null | sort)
if [ -z "$BP" ]; then
  tick "Copy-paste yo'q — dbRows() import qilingan"
else
  N=$(echo "$BP" | wc -l | tr -d ' ')
  cross "Lokal rows()/safeInt() — $N ta fayl:"
  echo "$BP" | while IFS= read -r f; do echo "       • ${f#$SRC/}"; done
fi

echo ""
echo "  [FAYL HAJMI] 300+ qatorli fayllar:"
BIG=""
while IFS= read -r f; do
  L=$(wc -l < "$f")
  if [ "$L" -gt 300 ]; then BIG="$BIG$L $f"$'\n'; fi
done < <(find "$SRC" -name "*.ts" | grep -v "\.d\.ts\|\.spec\." | sort)
if [ -z "$BIG" ]; then
  tick "Barcha fayllar ≤ 300 qator"
else
  echo "$BIG" | grep "[0-9]" | sort -rn | while IFS= read -r line; do
    L=$(echo "$line" | awk '{print $1}')
    F=$(echo "$line" | awk '{print $2}')
    cross "$L qator → ${F#$SRC/}"
  done
fi

# ──────────────────────────────────────────────────────────────
hdr "🔴 FAZA 2+3 — ARXITEKTURA (compatibility/ va remaining/)"
# ──────────────────────────────────────────────────────────────
echo ""
echo "  [compatibility/] Controller→Service holati:"
COMPAT="$SRC/modules/compatibility"
COMPAT_TOTAL=$(find "$COMPAT" -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
COMPAT_DONE=0
while IFS= read -r f; do
  NAME=$(basename "$f" .controller.ts)
  SVC="$COMPAT/${NAME}.service.ts"
  if [ -f "$SVC" ]; then
    COMPAT_DONE=$((COMPAT_DONE+1))
    tick "${NAME}.service.ts ✓"
  else
    cross "${NAME} — service yo'q"
  fi
done < <(find "$COMPAT" -name "*.controller.ts" | sort)
echo ""
info "compatibility/ : $COMPAT_DONE / $COMPAT_TOTAL tayyor"

echo ""
echo "  [remaining/] Controller→Service holati:"
REMAIN="$SRC/modules/remaining"
REMAIN_TOTAL=$(find "$REMAIN" -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
REMAIN_DONE=0
while IFS= read -r f; do
  NAME=$(basename "$f" .controller.ts)
  SVC="$REMAIN/${NAME}.service.ts"
  if [ -f "$SVC" ]; then
    REMAIN_DONE=$((REMAIN_DONE+1))
    tick "${NAME}.service.ts ✓"
  else
    cross "${NAME} — service yo'q"
  fi
done < <(find "$REMAIN" -name "*.controller.ts" | sort)
echo ""
info "remaining/ : $REMAIN_DONE / $REMAIN_TOTAL tayyor"

# ──────────────────────────────────────────────────────────────
hdr "🟡 FAZA 4+5 — KOD SIFATI (SQL → Service, asosiy modullar)"
# ──────────────────────────────────────────────────────────────
echo ""
MODULES="crm director hr finance pos iot mes wms mm qc sd lms core security"
for MOD in $MODULES; do
  DIR="$SRC/modules/$MOD"
  [ -d "$DIR" ] || continue
  SQL_COUNT=$(grep -rl "db\.execute" "$DIR" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$SQL_COUNT" -eq 0 ]; then
    tick "$MOD/ — controller ichida SQL yo'q"
  else
    FILES=$(grep -rl "db\.execute" "$DIR" --include="*.controller.ts" 2>/dev/null)
    cross "$MOD/ — $SQL_COUNT ta controller ichida SQL:"
    echo "$FILES" | while IFS= read -r f; do
      N=$(grep -c "db\.execute" "$f")
      echo "       • $N× $(basename "$f")"
    done
  fi
done

# ──────────────────────────────────────────────────────────────
hdr "🟢 FAZA 6 (Part 1) — 404 ENDPOINT FIXES (AI/Admin/Analytics/Accounting)"
# ──────────────────────────────────────────────────────────────
echo ""

# Admin extra endpoints
ADMIN_REPO="$SRC/modules/admin/infrastructure/repositories/admin-extra.repo.ts"
ADMIN_SVC="$SRC/modules/admin/application/services/admin-extra.service.ts"
ADMIN_CTRL="$SRC/modules/admin/presentation/controllers/admin-extra.controller.ts"
[ -f "$ADMIN_REPO" ] && tick "admin-extra.repo.ts — /admin/roles, /admin/logs, /admin/audit, /admin/system" || cross "admin-extra.repo.ts — yo'q"
[ -f "$ADMIN_SVC"  ] && tick "admin-extra.service.ts — orchestration layer" || cross "admin-extra.service.ts — yo'q"
[ -f "$ADMIN_CTRL" ] && tick "admin-extra.controller.ts — thin HTTP layer" || cross "admin-extra.controller.ts — yo'q"

# Accounting: GET /accounting/accounts route exists
ACCT_CTRL="$SRC/modules/finance/presentation/finance-accounting.controller.ts"
ACCT_ACCOUNTS=0
grep -qE "Get.*accounts|getAccounts" "$ACCT_CTRL" 2>/dev/null && ACCT_ACCOUNTS=1
[ "$ACCT_ACCOUNTS" -eq 1 ] && tick "GET /accounting/accounts — chart of accounts route mavjud" || cross "GET /accounting/accounts — yo'q"

# Analytics graceful fallbacks (detect safeCall, Ok(...), or Result-based patterns)
ANALYTICS_SVC="$SRC/modules/analytics/analytics.service.ts"
ANALYTICS_EXT="$SRC/modules/analytics/analytics-extended.service.ts"
ANALYTICS_FALLBACK=0
grep -qE "safeCall|ok: true|Result<|Ok\(" "$ANALYTICS_SVC" 2>/dev/null && ANALYTICS_FALLBACK=1
[ "$ANALYTICS_FALLBACK" -eq 1 ] && tick "analytics.service.ts — Result<T> / graceful fallbacks mavjud" || cross "analytics.service.ts — fallback yo'q"
ANALYTICS_EXT_FALLBACK=0
grep -qE "safeCall|ok: true|Result<|Ok\(" "$ANALYTICS_EXT" 2>/dev/null && ANALYTICS_EXT_FALLBACK=1
[ "$ANALYTICS_EXT_FALLBACK" -eq 1 ] && tick "analytics-extended.service.ts — Result<T> / graceful fallbacks mavjud" || cross "analytics-extended.service.ts — fallback yo'q"

# AI service graceful fallbacks
AI_ROUTER="$SRC/modules/ai/application/services/ai-router.service.ts"
AI_PLANNING="$SRC/modules/ai/application/services/ai-planning.service.ts"
AI_ROUTER_NUM=0
grep -qE "Number\(" "$AI_ROUTER" 2>/dev/null && AI_ROUTER_NUM=1
[ "$AI_ROUTER_NUM" -eq 1 ] && tick "ai-router.service.ts — userId Number() fix mavjud" || cross "ai-router.service.ts — userId Number() fix yo'q"
AI_PLANNING_FALLBACK=0
grep -qE "catch|fallback|\[\]" "$AI_PLANNING" 2>/dev/null && AI_PLANNING_FALLBACK=1
[ "$AI_PLANNING_FALLBACK" -eq 1 ] && tick "ai-planning.service.ts — graceful empty fallbacks mavjud" || cross "ai-planning.service.ts — fallback yo'q"

echo ""

# ──────────────────────────────────────────────────────────────
hdr "🟢 FAZA 7 — 404 ENDPOINT FIXES Part 2 (Adaptation/Camera/360/Insights/Inventory/GPT)"
# ──────────────────────────────────────────────────────────────
echo ""

# Adaptation module
ADAPT_CTRL="$SRC/modules/adaptation/adaptation.controller.ts"
ADAPT_SVC="$SRC/modules/adaptation/adaptation.service.ts"
ADAPT_REPO="$SRC/modules/adaptation/adaptation.repo.ts"
ADAPT_MOD="$SRC/modules/adaptation/adaptation.module.ts"
[ -f "$ADAPT_CTRL" ] && tick "adaptation.controller.ts — GET /adaptation/dashboard, /programs, /records" || cross "adaptation.controller.ts — yo'q"
[ -f "$ADAPT_SVC" ]  && tick "adaptation.service.ts — orchestration layer" || cross "adaptation.service.ts — yo'q"
[ -f "$ADAPT_REPO" ] && tick "adaptation.repo.ts — DB access via safeCall" || cross "adaptation.repo.ts — yo'q"
[ -f "$ADAPT_MOD" ]  && tick "adaptation.module.ts — NestJS module" || cross "adaptation.module.ts — yo'q"

echo ""

# Camera module
CAMERA_CTRL="$SRC/modules/camera/camera.controller.ts"
AICAM_CTRL="$SRC/modules/camera/ai-camera.controller.ts"
[ -f "$CAMERA_CTRL" ] && tick "camera.controller.ts — GET /camera/status, /events, /zones" || cross "camera.controller.ts — yo'q"
[ -f "$AICAM_CTRL" ]  && tick "ai-camera.controller.ts — GET /ai-camera/events, /alerts, /dashboard" || cross "ai-camera.controller.ts — yo'q"

echo ""

# Feedback 360 module
FB360_CTRL="$SRC/modules/feedback-360/feedback-360.controller.ts"
[ -f "$FB360_CTRL" ] && tick "feedback-360.controller.ts — GET /360/feedback, /assessments, /dashboard" || cross "feedback-360.controller.ts — yo'q"

echo ""

# Insights dashboard route
INSIGHTS_CTRL="$SRC/modules/ai/presentation/insights.controller.ts"
INSIGHTS_DASH=0
grep -qE "Get.*dashboard|getDashboard" "$INSIGHTS_CTRL" 2>/dev/null && INSIGHTS_DASH=1
[ "$INSIGHTS_DASH" -eq 1 ] && tick "insights.controller.ts — GET /insights/dashboard route mavjud" || cross "insights.controller.ts — /insights/dashboard yo'q"

echo ""

# Inventory advanced
INV_CTRL="$SRC/modules/wms/presentation/inventory-advanced.controller.ts"
INV_SVC="$SRC/modules/wms/application/inventory-advanced.service.ts"
INV_REPO="$SRC/modules/wms/infrastructure/inventory-advanced.repo.ts"
[ -f "$INV_CTRL" ] && tick "inventory-advanced.controller.ts — GET /inventory/advanced/analytics, /counts" || cross "inventory-advanced.controller.ts — yo'q"
[ -f "$INV_SVC" ]  && tick "inventory-advanced.service.ts — orchestration layer" || cross "inventory-advanced.service.ts — yo'q"
[ -f "$INV_REPO" ] && tick "inventory-advanced.repo.ts — DB access via safeCall" || cross "inventory-advanced.repo.ts — yo'q"

echo ""

# GPT status/chat routes
GPT_CTRL="$SRC/modules/ai/presentation/gpt.controller.ts"
GPT_STAT=0
grep -qE "Get.*status|getStatus|Get.*chat|getChatInfo" "$GPT_CTRL" 2>/dev/null && GPT_STAT=1
[ "$GPT_STAT" -eq 1 ] && tick "gpt.controller.ts — GET /gpt/status, /gpt/chat route mavjud" || cross "gpt.controller.ts — GET routes yo'q"

echo ""

# ──────────────────────────────────────────────────────────────
hdr "🟡 FAZA 6 — TYPING ('any' yo'q qilish)"
# ──────────────────────────────────────────────────────────────
echo ""
TS_IGN_COUNT=$(grep -rn "@ts-ignore" "$SRC" --include="*.ts" \
  2>/dev/null | grep -v "\.d\.ts\|\.spec\." | wc -l | tr -d ' ')
if [ "$TS_IGN_COUNT" -eq 0 ]; then
  tick "@ts-ignore — 0 ta. TypeScript haqiqatan qat'iy ✓"
else
  cross "@ts-ignore — $TS_IGN_COUNT ta (TypeScript amalda o'chirilgan!)"
fi

ANY_COUNT=$(grep -rn ": any\b\|as any\b\|<any>" "$SRC" --include="*.ts" \
  2>/dev/null | grep -v "\.d\.ts\|\.spec\." | wc -l | tr -d ' ')
if [ "$ANY_COUNT" -eq 0 ]; then
  tick "'any' — 0 ta. TypeScript strict ✓"
else
  cross "'any' — $ANY_COUNT ta joy topildi:"
  echo ""
  grep -rn ": any\b\|as any\b\|<any>" "$SRC" --include="*.ts" \
    2>/dev/null | grep -v "\.d\.ts\|\.spec\." | \
    awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -15 | \
    while read -r cnt file; do
      echo "       • $cnt× ${file#$SRC/}"
    done
fi

# ──────────────────────────────────────────────────────────────
hdr "🟢 FAZA 7 — AUDIT LOG (AuditInterceptor)"
# ──────────────────────────────────────────────────────────────
echo ""
ALL_CTRL=$(find "$SRC" -name "*.controller.ts" | grep -v "\.spec\." | wc -l | tr -d ' ')
WITH_AUDIT=$(grep -rl "AuditInterceptor" "$SRC" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
WITHOUT=$((ALL_CTRL - WITH_AUDIT))
if [ "$WITHOUT" -eq 0 ]; then
  tick "AuditInterceptor — barcha $ALL_CTRL controllerda mavjud"
else
  cross "AuditInterceptor yo'q — $WITHOUT ta controller ($WITH_AUDIT / $ALL_CTRL tayyor):"
  grep -rL "AuditInterceptor" "$SRC" --include="*.controller.ts" 2>/dev/null | \
    grep -v "\.spec\." | sort | head -20 | \
    while IFS= read -r f; do echo "       • ${f#$SRC/}"; done
  if [ "$WITHOUT" -gt 20 ]; then
    echo "       ... va yana $((WITHOUT-20)) ta"
  fi
fi

# ──────────────────────────────────────────────────────────────
hdr "🟢 FAZA 8 — ARXITEKTURA+ (Result<T,E> pattern)"
# ──────────────────────────────────────────────────────────────
echo ""
ALL_SVC=$(find "$SRC" -name "*.service.ts" | grep -v "\.spec\." | wc -l | tr -d ' ')
WITH_RESULT=$(grep -rl "Result<\|ok: true\|ok: false" "$SRC" \
  --include="*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
WITHOUT_RESULT=$((ALL_SVC - WITH_RESULT))

if [ "$WITHOUT_RESULT" -eq 0 ]; then
  tick "Result<T,E> — barcha $ALL_SVC serviceda mavjud"
else
  cross "Result<T,E> yo'q — $WITHOUT_RESULT / $ALL_SVC service:"
  info "try/catch o'rniga Result<T,E> pattern joriy qilinishi kerak"
fi

CATCH_CTRL=$(grep -rl "} catch" "$SRC" --include="*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CATCH_CTRL" -eq 0 ]; then
  tick "Controller ichida try/catch yo'q ✓"
else
  cross "Controller ichida try/catch — $CATCH_CTRL ta fayl"
fi

# ──────────────────────────────────────────────────────────────
hdr "📊 UMUMIY NATIJA"
# ──────────────────────────────────────────────────────────────
echo ""
TOTAL=$((count_ok + count_fail + count_warn))
PCT=0
[ $TOTAL -gt 0 ] && PCT=$((count_ok * 100 / TOTAL))

echo -e "  ✅  Bajarilgan : ${GRN}${BOLD}$count_ok${NC}"
echo -e "  ❌  Qolgan     : ${RED}${BOLD}$count_fail${NC}"
echo -e "  ⚠️   Ogohlantirish: ${YEL}${BOLD}$count_warn${NC}"
echo ""
echo -e "  Refaktoring jarayoni: ${BOLD}$PCT%${NC} tayyor"
echo ""

# Progress bar
DONE_BARS=$((PCT / 5))
EMPTY_BARS=$((20 - DONE_BARS))
BAR_STR="["
for i in $(seq 1 $DONE_BARS); do BAR_STR="${BAR_STR}█"; done
for i in $(seq 1 $EMPTY_BARS); do BAR_STR="${BAR_STR}░"; done
BAR_STR="${BAR_STR}] $PCT%"
echo -e "  ${GRN}${BAR_STR}${NC}"
echo ""
echo -e "  Keyingi qadam: ${BOLD}bash $SCRIPTS/faza1.sh${NC}"
echo ""
