#!/bin/bash
# QATLAM 11: i18n
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 11: i18n ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 11.1 i18n kutubxonasi
if grep -rl "i18next\|react-i18next\|useTranslation\|i18n" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ i18n kutubxonasi topildi"
  PASS=$((PASS+1))
else
  echo "⚠ i18n kutubxonasi topilmadi — hardcoded matnlar bo'lishi mumkin"
  WARN=$((WARN+1))
fi

# 11.2 Translation fayllar
TRANS_FILES=$(find "$DASH" -name "uz.json" -o -name "*.json" -path "*/locales/*" -o -name "*.json" -path "*/translations/*" 2>/dev/null | wc -l)
if [ "$TRANS_FILES" -gt 0 ]; then
  echo "✔ Translation fayllar: $TRANS_FILES ta"
  PASS=$((PASS+1))
else
  echo "⚠ Translation fayllar topilmadi"
  WARN=$((WARN+1))
fi

# 11.3 Hardcoded o'zbekcha matnlar
HARDCODED=$(grep -rl "Saqlash\|Bekor\|O'chirish\|Qo'shish\|Tahrirlash\|Yuborish\|Izlash" "$DASH" 2>/dev/null | grep -v ".json" | wc -l)
if [ "$HARDCODED" -gt 20 ]; then
  echo "⚠ Hardcoded o'zbekcha matnlar: $HARDCODED fayl"
  WARN=$((WARN+1))
elif [ "$HARDCODED" -gt 0 ]; then
  echo "⚠ Ba'zi hardcoded matnlar: $HARDCODED fayl"
  WARN=$((WARN+1))
else
  echo "✔ Hardcoded matn topilmadi"
  PASS=$((PASS+1))
fi

# 11.4 t() function
T_FUNC=$(grep -rl "t('\|t(\"" "$DASH" 2>/dev/null | wc -l)
if [ "$T_FUNC" -gt 5 ]; then
  echo "✔ t() funksiyasi: $T_FUNC fayl"
  PASS=$((PASS+1))
else
  echo "⚠ t() funksiyasi kam: $T_FUNC fayl"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
