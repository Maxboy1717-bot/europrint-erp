#!/bin/bash
# QATLAM 2: ORM / Repository Audit
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 2: ORM / Repository ==="
SRC="$BASE/apps/api/src"

# 2.1 N+1 query xavfi: for loop ichida await db.select/query
N1_FILES=$(grep -rl "for.*of\|forEach" "$SRC" 2>/dev/null | xargs grep -l "await.*db\.\|await.*select\|await.*query" 2>/dev/null)
N1_COUNT=$(echo "$N1_FILES" | grep -c "." || echo 0)
if [ "$N1_COUNT" -gt 0 ]; then
  echo "⚠ N+1 query xavfi: $N1_COUNT fayl"
  echo "$N1_FILES" | head -5 | sed 's|.*/src/|  src/|'
  WARN=$((WARN+1))
else
  echo "✔ N+1 query xavfi topilmadi"
  PASS=$((PASS+1))
fi

# 2.2 inArray ishlatilganmi?
INARRAY_FOUND=$(grep -rl "inArray" "$SRC" 2>/dev/null | wc -l)
if [ "$INARRAY_FOUND" -gt 0 ]; then
  echo "✔ inArray ishlatilmoqda ($INARRAY_FOUND fayl)"
  PASS=$((PASS+1))
else
  echo "⚠ inArray ishlatilmayapti — batch query yo'q bo'lishi mumkin"
  WARN=$((WARN+1))
fi

# 2.3 Raw SQL (sql`...`) haddan tashqari ko'p?
RAW_SQL=$(grep -rl 'sql`' "$SRC" 2>/dev/null | wc -l)
if [ "$RAW_SQL" -gt 20 ]; then
  echo "⚠ Ko'p raw SQL: $RAW_SQL fayl — ORM dan ko'proq foydalaning"
  WARN=$((WARN+1))
else
  echo "✔ Raw SQL maqbul miqdorda ($RAW_SQL fayl)"
  PASS=$((PASS+1))
fi

# 2.4 DrizzleService ishlatilganmi?
DRIZZLE_USAGE=$(grep -rl "DrizzleService\|drizzle\(\)" "$SRC" 2>/dev/null | wc -l)
if [ "$DRIZZLE_USAGE" -gt 5 ]; then
  echo "✔ DrizzleService keng ishlatilmoqda ($DRIZZLE_USAGE fayl)"
  PASS=$((PASS+1))
else
  echo "⚠ DrizzleService kam ishlatilmoqda"
  WARN=$((WARN+1))
fi

# 2.5 .returning() ishlatilganmi?
RETURNING=$(grep -rl "\.returning()" "$SRC" 2>/dev/null | wc -l)
if [ "$RETURNING" -gt 5 ]; then
  echo "✔ .returning() ishlatilmoqda ($RETURNING fayl)"
  PASS=$((PASS+1))
else
  echo "⚠ .returning() kam — insert/update'dan keyin ID qaytarilmaydi"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
