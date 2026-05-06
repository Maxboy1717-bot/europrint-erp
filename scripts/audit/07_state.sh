#!/bin/bash
# QATLAM 7: State Management
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 7: State Management ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 7.1 React Query / TanStack Query
if grep -rl "useQuery\|useMutation\|QueryClient\|@tanstack/react-query" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ TanStack Query ishlatilmoqda"
  PASS=$((PASS+1))
else
  echo "⚠ TanStack Query topilmadi"
  WARN=$((WARN+1))
fi

# 7.2 staleTime sozlangan
if grep -rl "staleTime" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ staleTime sozlangan"
  PASS=$((PASS+1))
else
  echo "✘ staleTime sozlanmagan — QueryClient default options'da yo'q"
  FAIL=$((FAIL+1))
fi

# 7.3 QueryClient konfiguratsiya
QC_FILE=$(grep -rl "new QueryClient\|QueryClient(" "$DASH" 2>/dev/null | head -1)
if [ -n "$QC_FILE" ]; then
  echo "✔ QueryClient topildi: $(echo $QC_FILE | sed 's|.*/src/|src/|')"
  PASS=$((PASS+1))
else
  echo "⚠ QueryClient topilmadi"
  WARN=$((WARN+1))
fi

# 7.4 retry sozlangan
if grep -rl "retry:" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ retry sozlangan"
  PASS=$((PASS+1))
else
  echo "⚠ retry sozlanmagan (default: 3)"
  WARN=$((WARN+1))
fi

# 7.5 invalidateQueries
INV_QUERIES=$(grep -rl "invalidateQueries" "$DASH" 2>/dev/null | wc -l)
if [ "$INV_QUERIES" -gt 3 ]; then
  echo "✔ invalidateQueries: $INV_QUERIES fayl"
  PASS=$((PASS+1))
else
  echo "⚠ invalidateQueries kam ($INV_QUERIES fayl)"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
