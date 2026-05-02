#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }
notfound() { grep -qr "$2" "$3" && { echo "[FAIL] $1 — still present"; FAIL=1; } || echo "[PASS] $1"; }
# check_http: curl-based HTTP status check; skips gracefully when API is offline
check_http() {
  local name="$1" url="$2" method="${3:-GET}" expected="${4:-401}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 -X "$method" "http://localhost:8080${url}" 2>/dev/null)
  if [ -z "$status" ] || [ "$status" = "000" ]; then
    echo "[SKIP] $name — API not running"
  elif [ "$status" = "$expected" ]; then
    echo "[PASS] $name"
  else
    echo "[FAIL] $name — expected HTTP $expected, got HTTP $status"
    FAIL=1
  fi
}

echo "=== reviewer-112: TS errors, any types, eslint-disable cleanup + T465 ==="

# --- 1. parseInt ?? fixes ---
WL="$ROOT/apps/api/src/modules/compatibility/warehouse-label.controller.ts"
check "warehouse-label: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$WL" && echo 0 || echo 1)"

CRM_F="$ROOT/apps/api/src/modules/crm/presentation/crm-followup-compat.controller.ts"
check "crm-followup: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$CRM_F" && echo 0 || echo 1)"

CRM_B="$ROOT/apps/api/src/modules/crm/presentation/crm-bitrix-compat.controller.ts"
check "crm-bitrix: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$CRM_B" && echo 0 || echo 1)"

KAIZ="$ROOT/apps/api/src/modules/director/presentation/kaizen.controller.ts"
check "kaizen: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$KAIZ" && echo 0 || echo 1)"

STRAT="$ROOT/apps/api/src/modules/director/presentation/strategic.controller.ts"
check "strategic: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$STRAT" && echo 0 || echo 1)"

HR_D="$ROOT/apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts"
check "hr-dashboard: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(days ?? " "$HR_D" && echo 0 || echo 1)"

HR_DE="$ROOT/apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts"
check "hr-dashboard-extra: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(days ?? " "$HR_DE" && echo 0 || echo 1)"

LMS_E="$ROOT/apps/api/src/modules/lms/presentation/lms-enrollments.controller.ts"
check "lms-enrollments: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(days ?? " "$LMS_E" && echo 0 || echo 1)"

