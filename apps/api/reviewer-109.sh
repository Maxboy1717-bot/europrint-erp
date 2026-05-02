#!/usr/bin/env bash
# reviewer-109.sh — God File Split + Repository Pattern (Task #457)
# AR-29: Service file max 200 lines
# AR-30: db.select() / rawSql() / runQuery() FORBIDDEN in Service files
# AR-31: Repository = DB CRUD only

set -eu
PASS=0; FAIL=0

check() {
  local label=$1 got=$2 want=$3
  if [ "$got" = "$want" ]; then
    echo "  PASS [$label] count=$got"
    PASS=$((PASS+1))
  else
    echo "  FAIL [$label] got=$got want=$want"
    FAIL=$((FAIL+1))
  fi
}

check_lt() {
  local label=$1 got=$2 max=$3
  if [ "$got" -lt "$max" ] 2>/dev/null; then
    echo "  PASS [$label] lines=$got (< $max)"
    PASS=$((PASS+1))
  else
    echo "  FAIL [$label] lines=$got want<$max"
    FAIL=$((FAIL+1))
  fi
}

check_gte() {
  local label=$1 got=$2 min=$3
  if [ "$got" -ge "$min" ] 2>/dev/null; then
    echo "  PASS [$label] count=$got (>= $min)"
    PASS=$((PASS+1))
  else
    echo "  FAIL [$label] got=$got want>=$min"
    FAIL=$((FAIL+1))
  fi
}

# Helper: count grep matches safely
glines() { grep -n "$@" 2>/dev/null | wc -l | tr -d ' ' || echo 0; }
# Helper: count file lines
flines() { wc -l < "$1" 2>/dev/null | tr -d ' ' || echo 9999; }
# Helper: file exists
fexists() { [ -f "$1" ] && echo 1 || echo 0; }

# ─── Scheduling sub-services ────────────────────────────────────────────────

SCHED_TYPES="apps/api/src/modules/pp/domain/services/scheduling.types.ts"
SCHED_JOHNSON="apps/api/src/modules/pp/domain/services/scheduling-johnson.service.ts"
SCHED_NETWORK="apps/api/src/modules/pp/domain/services/scheduling-network.service.ts"
SCHED_CAPACITY="apps/api/src/modules/pp/domain/services/scheduling-capacity.service.ts"
SCHED_FACADE="apps/api/src/modules/pp/domain/services/scheduling.service.ts"
PP_MODULE="apps/api/src/modules/pp/pp.module.ts"

echo "=== AR-29: scheduling.types.ts exists ==="
check "scheduling_types_exists" "$(fexists "$SCHED_TYPES")" 1

echo "=== AR-29: scheduling-johnson.service.ts exists ==="
check "scheduling_johnson_exists" "$(fexists "$SCHED_JOHNSON")" 1

echo "=== AR-29: scheduling-network.service.ts exists ==="
check "scheduling_network_exists" "$(fexists "$SCHED_NETWORK")" 1

echo "=== AR-29: scheduling-capacity.service.ts exists ==="
check "scheduling_capacity_exists" "$(fexists "$SCHED_CAPACITY")" 1

echo "=== AR-29: scheduling.service.ts facade < 200 lines ==="
SCHED_LINES=$(flines "$SCHED_FACADE")
check_lt "scheduling_facade_lt_200_lines" "$SCHED_LINES" 200

echo "=== AR-29: scheduling-network.service.ts < 200 lines ==="
NET_LINES=$(flines "$SCHED_NETWORK")
check_lt "scheduling_network_lt_200_lines" "$NET_LINES" 200

echo "=== AR-31: SchedulingJohnsonService registered in pp.module.ts ==="
JOHNSON_REG=$(glines "SchedulingJohnsonService" "$PP_MODULE")
check_gte "johnson_service_in_pp_module" "$JOHNSON_REG" 2

echo "=== AR-31: SchedulingNetworkService registered in pp.module.ts ==="
NETWORK_REG=$(glines "SchedulingNetworkService" "$PP_MODULE")
check_gte "network_service_in_pp_module" "$NETWORK_REG" 2

