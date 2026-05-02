#!/usr/bin/env bash
# reviewer-cache-usage.sh — TZ-59: Redis kesh tekshiruvi
# KEYS() TAQIQLANGAN, SCAN ishlatiladi; L1+L2 arxitektura mavjudligi.
set -euo pipefail

PASS=0; FAIL=0
pass() { echo "OK:   $1"; PASS=$((PASS+1)); }
fail() { echo "FAIL: $1" >&2; FAIL=$((FAIL+1)); }

echo "=== reviewer-cache-usage: Redis L1/L2 kesh tekshiruvi ==="

# === 1. Asosiy fayllar ===
if [ -f "apps/api/src/common/cache/cache.service.ts" ]; then
  pass "CacheService mavjud"
else
  fail "CacheService topilmadi"
fi

if [ -f "apps/api/src/common/decorators/cacheable.decorator.ts" ]; then
  pass "@Cacheable dekoratoru mavjud"
else
  fail "@Cacheable dekoratoru topilmadi"
fi

# === 2. L1 (in-memory LRU) ===
if grep -q "LRUCache\|lru-cache" apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "L1 kesh: LRUCache mavjud"
else
  fail "L1 kesh: LRUCache topilmadi"
fi

# === 3. L2 (Redis) ===
if grep -q "IRedisClient\|ioredis\|redis" apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "L2 kesh: Redis client mavjud"
else
  fail "L2 kesh: Redis client topilmadi"
fi

# === 4. TTL Jitter ===
if grep -q "applyTtlJitter\|jitter\|0\.1\|0\.2" apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "TTL Jitter: stampede oldini olish mavjud"
else
  fail "TTL Jitter topilmadi"
fi

# === 5. Cache Key Pattern mavjud ===
if grep -q "europrint:\|module.*entity.*id\|{module}" \
  apps/api/src/common/cache/cache.service.ts \
  apps/api/src/common/decorators/cacheable.decorator.ts \
  2>/dev/null; then
  pass "Cache key pattern hujjatlashtirilgan"
else
  fail "Cache key pattern topilmadi"
fi

# === 6. REDIS KEYS() TAQIQLANGAN — cache service'da ishlatilmaydi ===
KEYS_USAGE=$(grep -n "\.keys(\|KEYS\b" \
  apps/api/src/common/cache/cache.service.ts \
  2>/dev/null \
  | grep -v "TAQIQLANGAN\|#\|//.*KEYS\|comment\|spec" \
  | wc -l || echo "0")
KEYS_USAGE=$(echo "$KEYS_USAGE" | tr -d '[:space:]')
if [ "$KEYS_USAGE" -eq 0 ]; then
  pass "KEYS() ishlatilmagan (SCAN mavjud)"
else
  fail "KEYS(): $KEYS_USAGE ta ishlatish topildi — SCAN bilan almashtiring"
fi

# === 7. SCAN mavjud ===
if grep -q "\.scan\|SCAN" apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "SCAN: redis.scan() mavjud"
else
  fail "SCAN: redis.scan() topilmadi"
fi

# === 8. L1 → L2 fallback (hit/miss) logikasi ===
if grep -q "l1.*get\|get.*l1\|L1.*L2\|l1Entry" apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "L1 hit → L2 miss fallback logikasi mavjud"
else
  fail "L1/L2 fallback logikasi topilmadi"
fi

# === 9. Graceful degradation (Redis yo'q) ===
if grep -q "Optional\|null.*redis\|!this.redis\|redis.*null" \
  apps/api/src/common/cache/cache.service.ts 2>/dev/null; then
  pass "Graceful degradation: Redis yo'q bo'lsa ishlab turadi"
else
  fail "Graceful degradation topilmadi"
fi

# === 10. Test faylda kesh testlari ===
if grep -q "CacheService\|applyTtlJitter\|mockRedis\|L1.*hit\|L2.*hit" \
  apps/api/test/infrastructure-cache-queue.spec.ts 2>/dev/null; then
  pass "Test: CacheService testlari mavjud"
else
  fail "Test: CacheService testlari topilmadi"
fi

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: cache-usage barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: $FAIL ta tekshiruv muvaffaqiyatsiz" >&2
  exit 1
fi