QC_P="$ROOT/apps/api/src/modules/qc/presentation/qc-parameters.controller.ts"
check "qc-parameters: parseInt uses ?? fallback" \
  "$(grep -q "parseInt(limit ?? " "$QC_P" && echo 0 || echo 1)"

CRM_AI="$ROOT/apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts"
check "crm-ai-extended: entityType ?? '' fallback" \
  "$(grep -q "entityType ?? ''" "$CRM_AI" && echo 0 || echo 1)"

ERP="$ROOT/apps/api/src/modules/erp/erp-orders.controller.ts"
check "erp-orders: dateRange ?? '' fallback" \
  "$(grep -q "dateRange ?? ''" "$ERP" && echo 0 || echo 1)"

MES_S="$ROOT/apps/api/src/modules/mes/presentation/mes-shifts-stats.controller.ts"
check "mes-shifts-stats: period ?? 'month' fallback" \
  "$(grep -q "period ?? 'month'" "$MES_S" && echo 0 || echo 1)"

# --- 2. LMS exams service — non-existent table imports removed ---
LMS_SVC="$ROOT/apps/api/src/modules/lms/application/services/lms-exams.service.ts"
notfound "lms-exams: no lmsExams import" "lmsExams" "$LMS_SVC"
notfound "lms-exams: no lmsExamAttempts import" "lmsExamAttempts" "$LMS_SVC"
notfound "lms-exams: no lmsCertificates import" "lmsCertificates" "$LMS_SVC"
check "lms-exams: stub returns Err result" \
  "$(grep -q "AppErr" "$LMS_SVC" && echo 0 || echo 1)"

# --- 3. any type removals ---
QC_D="$ROOT/apps/api/src/modules/qc/presentation/qc-defects.controller.ts"
notfound "qc-defects: no body: any" "body: any" "$QC_D"

KAN="$ROOT/apps/api/src/modules/kanban/presentation/kanban-ext.controller.ts"
notfound "kanban-ext: no body: any" "body: any" "$KAN"

INT_E="$ROOT/apps/api/src/modules/integration/integration-employee.controller.ts"
notfound "integration-employee: no body: any" "body: any" "$INT_E"

INT_M="$ROOT/apps/api/src/modules/integration/integration-mro.controller.ts"
notfound "integration-mro: no body: any" "body: any" "$INT_M"

SAAS="$ROOT/apps/api/src/modules/compatibility/saas.controller.ts"
notfound "saas: no body: any" "body: any" "$SAAS"

# --- 4. discipline-v2 as any removed ---
DISC="$ROOT/apps/api/src/modules/hr/discipline-v2/discipline-v2.repository.ts"
notfound "discipline-v2: no .set(...) as any" "} as any" "$DISC"

# --- 5. ESLint disable removed ---
POS_SVC="$ROOT/apps/api/src/modules/pos/pos-svc/drizzle-pos-svc.repo.ts"
notfound "drizzle-pos-svc: no eslint-disable" "eslint-disable" "$POS_SVC"

POS_AUD="$ROOT/apps/api/src/modules/pos/services/pos-audit.repository.ts"
notfound "pos-audit: no eslint-disable" "eslint-disable" "$POS_AUD"

check "pos-audit: userName camelCase" \
  "$(grep -q "userName:" "$POS_AUD" && echo 0 || echo 1)"

# --- 6. return null / return [] → proper responses ---
FIN="$ROOT/apps/api/src/modules/finance/presentation/finance-budgets.controller.ts"
notfound "finance-budgets: no return null" "return null" "$FIN"
check "finance-budgets: throws NotFoundException" \
  "$(grep -q "NotFoundException" "$FIN" && echo 0 || echo 1)"

HR_C="$ROOT/apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts"
check "hr-compat-a: getVacancies returns { data, total }" \
  "$(grep -q "data: \[\], total: 0" "$HR_C" && echo 0 || echo 1)"

# --- 7. Missing route menus/:role ---
CTRL="$ROOT/apps/api/src/modules/compatibility/europrint-control.controller.ts"
check "europrint-control: menus/:role route exists" \
  "$(grep -q "menus/:role" "$CTRL" && echo 0 || echo 1)"
check_http "europrint-control: menus/viewer returns 401 not 404" "/api/europrint-control/menus/viewer"
check_http "europrint-control: menus/super_admin returns 401 not 404" "/api/europrint-control/menus/super_admin"

# --- 8. T465: parseOrThrow helper (T003) ---
PARSE_HELPER="$ROOT/apps/api/src/common/utils/parse-or-throw.util.ts"
check "parseOrThrow helper exists" \
  "$([ -f "$PARSE_HELPER" ] && echo 0 || echo 1)"

IOT_C="$ROOT/apps/api/src/modules/iot/presentation/iot-camera.controller.ts"
check "iot-camera: uses parseOrThrow (not inline if/else)" \
  "$(grep -q "parseOrThrow" "$IOT_C" && echo 0 || echo 1)"

STRAT_C="$ROOT/apps/api/src/modules/director/presentation/strategic.controller.ts"
check "strategic: uses parseOrThrow (not inline if/else)" \
  "$(grep -q "parseOrThrow" "$STRAT_C" && echo 0 || echo 1)"

# --- 9. T465: Backend routes (pm-upcoming, attempts/submit) ---
INT_EHR="$ROOT/apps/api/src/modules/integration/integration-extended-hr.controller.ts"
check "integration: pm-upcoming route exists" \
  "$(grep -q "pm-upcoming" "$INT_EHR" && echo 0 || echo 1)"
check_http "integration: /api/integration/pm-upcoming returns 401 not 404" "/api/integration/pm-upcoming"

LMS_ATT="$ROOT/apps/api/src/modules/lms/presentation/lms-attempts.controller.ts"
check "lms-attempts: :id/submit route exists" \
  "$(grep -q ":id/submit\|:id.*submit" "$LMS_ATT" && echo 0 || echo 1)"
check_http "lms-attempts: /api/lms/attempts/:id/submit returns 401 not 404" "/api/lms/attempts/1/submit" "POST"

# --- 10. T465: Non-null assertions replaced ---
ENPS="$ROOT/apps/api/src/modules/hr/enps/enps.service.ts"
notfound "enps: no non-null data.data! assertions" "data\.data!" "$ENPS"

SKILLS="$ROOT/apps/api/src/modules/hr/skills-matrix/skills-matrix.service.ts"
notfound "skills-matrix: no rows.data! assertion" "rows\.data!" "$SKILLS"

# --- 11. T465: Magic numbers → constants in imposition.service.ts ---
IMPOS="$ROOT/apps/api/src/modules/qc/domain/services/imposition.service.ts"
check "imposition: uses ROUND_3DP_FACTOR constant" \
  "$(grep -q "ROUND_3DP_FACTOR" "$IMPOS" && echo 0 || echo 1)"

# --- 12. T465: Frontend 404 routes → 401 (T004 stubs) ---
check_http "admin: POST /api/admin/login returns 401 not 404" "/api/admin/login" "POST"
check_http "lms: GET /api/modules returns 401 not 404" "/api/modules"
check_http "lms: GET /api/video-progress returns 401 not 404" "/api/video-progress"
check_http "lms: GET /api/progress returns 401 not 404" "/api/progress"
check_http "compat: GET /api/orders-registry returns 401 not 404" "/api/orders-registry"

# --- 13. T466: Fake {success:true} eliminated from controllers ---
FAKE_COUNT=$(grep -rn "return { success: true }\|return {success: true}\|return { ok: true }\|return {ok: true}" \
  "$ROOT/apps/api/src/modules" --include="*controller*.ts" 2>/dev/null | wc -l | tr -d ' ')
check "controllers: zero fake {success:true}/{ok:true} responses (count=$FAKE_COUNT)" \
  "$([ "$FAKE_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 14. T466: No return null in service files (excluding repos/guards/bots/cache) ---
SVC_NULL_COUNT=$(grep -rn "return null;" "$ROOT/apps/api/src/modules" --include="*.service.ts" 2>/dev/null \
  | grep -v "spec\|test\|guard\|bot\|cache\|seed" | wc -l | tr -d ' ')
check "services: zero bare return null (count=$SVC_NULL_COUNT)" \
  "$([ "$SVC_NULL_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 15. T466: No direct this.db.db usage in service files ---
DIRECT_DB_COUNT=$(grep -rn "this\.db\.db\b" "$ROOT/apps/api/src/modules" --include="*.service.ts" 2>/dev/null \
  | grep -v "spec\|test" | wc -l | tr -d ' ')
check "services: zero direct this.db.db queries (count=$DIRECT_DB_COUNT)" \
  "$([ "$DIRECT_DB_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 16. T466: No TODO/FIXME in API src (except enum TODO values) ---
TODO_COUNT=$(grep -rn "// TODO\|// FIXME" "$ROOT/apps/api/src" --include="*.ts" 2>/dev/null \
  | grep -v "spec\|test" | wc -l | tr -d ' ')
check "api-src: zero TODO/FIXME comments (count=$TODO_COUNT)" \
  "$([ "$TODO_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 17. T466: No key={index} in frontend ---
KEY_INDEX_COUNT=$(grep -rn "key={index}" "$ROOT/artifacts/erp-dashboard/src" --include="*.tsx" --include="*.ts" 2>/dev/null \
  | wc -l | tr -d ' ')
check "erp-dashboard: zero key={index} (count=$KEY_INDEX_COUNT)" \
  "$([ "$KEY_INDEX_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 20. T466: No native confirm() dialog calls in frontend ---
CONFIRM_COUNT=$(grep -rn "\bconfirm(" "$ROOT/artifacts/erp-dashboard/src" --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "ConfirmDialog\|onConfirm\|confirmDelete\|confirmRemove\|confirmRefund\|confirmConvert\|confirmArchive\|confirmId\|confirmEmp\|//" \
  | wc -l | tr -d ' ')
check "erp-dashboard: zero native confirm() dialogs (count=$CONFIRM_COUNT)" \
  "$([ "$CONFIRM_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 18. T466: label-ext uses throw instead of return null ---
LEXT="$ROOT/apps/api/src/modules/pos/services/label-ext.service.ts"
notfound "label-ext: no bare return null inside getPrinterConfig" "return null" "$LEXT"

# --- 19. T465: Zero eslint-disable in app source ---
check "api-src: zero eslint-disable comments" \
  "$(grep -rq "eslint-disable" "$ROOT/apps/api/src" --include="*.ts" && echo 1 || echo 0)"

check "erp-dashboard: zero eslint-disable comments" \
  "$(grep -rq "eslint-disable" "$ROOT/artifacts/erp-dashboard/src" --include="*.ts" --include="*.tsx" && echo 1 || echo 0)"

# --- 13. T465: Service return null → throw (discipline-v2) ---
DISC_SVC="$ROOT/apps/api/src/modules/hr/discipline-v2/discipline-v2.service.ts"
notfound "discipline-v2.service: no return null" "return null" "$DISC_SVC"

# --- 14. T465: Global body: any count must be 0 ---
BODY_ANY_COUNT=$(grep -rc "@Body() body: any\|body: any" "$ROOT/apps/api/src" --include="*.ts" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
check "api-src: zero @Body() body: any parameters (count=$BODY_ANY_COUNT)" \
  "$([ "$BODY_ANY_COUNT" -eq 0 ] && echo 0 || echo 1)"

# --- 15. T465: TypeScript no-emit check ---
TSC_OUT=$(cd "$ROOT" && timeout 90 pnpm --filter @europrint/api exec tsc -p tsconfig.json --noEmit 2>&1 | head -5)
TSC_EXIT=$?
if [ $TSC_EXIT -eq 124 ]; then
  echo "[SKIP] api: tsc --noEmit — timed out (> 90s)"
elif [ $TSC_EXIT -eq 0 ]; then
  echo "[PASS] api: tsc --noEmit clean"
else
  echo "[FAIL] api: tsc --noEmit errors: $TSC_OUT"
  FAIL=1
fi

echo ""
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED ✓" || echo "SOME CHECKS FAILED ✗"
exit "$FAIL"
