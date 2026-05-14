#!/bin/bash
# QATLAM 9: Page Components
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 9: Page Components ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 9.1 isLoading holati
LOADING=$(grep -rl "isLoading\|isPending\|Skeleton\|loading" "$DASH" 2>/dev/null | wc -l)
if [ "$LOADING" -gt 5 ]; then
  echo "✔ Loading holati: $LOADING fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Loading holati kam: $LOADING fayl"
  WARN=$((WARN+1))
fi

# 9.2 isError holati
ERROR_STATE=$(grep -rl "isError\|error.*message\|ErrorState" "$DASH" 2>/dev/null | wc -l)
if [ "$ERROR_STATE" -gt 5 ]; then
  echo "✔ Error holati: $ERROR_STATE fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Error holati kam: $ERROR_STATE fayl"
  WARN=$((WARN+1))
fi

# 9.3 Empty state
EMPTY=$(grep -rl "EmptyState\|empty\|'Ma.*lumot yo\|length.*0\|!data" "$DASH" 2>/dev/null | wc -l)
if [ "$EMPTY" -gt 3 ]; then
  echo "✔ Empty state: $EMPTY fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Empty state kam: $EMPTY fayl"
  WARN=$((WARN+1))
fi

# 9.4 ErrorBoundary
if grep -rl "ErrorBoundary\|getDerivedStateFromError\|componentDidCatch" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ ErrorBoundary topildi"
  PASS=$((PASS+1))
else
  echo "✘ ErrorBoundary yo'q"
  FAIL=$((FAIL+1))
fi

# 9.5 DataTable / table component
TABLE=$(grep -rl "DataTable\|<table\|useReactTable\|TanStack.*Table" "$DASH" 2>/dev/null | wc -l)
if [ "$TABLE" -gt 3 ]; then
  echo "✔ Table/DataTable: $TABLE fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Table komponenti kam"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
