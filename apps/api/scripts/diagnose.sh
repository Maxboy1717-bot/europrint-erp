#!/usr/bin/env bash
# HR Task #250 — Root cause diagnostics (NixOS compatible)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
RED='\033[0;31m'; YEL='\033[1;33m'; GRN='\033[0;32m'; BLU='\033[0;34m'; CYN='\033[0;36m'; NC='\033[0m'

pass() { echo -e "${GRN}  ✓${NC}  $1"; }
fail() { echo -e "${RED}  ✗${NC}  $1"; }
warn() { echo -e "${YEL}  ⚠${NC}  $1"; }
info() { echo -e "${CYN}    ${NC}$1"; }
hdr()  { echo -e "\n${BLU}══════ $1 ══════${NC}"; }

ERRORS=0; WARNINGS=0
err() { ERRORS=$((ERRORS+1)); fail "$1"; }
wrn() { WARNINGS=$((WARNINGS+1)); warn "$1"; }

# ── 1. SQL TO'G'RIDAN CONTROLLER ICHIDA ────────────────────────────────────
hdr "1. SQL TO'G'RIDAN CONTROLLER ICHIDA"
SQL_FILES=$(grep -rl "db\.execute" "$SRC" --include="*.controller.ts" 2>/dev/null | sort)
if [ -z "$SQL_FILES" ]; then
  pass "Controller ichida to'g'ridan SQL yo'q"
else
  COUNT=$(echo "$SQL_FILES" | wc -l | tr -d ' ')
  err "$COUNT ta controllerda to'g'ridan db.execute — SQL Servicega ko'chirilishi kerak:"
  echo "$SQL_FILES" | while IFS= read -r f; do
    N=$(grep -c "db\.execute" "$f" 2>/dev/null || echo 0)
    rel="${f#$ROOT/}"
    echo "     $N × $rel"
  done
fi

# ── 2. LOCAL BOILERPLATE COPY-PASTE ─────────────────────────────────────────
hdr "2. COPY-PASTE BOILERPLATE (rows/safeInt lokal ta'rif)"
BP_FILES=$(grep -rl "^function rows\|^function safeInt" "$SRC" --include="*.ts" 2>/dev/null | sort)
if [ -z "$BP_FILES" ]; then
  pass "Lokal rows()/safeInt() topilmadi — dbRows() import qilingan"
else
  COUNT=$(echo "$BP_FILES" | wc -l | tr -d ' ')
  err "$COUNT ta faylda lokal copy-paste helper (dbRows() import qilinsin):"
  echo "$BP_FILES" | while IFS= read -r f; do
    echo "     ${f#$ROOT/}"
  done
fi

# ── 3. TRY/CATCH CONTROLLER ICHIDA ─────────────────────────────────────────
hdr "3. TRY/CATCH CONTROLLER ICHIDA (xatolar yashirinadi)"
TC_FILES=$(grep -rl "try {" "$SRC" --include="*.controller.ts" 2>/dev/null | sort)
if [ -z "$TC_FILES" ]; then
  pass "Controller da try/catch yo'q"
else
  COUNT=$(echo "$TC_FILES" | wc -l | tr -d ' ')
  wrn "$COUNT ta controllerda try/catch:"
  echo "$TC_FILES" | while IFS= read -r f; do
    N=$(grep -c "try {" "$f" 2>/dev/null || echo 0)
    echo "     $N × ${f#$ROOT/}"
  done
fi

# ── 4. CATCH ICHIDA SUCCESS QAYTARISH ───────────────────────────────────────
hdr "4. CATCH ICHIDA SUCCESS/BO'SH QAYTARISH (always-200)"
ALWAYS=$(grep -rl "} catch" "$SRC" --include="*.controller.ts" 2>/dev/null | \
  xargs grep -l "return \[\]\|return {}\|ok: true\|ok: false" 2>/dev/null | sort)
if [ -z "$ALWAYS" ]; then
  pass "Catch ichida success pattern topilmadi"
else
  COUNT=$(echo "$ALWAYS" | wc -l | tr -d ' ')
  err "$COUNT ta controllerda catch xatoni yashiradi (NestJS exception tashlash kerak):"
  echo "$ALWAYS" | while IFS= read -r f; do
    echo "     ${f#$ROOT/}"
  done
fi

# ── 5. ZOD DTO YO'Q ─────────────────────────────────────────────────────────
hdr "5. @Body BILAN AMMO ZOD DTO YO'Q"
NO_ZOD_LIST=""
while IFS= read -r f; do
  if grep -q "@Body()" "$f" 2>/dev/null; then
    if ! grep -qE "createZodDto|z\.object\(\)|ZodValidationPipe|class .+Dto" "$f" 2>/dev/null; then
      NO_ZOD_LIST="$NO_ZOD_LIST$f"$'\n'
    fi
  fi
done < <(find "$SRC" -name "*.controller.ts" | sort)

if [ -z "$NO_ZOD_LIST" ]; then
  pass "Barcha @Body ishlatgan controllerlar Zod DTO ishlatadi"