echo "=== AR-31: SchedulingCapacityService registered in pp.module.ts ==="
CAPACITY_REG=$(glines "SchedulingCapacityService" "$PP_MODULE")
check_gte "capacity_service_in_pp_module" "$CAPACITY_REG" 2

# ─── FinanceAiService split ───────────────────────────────────────────────

FINANCE_SVC="apps/api/src/modules/ai/services/finance-ai.service.ts"
FINANCE_REPO="apps/api/src/modules/ai/services/finance-ai.repository.ts"
AI_MODULE="apps/api/src/modules/ai/ai.module.ts"

echo "=== AR-29: finance-ai.service.ts < 200 lines ==="
FIN_LINES=$(flines "$FINANCE_SVC")
check_lt "finance_ai_svc_lt_200_lines" "$FIN_LINES" 200

echo "=== AR-30: No db.select() in finance-ai.service.ts ==="
DB_SELECT=$(glines "db\." "$FINANCE_SVC")
check "finance_ai_no_db_select" "$DB_SELECT" 0

echo "=== AR-31: finance-ai.repository.ts exists ==="
check "finance_ai_repo_exists" "$(fexists "$FINANCE_REPO")" 1

echo "=== AR-31: FinanceAiRepository registered in ai.module.ts ==="
FREPO_REG=$(glines "FinanceAiRepository" "$AI_MODULE")
check_gte "finance_ai_repo_in_ai_module" "$FREPO_REG" 2

echo "=== AR-30: No duplicate classifyInvoice in finance-ai.service.ts ==="
CLASSIFY_IN_SVC=$(glines "classifyInvoice" "$FINANCE_SVC")
check "finance_ai_no_classify_invoice" "$CLASSIFY_IN_SVC" 0

echo "=== AR-30: No duplicate assessFraudRisk in finance-ai.service.ts ==="
FRAUD_IN_SVC=$(glines "assessFraudRisk" "$FINANCE_SVC")
check "finance_ai_no_assess_fraud" "$FRAUD_IN_SVC" 0

echo "=== AR-30: AiAutomationEventsService uses FinanceAiAnalysisService ==="
EVENTS_SVC="apps/api/src/modules/ai/services/ai-automation-events.service.ts"
EVENTS_ANALYSIS=$(glines "FinanceAiAnalysisService" "$EVENTS_SVC")
check_gte "events_svc_uses_analysis_svc" "$EVENTS_ANALYSIS" 1

# ─── ForecastRepository ───────────────────────────────────────────────────

FORECAST_REPO="apps/api/src/modules/ai/forecast/forecast.repository.ts"
FORECAST_PERSIST="apps/api/src/modules/ai/forecast/forecast-persistence.service.ts"
QUEUE_MODULE="apps/api/src/modules/queue/queue.module.ts"

echo "=== AR-31: forecast.repository.ts exists ==="
check "forecast_repo_exists" "$(fexists "$FORECAST_REPO")" 1

echo "=== AR-30: No rawSql() in forecast-persistence.service.ts ==="
RAWSQL_IN_PERSIST=$(glines "rawSql\|runQuery" "$FORECAST_PERSIST")
check "forecast_persist_no_rawsql" "$RAWSQL_IN_PERSIST" 0

echo "=== AR-29: forecast-persistence.service.ts < 200 lines ==="
PERSIST_LINES=$(flines "$FORECAST_PERSIST")
check_lt "forecast_persist_lt_200_lines" "$PERSIST_LINES" 200

echo "=== AR-31: ForecastRepository registered in ai.module.ts ==="
FREPO_AI=$(glines "ForecastRepository" "$AI_MODULE")
check_gte "forecast_repo_in_ai_module" "$FREPO_AI" 2

echo "=== AR-31: ForecastRepository registered in queue.module.ts ==="
FREPO_QUEUE=$(glines "ForecastRepository" "$QUEUE_MODULE")
check_gte "forecast_repo_in_queue_module" "$FREPO_QUEUE" 2

echo ""
echo "PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED"
  exit 1
fi
