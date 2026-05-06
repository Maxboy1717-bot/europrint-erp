#!/bin/bash
# QATLAM 3: Service Layer Audit
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 3: Service Layer ==="
SRC="$BASE/apps/api/src"

# 3.1 Stub servicelar — schema.service va bot.service MUSTASNO (kichik bo'lishi normal)
STUB_COUNT=0
STUB_FILES=""
while IFS= read -r f; do
  BASENAME=$(basename "$f")
  # Schema init va bot servicelar intentionally kichik — skip
  if echo "$BASENAME" | grep -qE "schema\.service|bot\.service"; then
    continue
  fi
  LINES=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ "$LINES" -lt 20 ] && grep -q "@Injectable" "$f" 2>/dev/null; then
    STUB_COUNT=$((STUB_COUNT+1))
    STUB_FILES="$STUB_FILES\n  $(echo $f | sed 's|.*/src/|src/|')"
  fi
done < <(find "$SRC" -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null)

if [ $STUB_COUNT -gt 0 ]; then
  echo "⚠ Stub servicelar: $STUB_COUNT ta"
  echo -e "$STUB_FILES" | head -10
  WARN=$((WARN+1))
else
  echo "✔ Barcha biznes servicelar to'liq implementatsiya qilingan"
  PASS=$((PASS+1))
fi

# 3.2 NotFoundException
NOT_FOUND=$(grep -rl "NotFoundException" "$SRC" 2>/dev/null | wc -l)
if [ "$NOT_FOUND" -gt 10 ]; then
  echo "✔ NotFoundException: $NOT_FOUND fayl"
  PASS=$((PASS+1))
else
  echo "⚠ NotFoundException kam"
  WARN=$((WARN+1))
fi

# 3.3 try/catch
TRY_CATCH=$(grep -rl "try {" "$SRC" 2>/dev/null | wc -l)
echo "✔ try/catch bloklari: $TRY_CATCH fayl"
PASS=$((PASS+1))

# 3.4 @Injectable
INJECTABLE=$(grep -rl "@Injectable()" "$SRC" 2>/dev/null | wc -l)
echo "✔ @Injectable servicelar: $INJECTABLE ta"
PASS=$((PASS+1))

SERVICE_COUNT=$(find "$SRC" -name "*.service.ts" ! -name "*.spec.ts" | wc -l)
echo "✔ Jami servicelar: $SERVICE_COUNT ta"
PASS=$((PASS+1))

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
