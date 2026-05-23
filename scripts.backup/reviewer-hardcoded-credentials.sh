#!/usr/bin/env bash
set -euo pipefail
echo "═══════════════════════════════════════════════════════"
echo "  Hardcoded Credentials Reviewer (Qoida A)"
echo "═══════════════════════════════════════════════════════"
ROOT="apps/api/src"
violations=0
patterns=(
  "Admin123!"
  "test123"
  "'password'\s*:\s*'[a-zA-Z0-9]{4,}'"
  "'\\\$2[abxy]\\\$[0-9]{2}\\\$[A-Za-z0-9./]{53}'"   # bcrypt hash literal
)
for p in "${patterns[@]}"; do
  hits=$(grep -rEn "$p" "$ROOT" --include="*.ts" --include="*.sql" 2>/dev/null | grep -v "// SECURITY:\|@deprecated" || true)
  if [ -n "$hits" ]; then
    echo "✗ Pattern: $p"
    echo "$hits" | head -5 | sed 's/^/    /'
    cnt=$(echo "$hits" | wc -l)
    violations=$((violations + cnt))
  fi
done
echo ""
if [ $violations -eq 0 ]; then
  echo "PASS: 0 hardcoded credentials detected"
else
  echo "FAIL: $violations hardcoded credential(s) detected"
  exit 1
fi
