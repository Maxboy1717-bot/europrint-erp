#!/bin/bash
# QATLAM 4: Controller Audit
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 4: Controller ==="
SRC="$BASE/apps/api/src"

# 4.1 Himoyasiz controllerlar (@UseGuards yo'q, auth.controller emas)
UNGUARDED=0
UNGUARDED_FILES=""
while IFS= read -r f; do
  BASENAME=$(basename "$f")
  # auth va health controllerlar mustasno
  if echo "$BASENAME" | grep -qE "auth\.controller|health\.controller|metrics\.controller|public\.controller"; then
    continue
  fi
  if ! grep -q "@UseGuards\|@Public()\|JwtAuthGuard\|RolesGuard\|PermissionGuard" "$f" 2>/dev/null; then
    UNGUARDED=$((UNGUARDED+1))
    UNGUARDED_FILES="$UNGUARDED_FILES\n  $(echo $f | sed 's|.*/src/|src/|')"
  fi
done < <(find "$SRC" -name "*.controller.ts" ! -name "*.spec.ts" 2>/dev/null)

if [ $UNGUARDED -gt 0 ]; then
  echo "✘ Himoyasiz controllerlar: $UNGUARDED ta"
  echo -e "$UNGUARDED_FILES" | head -10
  FAIL=$((FAIL+1))
else
  echo "✔ Barcha controllerlar himoyalangan"
  PASS=$((PASS+1))
fi

# 4.2 @ApiTags dekorator
APITAGS=$(grep -rl "@ApiTags" "$SRC" 2>/dev/null | wc -l)
CTRL_TOTAL=$(find "$SRC" -name "*.controller.ts" ! -name "*.spec.ts" | wc -l)
if [ "$APITAGS" -gt $((CTRL_TOTAL/2)) ]; then
  echo "✔ @ApiTags: $APITAGS/$CTRL_TOTAL controller"
  PASS=$((PASS+1))
else
  echo "⚠ @ApiTags kam: $APITAGS/$CTRL_TOTAL controller"
  WARN=$((WARN+1))
fi

# 4.3 @ApiResponse
APIRESPONSE=$(grep -rl "@ApiResponse\|@ApiOkResponse\|@ApiCreatedResponse" "$SRC" 2>/dev/null | wc -l)
if [ "$APIRESPONSE" -gt 20 ]; then
  echo "✔ @ApiResponse: $APIRESPONSE fayl"
  PASS=$((PASS+1))
else
  echo "⚠ @ApiResponse kam: $APIRESPONSE fayl"
  WARN=$((WARN+1))
fi

# 4.4 Controller soni
echo "✔ Jami controllerlar: $CTRL_TOTAL ta"
PASS=$((PASS+1))

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
