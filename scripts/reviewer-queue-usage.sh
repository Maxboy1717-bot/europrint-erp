#!/usr/bin/env bash
# reviewer-queue-usage.sh — TZ-60: BullMQ navbat tekshiruvi
# Sinxron telegram/PDF chaqiruvlari yo'qligini va 6 navbat mavjudligini tekshiradi.
set -euo pipefail

PASS=0; FAIL=0
pass() { echo "OK:   $1"; PASS=$((PASS+1)); }
fail() { echo "FAIL: $1" >&2; FAIL=$((FAIL+1)); }

echo "=== reviewer-queue-usage: BullMQ 6 navbat tekshiruvi ==="

# === 1. Asosiy fayllar mavjudligi ===
FILES=(
  "apps/api/src/modules/queue/queue.module.ts"
  "apps/api/src/modules/queue/queue.constants.ts"
  "apps/api/src/modules/queue/processors/email.processor.ts"
  "apps/api/src/modules/queue/processors/telegram.processor.ts"
  "apps/api/src/modules/queue/processors/pdf-generation.processor.ts"
  "apps/api/src/modules/queue/processors/label-print.processor.ts"
  "apps/api/src/modules/queue/processors/mrp-run.processor.ts"
  "apps/api/src/modules/queue/processors/forecast-recalc.processor.ts"
)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "$f mavjud"
  else
    fail "$f topilmadi"
  fi
done

# === 2. Barcha 6 navbat nomi belgilangan ===
for Q in email telegram pdf-generation label-print mrp-run forecast-recalc; do
  if grep -q "'$Q'" apps/api/src/modules/queue/queue.constants.ts 2>/dev/null; then
    pass "Navbat '$Q' belgilangan"
  else
    fail "Navbat '$Q' topilmadi"
  fi
done

# === 3. Exponential backoff formulasi mavjud ===
if grep -q "Math.pow(2\|2\*\*\|t_0.*2" apps/api/src/modules/queue/queue.constants.ts 2>/dev/null; then
  pass "Exponential backoff: 2^n mavjud"
else
  fail "Exponential backoff: 2^n topilmadi"
fi

if grep -q "1_800_000\|1800000" apps/api/src/modules/queue/queue.constants.ts 2>/dev/null; then
  pass "Backoff t_max = 1800000ms belgilangan"
else
  fail "Backoff t_max topilmadi"
fi

# === 4. removeOnComplete=100 belgilangan ===
if grep -q "removeOnComplete.*100\|count: 100" apps/api/src/modules/queue/queue.module.ts 2>/dev/null; then
  pass "removeOnComplete: 100 mavjud"
else
  fail "removeOnComplete: 100 topilmadi"
fi

# === 5. WorkerHost import (NestJS BullMQ pattern) ===
WORKER_COUNT=$(grep -l "WorkerHost" apps/api/src/modules/queue/processors/*.ts 2>/dev/null | wc -l | tr -d '[:space:]')
if [ "$WORKER_COUNT" -ge 6 ]; then
  pass "WorkerHost: $WORKER_COUNT ta processor mavjud (kamida 6 kerak)"
else
  fail "WorkerHost: $WORKER_COUNT ta topildi (kamida 6 kerak)"
fi

# === 6. Sinxron telegram/PDF TAQIQLANGAN: yangi kodda to'g'ridan-to'g'ri axios/telegramBot chaqiruvi yo'q ===
SYNC_TELEGRAM=$(grep -rn "axios.post.*telegram\|sendMessage.*await\|telegramBot.send" \
  apps/api/src/modules/ \
  --include="*.ts" \
  2>/dev/null \
  | grep -v "processors\|spec\|test\|TAQIQLANGAN" \
  | wc -l || echo "0")
SYNC_TELEGRAM=$(echo "$SYNC_TELEGRAM" | tr -d '[:space:]')
if [ "$SYNC_TELEGRAM" -eq 0 ]; then
  pass "Sinxron Telegram chaqiruv: yangi controller/service'larda topilmadi"
else
  fail "Sinxron Telegram: $SYNC_TELEGRAM ta to'g'ridan-to'g'ri chaqiruv topildi"
fi

# === 7. MaterializedViewRefreshService mavjud ===
if [ -f "apps/api/src/modules/queue/materialized-view-refresh.service.ts" ]; then
  pass "MaterializedViewRefreshService mavjud"
else
  fail "MaterializedViewRefreshService topilmadi"
fi

if grep -q "REFRESH MATERIALIZED VIEW CONCURRENTLY" \
  apps/api/src/modules/queue/materialized-view-refresh.service.ts 2>/dev/null; then
  pass "MV REFRESH CONCURRENTLY mavjud"
else
  fail "MV REFRESH CONCURRENTLY topilmadi"
fi

if grep -q "0,15,30,45\|CronExpression\|Cron" \
  apps/api/src/modules/queue/materialized-view-refresh.service.ts 2>/dev/null; then
  pass "15 daqiqalik Cron belgilangan"
else
  fail "15 daqiqalik Cron topilmadi"
fi

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: queue-usage barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: $FAIL ta tekshiruv muvaffaqiyatsiz" >&2
  exit 1
fi
