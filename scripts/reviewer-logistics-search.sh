#!/usr/bin/env bash
# reviewer-logistics-search.sh — Task #434: Logistika va Qidiruv tekshiruvi
# Ishlatish: bash scripts/reviewer-logistics-search.sh (papkadan: /home/runner/workspace)
set -euo pipefail
FAIL=0

pass() { echo "OK:   $1"; }
fail() { echo "FAIL: $1"; ((FAIL++)); }

# === Fayl mavjudligi ===
FILES=(
  "apps/api/src/modules/logistics/domain/services/geo.service.ts"
  "apps/api/src/modules/logistics/domain/services/route.service.ts"
  "apps/api/src/modules/logistics/domain/services/vrp.service.ts"
  "apps/api/src/modules/common/search/fuzzy-search.service.ts"
  "apps/api/src/modules/common/search/kmeans.service.ts"
)

for f in "${FILES[@]}"; do
  if test -f "$f"; then
    pass "$f mavjud"
  else
    fail "$f topilmadi"
  fi
done

# === Haversine EARTH_RADIUS_KM = 6371 ===
if grep -q "EARTH_RADIUS_KM = 6371\|6371" apps/api/src/modules/logistics/domain/services/geo.service.ts 2>/dev/null; then
  pass "Haversine: R=6371 km mavjud"
else
  fail "Haversine: R=6371 km topilmadi"
fi

# === Haversine: radians konvertatsiya ===
if grep -q "Math.PI / 180\|toRad" apps/api/src/modules/logistics/domain/services/geo.service.ts 2>/dev/null; then
  pass "Haversine: radians konvertatsiya mavjud"
else
  fail "Haversine: radians konvertatsiya topilmadi"
fi

# === Dijkstra: min-heap (priority queue) ===
if grep -q "MinHeap\|pq\|priority" apps/api/src/modules/logistics/domain/services/route.service.ts 2>/dev/null; then
  pass "Dijkstra: priority queue mavjud"
else
  fail "Dijkstra: priority queue topilmadi"
fi

# === VRP: Clarke-Wright savings formula ===
if grep -q "saving\|savings\|clarkeWright" apps/api/src/modules/logistics/domain/services/vrp.service.ts 2>/dev/null; then
  pass "VRP: Clarke-Wright savings mavjud"
else
  fail "VRP: Clarke-Wright savings topilmadi"
fi

# === VRP: 2-opt ===
if grep -q "twoOpt\|two.opt\|2.opt" apps/api/src/modules/logistics/domain/services/vrp.service.ts 2>/dev/null; then
  pass "VRP: 2-opt mavjud"
else
  fail "VRP: 2-opt topilmadi"
fi

# === Levenshtein DP ===
if grep -q "levenshtein\|curr\[j\]\|Math.min.*prev" apps/api/src/modules/common/search/fuzzy-search.service.ts 2>/dev/null; then
  pass "Levenshtein: DP algoritmi mavjud"
else
  fail "Levenshtein: DP algoritmi topilmadi"
fi

# === BM25/FTS: ts_rank_cd ===
if grep -q "ts_rank_cd\|to_tsvector\|to_tsquery" apps/api/src/modules/common/search/fuzzy-search.service.ts 2>/dev/null; then
  pass "BM25/FTS: ts_rank_cd va tsvector mavjud"
else
  fail "BM25/FTS: ts_rank_cd topilmadi"
fi

# === FTS: yangi qidiruv/logistika servislarida LIKE '%...' taqiqlanganligini tekshirish ===
LIKECOUNT=$(grep -rn "LIKE '%\|ilike.*'%" \
  apps/api/src/modules/logistics/ \
  apps/api/src/modules/common/search/ \
  2>/dev/null \
  | grep -v "test\|spec\|migration\|\.spec\.\|\.test\.\|TAQIQLANGAN\|comment\|#" \
  | wc -l || echo "0") && LIKECOUNT=$(echo "$LIKECOUNT" | tr -d '[:space:]')
if [ "$LIKECOUNT" -eq 0 ]; then
  pass "Yangi servislar: LIKE '%...' ishlatilmagan (FTS/trigram ishlatilmoqda)"
else
  fail "Yangi servislar: $LIKECOUNT ta LIKE '%...' topildi — FTS/trigram ishlatilsin"
fi

# === K-Means silhouette ===
if grep -q "silhouette\|Silhouette" apps/api/src/modules/common/search/kmeans.service.ts 2>/dev/null; then
  pass "K-Means: silhouette score mavjud"
else
  fail "K-Means: silhouette score topilmadi"
fi

# === K-Means: optimal k topish ===
if grep -q "findOptimalK\|optimal.*k\|optimalK" apps/api/src/modules/common/search/kmeans.service.ts 2>/dev/null; then
  pass "K-Means: optimal k topish mavjud"
else
  fail "K-Means: optimal k topish topilmadi"
fi

# === @Calculation decorator ishlatilmoqda ===
CALC_COUNT=$(grep -rn "@Calculation" \
  apps/api/src/modules/logistics/domain/services/geo.service.ts \
  apps/api/src/modules/logistics/domain/services/route.service.ts \
  apps/api/src/modules/logistics/domain/services/vrp.service.ts \
  apps/api/src/modules/common/search/fuzzy-search.service.ts \
  apps/api/src/modules/common/search/kmeans.service.ts \
  2>/dev/null | wc -l | tr -d '[:space:]')
if [ "$CALC_COUNT" -ge 4 ]; then
  pass "@Calculation decorator: $CALC_COUNT ta (kamida 4 kerak)"
else
  fail "@Calculation decorator: $CALC_COUNT ta (kamida 4 kerak)"
fi

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: logistics-search barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: $FAIL ta xato topildi"
  exit 1
fi
