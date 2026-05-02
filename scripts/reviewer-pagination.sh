#!/usr/bin/env bash
# reviewer-pagination.sh — TZ-61: Keyset Cursor Pagination tekshiruvi
# OFFSET yo'qligini va cursor pagination mavjudligini tekshiradi.
set -euo pipefail

PASS=0; FAIL=0
pass() { echo "OK:   $1"; PASS=$((PASS+1)); }
fail() { echo "FAIL: $1" >&2; FAIL=$((FAIL+1)); }

echo "=== reviewer-pagination: Keyset Cursor Pagination tekshiruvi ==="

# === 1. Asosiy fayllar ===
if [ -f "apps/api/src/common/pagination/keyset-pagination.service.ts" ]; then
  pass "KeysetPaginationService mavjud"
else
  fail "KeysetPaginationService topilmadi"
fi

# === 2. Cursor encode/decode ===
if grep -q "base64url\|base64" apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "Cursor: base64/base64url encoding mavjud"
else
  fail "Cursor: base64 encoding topilmadi"
fi

if grep -q "JSON.stringify\|JSON.parse" apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "Cursor: JSON serialization mavjud"
else
  fail "Cursor: JSON serialization topilmadi"
fi

# === 3. Keyset WHERE formulasi ===
if grep -q "createdAt\|created_at" apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "Keyset: created_at field mavjud"
else
  fail "Keyset: created_at field topilmadi"
fi

# === 4. Opaque cursor interface ===
if grep -q "KeysetCursor\|opaque\|cursor" apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "KeysetCursor interfeysi mavjud"
else
  fail "KeysetCursor interfeysi topilmadi"
fi

# === 5. hasMore va nextCursor ===
if grep -q "hasMore\|nextCursor" apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "PageResult: hasMore, nextCursor mavjud"
else
  fail "PageResult: hasMore/nextCursor topilmadi"
fi

# === 6. OFFSET so'zi pagination service'da yo'q ===
OFFSET_IN_PAGINATION=$(grep -n "OFFSET\|\.skip\|page.*\*.*limit" \
  apps/api/src/common/pagination/keyset-pagination.service.ts \
  2>/dev/null \
  | grep -v "TAQIQLANGAN\|//\|\*\|spec\|test\|comment" \
  | wc -l || echo "0")
OFFSET_IN_PAGINATION=$(echo "$OFFSET_IN_PAGINATION" | tr -d '[:space:]')
if [ "$OFFSET_IN_PAGINATION" -eq 0 ]; then
  pass "Keyset pagination: OFFSET ishlatilmagan"
else
  fail "Keyset pagination: $OFFSET_IN_PAGINATION ta OFFSET topildi — OFFSET taqiqlangan"
fi

# === 7. Validation mavjud ===
if grep -q "VALIDATION\|limit.*1\|kMin\|toBe.*false" \
  apps/api/src/common/pagination/keyset-pagination.service.ts 2>/dev/null; then
  pass "Keyset: input validation mavjud"
else
  fail "Keyset: input validation topilmadi"
fi

# === 8. Test faylda keyset testlari ===
if grep -q "KeysetPaginationService\|paginateInMemory\|encodeCursor" \
  apps/api/test/infrastructure-cache-queue.spec.ts 2>/dev/null; then
  pass "Test: KeysetPaginationService testlari mavjud"
else
  fail "Test: KeysetPaginationService testlari topilmadi"
fi

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: pagination barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: $FAIL ta tekshiruv muvaffaqiyatsiz" >&2
  exit 1
fi
