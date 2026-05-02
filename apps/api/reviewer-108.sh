#!/usr/bin/env bash
# reviewer-108.sh — Magic Numbers → Named Constants (Task #456)
# AR-26: Biznes qoidalari named constant'larda bo'lishi kerak
# AR-27: DTO .max(N) literallari constant ishlatishi kerak
# AR-28: config/ papkasida DTO-dan mustaqil constantlar

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

# Helper: count grep matches safely (never exits non-zero)
glines() { grep -n "$@" 2>/dev/null | wc -l | tr -d ' ' || echo 0; }

QC_CONST="apps/api/src/modules/qc/constants/qc.constants.ts"
MES_CONST="apps/api/src/modules/mes/constants/mes.constants.ts"
FMEA_SVC="apps/api/src/modules/qc/domain/services/fmea.service.ts"
DELTA_SVC="apps/api/src/modules/qc/domain/services/delta-e.service.ts"
MES_DTO="apps/api/src/modules/mes/dto/mes.dto.ts"
QC_DTO="apps/api/src/modules/qc/dto/qc.dto.ts"
APP_CONST="apps/api/src/common/constants/app.constants.ts"

echo "=== AR-26: QC constants file — FMEA/DPMO/DeltaE thresholds ==="
FMEA_CRIT=$(glines "FMEA_CRITICAL_RPN" "$QC_CONST")
FMEA_HIGH=$(glines "FMEA_HIGH_RPN" "$QC_CONST")
DPMO_DEF=$(glines "DPMO_PER_MILLION" "$QC_CONST")
DELTA_DEF=$(glines "DELTA_E_PASS_MAX" "$QC_CONST")
check "fmea_critical_rpn_defined" "$FMEA_CRIT" 1
check "fmea_high_rpn_defined" "$FMEA_HIGH" 1
check "dpmo_per_million_defined" "$DPMO_DEF" 1
check "delta_e_pass_max_defined" "$DELTA_DEF" 1

echo "=== AR-26: MES constants file exists ==="
REASON_DEF=$(glines "MES_REASON_MAX_LENGTH" "$MES_CONST")
check "mes_reason_constant_defined" "$REASON_DEF" 1

echo "=== AR-27: DTO .max(500) literals removed in mes.dto.ts ==="
RAW_500=$(glines '\.max(500)' "$MES_DTO")
check "mes_dto_no_raw_max_500" "$RAW_500" 0

echo "=== AR-27: DTO .max(255) literals removed in mes.dto.ts ==="
RAW_255=$(glines '\.max(255)' "$MES_DTO")
check "mes_dto_no_raw_max_255" "$RAW_255" 0

echo "=== AR-26: fmea.service.ts — no raw RPN literals (200/100/50) ==="
RAW_RPN=$(glines 'rpn > 200\|rpn > 100\|rpn > 50' "$FMEA_SVC")
check "fmea_no_raw_rpn_literals" "$RAW_RPN" 0

echo "=== AR-26: fmea.service.ts uses DPMO_PER_MILLION constant ==="
DPMO_USE=$(glines "DPMO_PER_MILLION" "$FMEA_SVC")
check_gte "fmea_uses_dpmo_constant" "$DPMO_USE" 1

echo "=== AR-26: delta-e.service.ts uses DELTA_E grade constants ==="
DELTA_USE=$(glines "DELTA_E_PASS_MAX\|DELTA_E_REVIEW_MAX\|DELTA_E_REWORK_MAX" "$DELTA_SVC")
check_gte "delta_e_uses_constants" "$DELTA_USE" 3

echo "=== AR-27: qc.dto.ts — no raw .max(255) literals ==="
RAW_QC_255=$(glines '\.max(255)' "$QC_DTO")
check "qc_dto_no_raw_max_255" "$RAW_QC_255" 0

echo "=== AR-28: app.constants.ts — MAX_TITLE_LENGTH defined ==="
TITLE_DEF=$(glines "MAX_TITLE_LENGTH" "$APP_CONST")
check_gte "app_constants_max_title_length" "$TITLE_DEF" 1

echo "=== AR-28: app.constants.ts — ROUND_2DP + ROUND_3DP factors defined ==="
ROUND_DEF=$(glines "ROUND_2DP_FACTOR\|ROUND_3DP_FACTOR" "$APP_CONST")
check_gte "app_constants_round_factors" "$ROUND_DEF" 2

echo ""
echo "PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED"
  exit 1
fi
