#!/usr/bin/env bash
# Reviewer: process.env to'g'ridan foydalanish
PASS=0; FAIL=0

# Ruxsat berilgan fayllar
ALLOWED_FILES=(
  "apps/api/src/main.ts"
  "apps/api/src/config"
  # WebSocket / decorator-time CORS callbacks run BEFORE DI is bootstrapped,
  # so ConfigService is unavailable. process.env is the only correct option.
  "apps/api/src/modules/pos/presentation/pos.gateway.ts"
)

# Tekshiriladigan modules
while IFS= read -r match; do
  FILE=$(echo "$match" | cut -d: -f1)
  LINE=$(echo "$match" | cut -d: -f2)

  # Ruxsat berilgan faylmi?
  ALLOWED=0
  for af in "${ALLOWED_FILES[@]}"; do
    if [[ "$FILE" == *"$af"* ]]; then ALLOWED=1; break; fi
  done

  if [ "$ALLOWED" -eq 1 ]; then
    echo "  ~ $FILE:$LINE (ruxsat berilgan fayl)"; continue
  fi

  # NODE_ENV maxsus holat
  if echo "$match" | grep -q "process\.env\.NODE_ENV"; then
    echo "  ⚠ $FILE:$LINE — NODE_ENV faqat main.ts da bo'lsin"
    FAIL=$((FAIL + 1))
  else
    echo "  ✗ $FILE:$LINE — process.env to'g'ridan (ConfigService ishlatilsin)"
    FAIL=$((FAIL + 1))
  fi
done < <(grep -rn "process\.env\." apps/api/src/modules/ \
  --include="*.ts" 2>/dev/null \
  | grep -v "spec\|test" \
  | grep -vE ':[[:space:]]*\*|:[[:space:]]*//|:[[:space:]]*\* ')   # skip block-/line-comments

if [ "$FAIL" -eq 0 ]; then
  echo "  ✓ Barcha env qiymatlar ConfigService orqali"; PASS=$((PASS + 1))
fi

echo "PASS: $PASS  FAIL: $FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
