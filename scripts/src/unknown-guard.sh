#!/usr/bin/env bash
# unknown-guard.sh — guards specific modules against `unknown` anti-patterns
# Checks modules fixed in Task #342. Returns 0 if clean, 1+ if violations.

SRC="apps/api/src"
ERRORS=0

# Directories and files within scope of this guard
SCOPE=(
  "$SRC/modules/legacy"
  "$SRC/modules/mes/application"
  "$SRC/modules/mes/infrastructure/repositories"
  "$SRC/modules/qc/application"
  "$SRC/modules/auth/infrastructure/repositories/otp-session.repository.ts"
  "$SRC/modules/pos/pos-inventory-count.repository.ts"
  "$SRC/modules/finance/gl"
  "$SRC/modules/finance/budgets"
  "$SRC/modules/finance/payroll"
  "$SRC/modules/finance/finance-extended"
  "$SRC/modules/finance/cashflow"
  "$SRC/modules/finance/order-costing"
  "$SRC/modules/finance/fi"
  "$SRC/modules/finance/sales-orders-fi"
  "$SRC/modules/lms"
  "$SRC/modules/wms"
  "$SRC/modules/pp"
  "$SRC/modules/sd/invoices"
  "$SRC/modules/sd/deliveries"
  "$SRC/modules/hr/employees"
  "$SRC/modules/hr/attendance"
  "$SRC/modules/hr/payroll"
  "$SRC/modules/hr/leave"
  "$SRC/modules/crm/deals"
  "$SRC/modules/crm/contacts"
  "$SRC/modules/crm/leads"
  "$SRC/common/database/queries-remaining-b.ts"
  "$SRC/common/types"
)

# Build include args for grep
GREP_TARGETS=()
for item in "${SCOPE[@]}"; do
  if [ -e "$item" ]; then
    GREP_TARGETS+=("$item")
  fi
done

if [ ${#GREP_TARGETS[@]} -eq 0 ]; then
  echo "⚠️  No target paths found."
  exit 0
fi

# ─── Pattern 1: Function params typed as unknown ──────────────────────────────
PARAM_HITS=$(grep -rn ": unknown[^[]" "${GREP_TARGETS[@]}" --include="*.ts" \
  | grep -v "} catch\s*(" \
  | grep -v "catch (" \
  | grep -v "Record<string, unknown>" \
  | grep -v "\[key:" \
  | grep -v "^\s*//" \
  | grep -v "@Body()\|@Param()\|@Query()\|@Headers()\|@Req()\|@Res()" \
  | grep -E "async\s+\w+.*\(.*: unknown|^\s+\w+\s*\(.*: unknown" \
  || true)

if [ -n "$PARAM_HITS" ]; then
  echo "❌ [PARAM_UNKNOWN] Function parameters typed as unknown:"
  echo "$PARAM_HITS"
  ERRORS=$((ERRORS + $(echo "$PARAM_HITS" | wc -l)))
fi

# ─── Pattern 2: Object fields declared as unknown ─────────────────────────────
FIELD_HITS=$(grep -rn "^\s\+\w\+\s*:\s*unknown;" "${GREP_TARGETS[@]}" --include="*.ts" \
  | grep -v "^\s*//" \
  || true)

if [ -n "$FIELD_HITS" ]; then
  echo "❌ [FIELD_UNKNOWN] Object fields typed as unknown:"
  echo "$FIELD_HITS"
  ERRORS=$((ERRORS + $(echo "$FIELD_HITS" | wc -l)))
fi

# ─── Pattern 3: data: unknown[] inside Result ─────────────────────────────────
DATA_HITS=$(grep -rn "data: unknown\[\]" "${GREP_TARGETS[@]}" --include="*.ts" \
  | grep -v "^\s*//" \
  || true)

if [ -n "$DATA_HITS" ]; then
  echo "❌ [DATA_UNKNOWN] data: unknown[] found in Result types:"
  echo "$DATA_HITS"
  ERRORS=$((ERRORS + $(echo "$DATA_HITS" | wc -l)))
fi

# ─── Pattern 4: SQL params: unknown[] ────────────────────────────────────────
SQL_HITS=$(grep -rn "params: unknown\[\]" "${GREP_TARGETS[@]}" --include="*.ts" \
  | grep -v "^\s*//" \
  || true)

if [ -n "$SQL_HITS" ]; then
  echo "❌ [SQL_UNKNOWN] SQL params typed as unknown[]:"
  echo "$SQL_HITS"
  ERRORS=$((ERRORS + $(echo "$SQL_HITS" | wc -l)))
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ unknown-guard: 0 violations found in scoped modules."
  exit 0
else
  echo ""
  echo "❌ unknown-guard: $ERRORS violation(s) found. Fix before merging."
  exit 1
fi
