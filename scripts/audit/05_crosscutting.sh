#!/bin/bash
# QATLAM 5: Cross-cutting Concerns
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 5: Cross-cutting ==="
SRC="$BASE/apps/api/src"
MAIN="$SRC/main.ts"

# 5.1 Global ValidationPipe
if grep -q "useGlobalPipes\|ValidationPipe\|ZodValidationPipe" "$MAIN" 2>/dev/null; then
  echo "✔ Global ValidationPipe topildi"
  PASS=$((PASS+1))
else
  echo "✘ Global ValidationPipe yo'q — main.ts da sozlanmagan"
  FAIL=$((FAIL+1))
fi

# 5.2 Global Exception Filter
if grep -q "useGlobalFilters\|GlobalExceptionFilter\|HttpExceptionFilter" "$MAIN" 2>/dev/null; then
  echo "✔ Global Exception Filter topildi"
  PASS=$((PASS+1))
else
  echo "✘ Global Exception Filter yo'q"
  FAIL=$((FAIL+1))
fi

# 5.3 CORS sozlangan
if grep -q "enableCors\|CorsOptions\|cors" "$MAIN" 2>/dev/null; then
  echo "✔ CORS sozlangan"
  PASS=$((PASS+1))
else
  echo "✘ CORS sozlanmagan"
  FAIL=$((FAIL+1))
fi

# 5.4 JWT Strategy mavjud
JWT_STRATEGY=$(find "$SRC" -name "jwt.strategy.ts" -o -name "jwt-auth.strategy.ts" 2>/dev/null | wc -l)
if [ "$JWT_STRATEGY" -gt 0 ]; then
  echo "✔ JWT Strategy topildi"
  PASS=$((PASS+1))
else
  echo "✘ JWT Strategy topilmadi"
  FAIL=$((FAIL+1))
fi

# 5.5 JWT payload sub/userId
JWT_FILE=$(find "$SRC" -name "jwt.strategy.ts" -o -name "jwt-auth.strategy.ts" 2>/dev/null | head -1)
if [ -n "$JWT_FILE" ]; then
  if grep -q "payload\.sub\|payload\.userId\|payload\.id" "$JWT_FILE" 2>/dev/null; then
    echo "✔ JWT payload sub/userId topildi"
    PASS=$((PASS+1))
  else
    echo "✘ JWT payload'da sub/userId yo'q"
    FAIL=$((FAIL+1))
  fi
fi

# 5.6 Helmet/security headers
if grep -q "helmet\|@fastify/helmet" "$MAIN" 2>/dev/null; then
  echo "✔ Security headers (Helmet) topildi"
  PASS=$((PASS+1))
else
  echo "⚠ Helmet sozlanmagan"
  WARN=$((WARN+1))
fi

# 5.7 Rate limiting
if grep -q "ThrottlerModule\|RateLimitGuard\|rateLimit" "$SRC/app.module.ts" 2>/dev/null; then
  echo "✔ Rate limiting sozlangan"
  PASS=$((PASS+1))
else
  echo "⚠ Rate limiting yo'q"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
