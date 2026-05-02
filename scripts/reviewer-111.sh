#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
check() { [ "$2" -eq 0 ] && echo "[PASS] $1" || { echo "[FAIL] $1"; FAIL=1; }; }

# --- 1. Warehouse stubs (wms-warehouse-gateway) ---
WMS_GW="$ROOT/apps/api/src/modules/wms/presentation/wms-warehouse-gateway.controller.ts"
check "wms-warehouse-gateway: transactions route" \
  "$(grep -q "transactions" "$WMS_GW" && echo 0 || echo 1)"
check "wms-warehouse-gateway: reports/abc-analysis route" \
  "$(grep -q "abc-analysis" "$WMS_GW" && echo 0 || echo 1)"
check "wms-warehouse-gateway: material-kits route" \
  "$(grep -q "material-kits" "$WMS_GW" && echo 0 || echo 1)"

# --- 2. IoT main stubs ---
IOT_MAIN="$ROOT/apps/api/src/modules/iot/presentation/iot-main.controller.ts"
check "iot-main: tablet/sessions stub" \
  "$(grep -q "tablet/sessions" "$IOT_MAIN" && echo 0 || echo 1)"
check "iot-main: production-sessions crew stub" \
  "$(grep -q "crew" "$IOT_MAIN" && echo 0 || echo 1)"
check "iot-main: material-kit-items scan stub" \
  "$(grep -q "scan" "$IOT_MAIN" && echo 0 || echo 1)"

# --- 3. Marketing analytics stubs ---
MKT="$ROOT/apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts"
check "marketing: inbox/conversations stub" \
  "$(grep -q "inbox/conversations" "$MKT" && echo 0 || echo 1)"
check "marketing: website/blog stub" \
  "$(grep -q "website/blog" "$MKT" && echo 0 || echo 1)"
check "marketing: automation/overdue-leads stub" \
  "$(grep -q "overdue-leads" "$MKT" && echo 0 || echo 1)"

# --- 4. MM dashboard stubs ---
MM="$ROOT/apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts"
check "mm-dashboard: vendor-invoices stub" \
  "$(grep -q "vendor-invoices" "$MM" && echo 0 || echo 1)"
check "mm-dashboard: three-way-match stub" \
  "$(grep -q "three-way-match" "$MM" && echo 0 || echo 1)"
check "mm-dashboard: fleet/maintenance stub" \
  "$(grep -q "fleet/maintenance" "$MM" && echo 0 || echo 1)"

# --- 5. Kanban ext stubs ---
KANBAN="$ROOT/apps/api/src/modules/kanban/presentation/kanban-ext.controller.ts"
check "kanban: time-entries/start stub" \
  "$(grep -q "time-entries/start" "$KANBAN" && echo 0 || echo 1)"
check "kanban: result-files stub" \
  "$(grep -q "result-files" "$KANBAN" && echo 0 || echo 1)"

# --- 6. HR compat-a stubs ---
HR_A="$ROOT/apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts"
check "hr-compat-a: hrc-tests/employee results stub" \
  "$(grep -q "hrc-tests/employee" "$HR_A" && echo 0 || echo 1)"
check "hr-compat-a: hrc-tests/tool-test/questions PATCH" \
  "$(grep -q "Patch.*hrc-tests\|hrc-tests.*Patch\|hrc-tests/tool-test/questions" "$HR_A" && echo 0 || echo 1)"

# --- 7. HR document workflow stubs ---
HR_DASH="$ROOT/apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts"
HR_DW="$ROOT/apps/api/src/modules/hr/document-workflow/document-workflow.controller.ts"
check "hr-dashboard: documents/pending stub" \
  "$(grep -q "pending" "$HR_DASH" && echo 0 || echo 1)"
check "hr-document-workflow: admin/workflow-routes stub" \
  "$(grep -q "workflow-routes" "$HR_DW" && echo 0 || echo 1)"

# --- 8. HR Capital controller ---
HR_CAP="$ROOT/apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts"
check "hr-capital: courses route" \
  "$(grep -q "courses" "$HR_CAP" && echo 0 || echo 1)"
check "hr-capital: stats route" \
  "$(grep -q "'stats'" "$HR_CAP" && echo 0 || echo 1)"

# --- 9. SAAS stubs ---
SAAS="$ROOT/apps/api/src/modules/compatibility"
check "saas: tenants/:id/modules stub" \
  "$(grep -rq "modules" "$SAAS/saas.controller.ts" 2>/dev/null && echo 0 || echo 1)"

# --- 10. Org departments notify-vacancies ---
COMPAT="$ROOT/apps/api/src/modules/compatibility/resources.controller.ts"
check "org-departments: notify-vacancies stub" \
  "$(grep -q "notify-vacancies" "$COMPAT" && echo 0 || echo 1)"

# --- 11. WMS movements ---
WMS_EXT="$ROOT/apps/api/src/modules/wms/presentation/wms-extended.controller.ts"
check "wms-extended: movements stub" \
  "$(grep -q "movements" "$WMS_EXT" && echo 0 || echo 1)"

# --- 12. Warehouse rental recalculate ---
WR="$ROOT/apps/api/src/modules/wms/presentation/warehouse-rental.controller.ts"
check "warehouse-rental: recalculate stub" \
  "$(grep -q "recalculate" "$WR" && echo 0 || echo 1)"

# --- 13. apiBase.ts false-positive fix ---
API_BASE="$ROOT/artifacts/erp-dashboard/src/lib/apiBase.ts"
check "apiBase.ts: hr-v2 string not literal concatenation" \
  "$(grep -q '"/api" + "/hr-v2"\|`/api` + `/hr-v2`\|"/api".*"/hr-v2"' "$API_BASE" && echo 0 || echo 1)"

# --- 14. Live HTTP checks: stub routes return 401 (registered), not 404 (missing) ---
API_PORT="${PORT:-8080}"
http_check() {
  local label="$1"; local method="${2:-GET}"; local url="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "http://localhost:${API_PORT}${url}" \
    -H "Content-Type: application/json" -d '{}' 2>/dev/null)
  # 401 = route exists, auth required. 200 = public route. Both are "route registered".
  # 404 or 000 = route missing/API down.
  if [ "$code" = "401" ] || [ "$code" = "200" ] || [ "$code" = "403" ]; then
    check "$label (HTTP $code)" 0
  else
    check "$label (HTTP $code, want 401/200)" 1
  fi
}

http_check "GET /api/wms/movements" "GET" "/api/wms/movements"
http_check "POST /api/warehouse-rental/recalculate" "POST" "/api/warehouse-rental/recalculate"
http_check "POST /api/org-departments/notify-vacancies" "POST" "/api/org-departments/notify-vacancies"
http_check "GET /api/hr/hrc-tests/employee/1/results" "GET" "/api/hr/hrc-tests/employee/1/results"
http_check "GET /api/marketing/automation/overdue-leads" "GET" "/api/marketing/automation/overdue-leads"
http_check "GET /api/mm/three-way-match" "GET" "/api/mm/three-way-match"
http_check "POST /api/lms/progress/complete" "POST" "/api/lms/progress/complete"
http_check "GET /api/iot/tablet/sessions" "GET" "/api/iot/tablet/sessions"

[ "$FAIL" -eq 0 ] && echo "BARCHA TEKSHIRUVLAR O'TDI ✓" || { echo "FAIL"; exit 1; }