else
  COUNT=$(echo "$NO_ZOD_LIST" | grep -c "\.ts" 2>/dev/null || echo 0)
  err "$COUNT ta controllerda @Body bor lekin Zod DTO yo'q:"
  echo "$NO_ZOD_LIST" | grep "\.ts" | while IFS= read -r f; do
    echo "     ${f#$ROOT/}"
  done
fi

# ── 6. @ts-ignore ────────────────────────────────────────────────────────────
hdr "6. @ts-ignore QOLDIQLARI"
TS_IGN=$(grep -rl "@ts-ignore" "$SRC" --include="*.ts" 2>/dev/null | \
  grep -v "\.d\.ts" | sort)
if [ -z "$TS_IGN" ]; then
  pass "@ts-ignore topilmadi"
else
  COUNT=$(echo "$TS_IGN" | wc -l | tr -d ' ')
  err "$COUNT ta faylda @ts-ignore:"
  echo "$TS_IGN" | while IFS= read -r f; do
    N=$(grep -c "@ts-ignore" "$f" 2>/dev/null || echo 0)
    echo "     $N × ${f#$ROOT/}"
  done
fi

# ── 7. COMPAT MODULE — SERVICE YO'Q ─────────────────────────────────────────
hdr "7. COMPAT MODULE — SERVICE INJECT QO'LMAGANLAR"
COMPAT="$SRC/modules/compatibility"
NO_SVC=""
while IFS= read -r f; do
  if ! grep -qE "constructor.*Svc|constructor.*Service|private.*service|private.*svc|private.*Svc|private.*Service" "$f" 2>/dev/null; then
    NO_SVC="$NO_SVC${f#$ROOT/}"$'\n'
  fi
done < <(find "$COMPAT" -name "*.controller.ts" 2>/dev/null | sort)

if [ -z "$NO_SVC" ]; then
  pass "Barcha compat controllerlar service inject qiladi"
else
  COUNT=$(echo "$NO_SVC" | grep -c "\.ts" 2>/dev/null || echo 0)
  wrn "$COUNT ta compat controllarda service yo'q:"
  echo "$NO_SVC" | grep "\.ts" | while IFS= read -r f; do
    echo "     $f"
  done
fi

# ── 8. LIVE ENDPOINT TEKSHIRUVI ──────────────────────────────────────────────
hdr "8. LIVE ENDPOINT TEKSHIRUVI (HTTP)"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/hr-v2/pip 2>/dev/null || echo "000")
if [ "$API_STATUS" = "000" ]; then
  wrn "API ishlamayabdi — HTTP tekshiruvi o'tkazib yuborildi"
else
  ROUTES=(
    "GET /api/employees"
    "GET /api/employees/1"
    "PUT /api/employees/1/profile-image"
    "POST /api/employees/1/assign-org-functions"
    "POST /api/employees/import"
    "GET /api/employees/1/assets"
    "GET /api/employees/1/swap-requests"
    "GET /api/employees/1/complaints"
    "GET /api/org-chart/tree"
    "GET /api/employee-files"
    "GET /api/hr-v2/pip"
    "GET /api/hr-v2/pip/1"
    "GET /api/hr-v2/skills-matrix/catalog"
    "GET /api/hr-v2/ai-interview/sessions"
    "GET /api/hr-v2/ai-interview/sessions/1"
  )
  for ROUTE in "${ROUTES[@]}"; do
    METHOD="${ROUTE%% *}"
    PATH_R="${ROUTE#* }"
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" "http://localhost:8080${PATH_R}" 2>/dev/null || echo "ERR")
    if [ "$CODE" = "401" ] || [ "$CODE" = "403" ] || [ "$CODE" = "200" ]; then
      pass "$CODE  $METHOD $PATH_R"
    elif [ "$CODE" = "404" ]; then
      err "404  $METHOD $PATH_R  ← ROUTE YO'Q!"
    else
      wrn "$CODE  $METHOD $PATH_R"
    fi
  done
fi

# ── 9. FAYL HAJMI ────────────────────────────────────────────────────────────
hdr "9. FAYL HAJMI (300+ qator)"
BIG=$(find "$SRC" -name "*.ts" | while IFS= read -r f; do
  wc -l < "$f" | awk -v fn="${f#$ROOT/}" '{if($1>300) print $1" "fn}'
done | sort -rn | head -10)
if [ -z "$BIG" ]; then
  pass "Barcha fayllar 300 qatordan kam"
else
  err "300 dan ortiq:"
  echo "$BIG" | while IFS= read -r line; do echo "     $line"; done
fi

# ── 10. XULOSA ───────────────────────────────────────────────────────────────
hdr "XULOSA"
echo ""
echo "  Jiddiy xatolar   : $ERRORS"
echo "  Ogohlantirishlar : $WARNINGS"
echo ""
if [ $ERRORS -gt 0 ]; then
  echo "  Hal qilish tartibi:"
  echo "   1. rows()/safeInt() → dbRows() bilan almashtir"
  echo "   2. Controller SQL → Service ga ko'chir"
  echo "   3. catch return [] → NestJS exception tashlash"
  echo "   4. Zod DTO qo'sh"
  echo "   5. @ts-ignore → to'g'ri typing"
  echo ""
fi
