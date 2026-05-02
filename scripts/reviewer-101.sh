#!/usr/bin/env bash
# reviewer-101.sh — Task #449: TypeScript regression tuzatish tekshiruvi
# Invariantlar: 1) typecheck 0 xato  2) as any / @ts-ignore yo'q
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "=== Task #449 TypeScript Regression Reviewer ==="

echo ""
echo "--- 1. TypeScript typecheck ---"
TS_ERRORS="$(pnpm --filter @europrint/api run typecheck 2>&1 | grep -c "error TS" || true)"
TS_ERRORS="$(echo "$TS_ERRORS" | tr -d '[:space:]')"
if [ "${TS_ERRORS:-0}" -eq 0 ] 2>/dev/null; then
  echo "[PASS] TypeScript compile xatolari: 0 ta"
else
  echo "[FAIL] TypeScript compile xatolari: $TS_ERRORS ta"
  FAIL=1
fi

echo ""
echo "--- 2. @ts-ignore / as any tekshiruvi ---"
TSIGNORE="$(grep -rn "@ts-ignore" "$ROOT/apps/api/src" --include="*.ts" 2>/dev/null | grep -v "spec\." | wc -l | tr -d '[:space:]')"
if [ "${TSIGNORE:-0}" -eq 0 ] 2>/dev/null; then
  echo "[PASS] @ts-ignore: 0 ta"
else
  echo "[FAIL] @ts-ignore: $TSIGNORE ta"
  FAIL=1
fi

AS_ANY="$(grep -rn "as any\b" "$ROOT/apps/api/src" --include="*.ts" 2>/dev/null | grep -v "spec\.\|\/\/" | wc -l | tr -d '[:space:]')"
if [ "${AS_ANY:-0}" -eq 0 ] 2>/dev/null; then
  echo "[PASS] as any: 0 ta"
else
  echo "[FAIL] as any: $AS_ANY ta"
  FAIL=1
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "BARCHA TEKSHIRUVLAR O'TDI ✓"
  exit 0
else
  echo "XATO: Yuqoridagi [FAIL] qatorlarni tuzating"
  exit 1
fi
