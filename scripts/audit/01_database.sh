#!/bin/bash
# QATLAM 1: Database Schema Audit
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 1: Database Schema ==="

# 1.1 Schema fayllar
SCHEMA_DIR="$BASE/lib/db/src/schema"
if [ -d "$SCHEMA_DIR" ]; then
  COUNT=$(find "$SCHEMA_DIR" -name "*.ts" | wc -l)
  echo "✔ Schema fayllar: $COUNT ta"
  PASS=$((PASS+1))
else
  echo "✘ Schema papkasi topilmadi"
  FAIL=$((FAIL+1))
fi

# 1.2 updated_at trigger/field
TRIGGER_FOUND=$(grep -rl "updated_at\|fn_set_updated_at\|updatedAt" "$BASE/lib/db/src/schema" 2>/dev/null | wc -l)
if [ "$TRIGGER_FOUND" -gt 0 ]; then
  echo "✔ updated_at field/trigger: $TRIGGER_FOUND fayl"
  PASS=$((PASS+1))
else
  echo "✘ updated_at trigger/function topilmadi"
  FAIL=$((FAIL+1))
fi

# 1.3 Migration fayllar
MIGRATION_DIR="$BASE/lib/db/drizzle"
if [ -d "$MIGRATION_DIR" ]; then
  MIG_COUNT=$(find "$MIGRATION_DIR" -name "*.sql" | wc -l)
  echo "✔ Migration fayllar: $MIG_COUNT ta"
  PASS=$((PASS+1))
else
  echo "⚠ Migration papkasi topilmadi"
  WARN=$((WARN+1))
fi

# 1.4 CHECK constraints
CHECK_FOUND=$(grep -rl "check\|CHECK\|CONSTRAINT" "$BASE/lib/db/src/schema" 2>/dev/null | wc -l)
if [ "$CHECK_FOUND" -gt 0 ]; then
  echo "✔ CHECK constraints: $CHECK_FOUND fayl"
  PASS=$((PASS+1))
else
  echo "⚠ CHECK constraints topilmadi"
  WARN=$((WARN+1))
fi

# 1.5 Index
INDEX_FOUND=$(grep -rl "\.index\b\|pgIndex\|uniqueIndex\|index(" "$BASE/lib/db/src/schema" 2>/dev/null | wc -l)
if [ "$INDEX_FOUND" -gt 0 ]; then
  echo "✔ Index lar: $INDEX_FOUND fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Index lar topilmadi"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
