#!/bin/bash
# QATLAM 6: API Client
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 6: API Client ==="
CLIENT="$BASE/lib/api-client-react/src"
DASHBOARD="$BASE/artifacts/erp-dashboard/src"

# 6.1 API client mavjud
if [ -d "$CLIENT" ]; then
  echo "✔ API client papkasi mavjud"
  PASS=$((PASS+1))
else
  echo "⚠ lib/api-client-react/src topilmadi"
  WARN=$((WARN+1))
fi

# 6.2 401 redirect
REDIRECT_FOUND=0
for dir in "$CLIENT" "$DASHBOARD/lib" "$DASHBOARD/utils" "$DASHBOARD/api"; do
  if grep -rl "401\|unauthorized\|Unauthorized" "$dir" 2>/dev/null | xargs grep -l "location\|redirect\|login" 2>/dev/null | grep -q .; then
    REDIRECT_FOUND=1; break
  fi
done
if [ $REDIRECT_FOUND -eq 1 ]; then
  echo "✔ 401 redirect topildi"
  PASS=$((PASS+1))
else
  echo "⚠ 401 redirect yo'q — token muddati o'tganda foydalanuvchi yo'naltirilmaydi"
  WARN=$((WARN+1))
fi

# 6.3 Base URL sozlangan
BASE_URL_FOUND=$(grep -rl "baseURL\|BASE_URL\|API_URL\|/api" "$CLIENT" "$DASHBOARD/lib" "$DASHBOARD/utils" 2>/dev/null | wc -l)
if [ "$BASE_URL_FOUND" -gt 0 ]; then
  echo "✔ API base URL topildi"
  PASS=$((PASS+1))
else
  echo "⚠ API base URL topilmadi"
  WARN=$((WARN+1))
fi

# 6.4 Authorization header
AUTH_HEADER=$(grep -rl "Authorization\|Bearer\|token" "$CLIENT" "$DASHBOARD/lib" "$DASHBOARD/utils" 2>/dev/null | wc -l)
if [ "$AUTH_HEADER" -gt 0 ]; then
  echo "✔ Authorization header topildi"
  PASS=$((PASS+1))
else
  echo "⚠ Authorization header topilmadi"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
