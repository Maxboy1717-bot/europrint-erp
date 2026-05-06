#!/bin/bash
# QATLAM 8: Routing
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 8: Routing ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 8.1 TanStack Router
if grep -rl "createFileRoute\|createRootRoute\|TanStack.*Router\|@tanstack/react-router" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ TanStack Router ishlatilmoqda"
  PASS=$((PASS+1))
else
  echo "⚠ TanStack Router topilmadi"
  WARN=$((WARN+1))
fi

# 8.2 Protected route / beforeLoad
if grep -rl "beforeLoad\|_protected\|authCheck\|isAuthenticated\|requireAuth" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ Protected route/beforeLoad topildi"
  PASS=$((PASS+1))
else
  echo "✘ Protected route yo'q — himoyalanmagan sahifalar mavjud"
  FAIL=$((FAIL+1))
fi

# 8.3 Login redirect
if grep -rl "redirect.*login\|navigate.*login\|/login" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ Login redirect topildi"
  PASS=$((PASS+1))
else
  echo "⚠ Login redirect topilmadi"
  WARN=$((WARN+1))
fi

# 8.4 Route fayllar soni
ROUTE_COUNT=$(find "$DASH" -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs grep -l "createFileRoute\|Route = " 2>/dev/null | wc -l)
echo "✔ Route fayllar: $ROUTE_COUNT ta"
PASS=$((PASS+1))

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
