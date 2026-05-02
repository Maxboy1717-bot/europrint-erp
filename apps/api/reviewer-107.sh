#!/usr/bin/env bash
# reviewer-107.sh — Task #455: Kod Sifati (Code Quality)
# AR-15: no `any`, AR-16: no `Result<unknown>`, AR-24: no raw data checks in controllers
PASS=0; FAIL=0

check() {
  local name="$1" count="$2" want="$3"
  if [ "$count" -eq "$want" ]; then
    echo "  PASS [$name] count=$count"
    PASS=$((PASS+1))
  else
    echo "  FAIL [$name] got=$count want=$want"
    FAIL=$((FAIL+1))
  fi
}

echo "=== AR-15 (any): no explicit any type annotations ==="
ANY=$(grep -rn ": any\b" apps/api/src/modules --include="*.ts" | grep -v "spec\." | wc -l || echo 0)
check "any_count" "$ANY" 0

echo "=== AR-23 (non-null assertions): no !. patterns ==="
NONNULL=$(grep -rn "\!\." apps/api/src/modules --include="*.ts" | grep -v "spec\." | wc -l || echo 0)
check "non_null_assertion_count" "$NONNULL" 0

echo "=== AR-16 (result-unknown): no Result<unknown> return types ==="
RU=$(grep -rn "Result<unknown>" apps/api/src/modules --include="*.ts" | grep -v "spec\." | wc -l || echo 0)
check "result_unknown_count" "$RU" 0

echo "=== AR-24 (controller-logic): no raw data checks in controllers ==="
CTRL=$(grep -rn "if.*throw new" apps/api/src/modules --include="*.controller.ts" | grep -v "\.ok" | wc -l || echo 0)
check "controller_if_throw_violations" "$CTRL" 0

echo "=== AR-24: scoreLeadV2 uses unwrapOrThrow (service handles NOT_FOUND) ==="
SCORE=$(grep -c "unwrapOrThrow.*scoreLeadV2\|scoreLeadV2.*unwrapOrThrow" apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts 2>/dev/null || echo 0)
check "scorelead_unwrap" "$SCORE" 1

echo "=== AR-24: chat assertRoomMember used ==="
CHAT_FIXED=$(grep -c "assertRoomMember" apps/api/src/modules/chat/chat-advanced.controller.ts 2>/dev/null || echo 0)
check "chat_assertroomember" "$CHAT_FIXED" 1

echo "=== AR-16: concrete types added to QC repository ==="
QC_INTERFACES=$(grep -c "interface Qc\|interface Spc" apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts 2>/dev/null || echo 0)
check "qc_interfaces_defined" "$QC_INTERFACES" 4

echo "=== AR-16: concrete types added to director repos ==="
DK=$(grep -c "interface Dokla\|interface Rasp\|interface KeyResults" apps/api/src/modules/director/application/coordination.repository.ts 2>/dev/null || echo 0)
DOK=$(grep -c "interface KeyResultsDashboard" apps/api/src/modules/director/application/okr.repository.ts 2>/dev/null || echo 0)
DIR_INTERFACES=$((DK + DOK))
check "director_interfaces" "$DIR_INTERFACES" 3

echo "=== AR-16: waste dashboard interfaces defined ==="
WASTE_IFC=$(grep -c "interface Waste" apps/api/src/modules/remaining/waste.repository.ts 2>/dev/null || echo 0)
check "waste_interfaces_defined" "$WASTE_IFC" 2

echo ""
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED" && exit 0 || { echo "SOME CHECKS FAILED"; exit 1; }
