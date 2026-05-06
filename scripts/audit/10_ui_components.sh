#!/bin/bash
# QATLAM 10: UI Components
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 10: UI Components ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 10.1 shadcn/ui komponenti
SHADCN=$(grep -rl "@/components/ui\|shadcn\|radix-ui" "$DASH" 2>/dev/null | wc -l)
if [ "$SHADCN" -gt 10 ]; then
  echo "✔ shadcn/ui: $SHADCN fayl"
  PASS=$((PASS+1))
else
  echo "⚠ shadcn/ui kam: $SHADCN fayl"
  WARN=$((WARN+1))
fi

# 10.2 zodResolver form validatsiya
if grep -rl "zodResolver" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ zodResolver form validatsiya topildi"
  PASS=$((PASS+1))
else
  echo "✘ zodResolver yo'q — form validatsiya qilinmaydi"
  FAIL=$((FAIL+1))
fi

# 10.3 React Hook Form
RHF=$(grep -rl "useForm\|react-hook-form" "$DASH" 2>/dev/null | wc -l)
if [ "$RHF" -gt 3 ]; then
  echo "✔ React Hook Form: $RHF fayl"
  PASS=$((PASS+1))
else
  echo "⚠ React Hook Form kam: $RHF fayl"
  WARN=$((WARN+1))
fi

# 10.4 Tailwind CSS
TAILWIND=$(grep -rl "className.*bg-\|className.*flex\|className.*grid" "$DASH" 2>/dev/null | wc -l)
if [ "$TAILWIND" -gt 10 ]; then
  echo "✔ Tailwind CSS: $TAILWIND fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Tailwind CSS kam: $TAILWIND fayl"
  WARN=$((WARN+1))
fi

# 10.5 Toast/notification
TOAST=$(grep -rl "toast\|Toast\|useToast\|sonner" "$DASH" 2>/dev/null | wc -l)
if [ "$TOAST" -gt 3 ]; then
  echo "✔ Toast/notification: $TOAST fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Toast/notification kam: $TOAST fayl"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
