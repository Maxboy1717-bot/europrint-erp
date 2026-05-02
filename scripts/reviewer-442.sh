#!/usr/bin/env bash
# Task #442: Queue processors TODO tekshiruvi
# Ishlatish: bash scripts/reviewer-442.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROC_DIR="$ROOT/apps/api/src/modules/queue/processors"
FAIL=0

check() {
  local label="$1"
  local result
  result="$(echo "$2" | tr -d '[:space:]')"
  local detail="${3:-}"
  if [ "${result:-0}" -eq 0 ] 2>/dev/null; then
    echo "[PASS] $label"
  else
    echo "[FAIL] $label${detail:+ — $detail}"
    FAIL=1
  fi
}

check_file_exists() {
  local file="$1"
  local label="$2"
  if [ ! -f "$file" ]; then
    echo "[FAIL] $label — fayl mavjud emas: $file"
    FAIL=1
    return 1
  fi
  return 0
}

safe_grep_count() {
  local pattern="$1"
  local file="$2"
  set +e
  local count
  count=$(grep -c "$pattern" "$file" 2>/dev/null)
  local ec=$?
  set -e
  if [ $ec -eq 0 ] || [ $ec -eq 1 ]; then
    echo "${count:-0}"
  else
    echo "0"
  fi
}

# --- 1. Barcha processor fayllarda TODO yo'q ---
echo "=== 1. Processor-larda TODO tekshiruvi ==="
PROCESSORS=(
  "email.processor.ts"
  "telegram.processor.ts"
  "pdf-generation.processor.ts"
  "mrp-run.processor.ts"
  "forecast-recalc.processor.ts"
  "label-print.processor.ts"
)

for proc in "${PROCESSORS[@]}"; do
  filepath="$PROC_DIR/$proc"
  check_file_exists "$filepath" "$proc mavjud" || continue
  TODO_COUNT=$(grep -c "// TODO\|// todo\|// FIXME" "$filepath" 2>/dev/null || true)
  TODO_COUNT="$(echo "${TODO_COUNT:-0}" | tr -d '[:space:]')"
  check "$proc: 0 TODO (hozir: $TODO_COUNT)" "$TODO_COUNT"
done

# --- 2. email processor — SMTP/SES yoki NotificationService import ---
echo "=== 2. email.processor.ts implementatsiya ==="
EMAIL_FILE="$PROC_DIR/email.processor.ts"
if [ -f "$EMAIL_FILE" ]; then
  EMAIL_IMPL=$(grep -c "nodemailer\|SmtpService\|NotificationService\|MailerService\|sendMail\|createTransport" \
    "$EMAIL_FILE" 2>/dev/null || true)
  EMAIL_IMPL="$(echo "${EMAIL_IMPL:-0}" | tr -d '[:space:]')"
  [ "${EMAIL_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "email: yuborish implementatsiyasi bor ($EMAIL_IMPL ta)" "$RES"
fi

# --- 3. telegram processor — Telegram API ---
echo "=== 3. telegram.processor.ts implementatsiya ==="
TG_FILE="$PROC_DIR/telegram.processor.ts"
if [ -f "$TG_FILE" ]; then
  TG_IMPL=$(grep -c "TelegramService\|TELEGRAM_BOT_TOKEN\|sendMessage\|axios\|telegram" \
    "$TG_FILE" 2>/dev/null || true)
  TG_IMPL="$(echo "${TG_IMPL:-0}" | tr -d '[:space:]')"
  [ "${TG_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "telegram: xabar yuborish implementatsiyasi bor ($TG_IMPL ta)" "$RES"
fi

# --- 4. pdf-generation processor — PDF library ---
echo "=== 4. pdf-generation.processor.ts implementatsiya ==="
PDF_FILE="$PROC_DIR/pdf-generation.processor.ts"
if [ -f "$PDF_FILE" ]; then
  PDF_IMPL=$(grep -c "pdf-lib\|puppeteer\|PdfService\|generatePdf\|PDFDocument" \
    "$PDF_FILE" 2>/dev/null || true)
  PDF_IMPL="$(echo "${PDF_IMPL:-0}" | tr -d '[:space:]')"
  [ "${PDF_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "pdf: generatsiya implementatsiyasi bor ($PDF_IMPL ta)" "$RES"
fi

# --- 5. mrp-run processor — MRP service ---
echo "=== 5. mrp-run.processor.ts implementatsiya ==="
MRP_FILE="$PROC_DIR/mrp-run.processor.ts"
if [ -f "$MRP_FILE" ]; then
  MRP_IMPL=$(grep -c "MrpService\|MrpPlanningService\|RunMrpHandler\|runMrp\|mrpService\|BomExplosionService\|bomService" \
    "$MRP_FILE" 2>/dev/null || true)
  MRP_IMPL="$(echo "${MRP_IMPL:-0}" | tr -d '[:space:]')"
  [ "${MRP_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "mrp: planning engine implementatsiyasi bor ($MRP_IMPL ta)" "$RES"
fi

# --- 6. forecast-recalc processor — DemandForecastService ---
echo "=== 6. forecast-recalc.processor.ts implementatsiya ==="
FORECAST_FILE="$PROC_DIR/forecast-recalc.processor.ts"
if [ -f "$FORECAST_FILE" ]; then
  FORECAST_IMPL=$(grep -c "DemandForecastService\|forecastService\|recalculate\|ForecastService\|persistSvc\|forecastSvc" \
    "$FORECAST_FILE" 2>/dev/null || true)
  FORECAST_IMPL="$(echo "${FORECAST_IMPL:-0}" | tr -d '[:space:]')"
  [ "${FORECAST_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "forecast: recalculate implementatsiyasi bor ($FORECAST_IMPL ta)" "$RES"
fi

# --- 7. label-print processor — printer ---
echo "=== 7. label-print.processor.ts implementatsiya ==="
LABEL_FILE="$PROC_DIR/label-print.processor.ts"
if [ -f "$LABEL_FILE" ]; then
  LABEL_IMPL=$(grep -c "PrinterService\|PRINTER_HOST\|ZPL\|TSPL\|net\.\|sendToTcpPrinter\|buildZpl" \
    "$LABEL_FILE" 2>/dev/null || true)
  LABEL_IMPL="$(echo "${LABEL_IMPL:-0}" | tr -d '[:space:]')"
  [ "${LABEL_IMPL:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "label: printer implementatsiyasi bor ($LABEL_IMPL ta)" "$RES"
fi

# --- 8. Barcha processorlar try/catch bilan o'ralgan ---
echo "=== 8. try/catch himoyasi ==="
for proc in "${PROCESSORS[@]}"; do
  filepath="$PROC_DIR/$proc"
  [ -f "$filepath" ] || continue
  TRY_COUNT=$(grep -c "try {" "$filepath" 2>/dev/null || true)
  TRY_COUNT="$(echo "${TRY_COUNT:-0}" | tr -d '[:space:]')"
  [ "${TRY_COUNT:-0}" -ge 1 ] 2>/dev/null && RES=0 || RES=1
  check "$proc: try/catch bor" "$RES"
done

# --- Yakuniy ---
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
else
  echo "XATO: $FAIL tekshiruv FAIL"
  exit 1
fi
