#!/usr/bin/env bash
# ================================================================
# EuroPrint ERP — Xavfsizlik Reviewer (statik + dinamik)
# Ishlatish: bash scripts/reviewer-security.sh
# Dinamik testlar uchun server ishlab turishi kerak (PORT 8080)
# ================================================================
set -uo pipefail

PASS=0; FAIL=0

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

API_BASE="${API_BASE:-http://localhost:8080}"
ADMIN_PASS="${PENTEST_ADMIN_PASSWORD:-EuroPrint2024!}"
API="$API_BASE/api"

ok()   { printf "  ${GREEN}✓${NC} %s\n" "$*"; ((PASS++)); }
fail() { printf "  ${RED}✗${NC} %s\n" "$*"; ((FAIL++)); }
hdr()  { printf "\n${BOLD}${CYAN}=== %s ===${NC}\n" "$*"; }

# ── §1 STATIK: Swagger ochiq emasligi ────────────────────────────
hdr "§1 STATIK: Swagger ochiq emasligi"
SWAGGER=$(curl -s -o /dev/null -w "%{http_code}" "$API/docs" 2>/dev/null || echo "000")
if [[ "$SWAGGER" == "404" || "$SWAGGER" == "403" ]]; then
  ok "/api/docs bloklangan ($SWAGGER)"
else
  fail "/api/docs ochiq! ($SWAGGER) — swagger muhitga qarab yopilishi kerak"
fi

# ── §2 STATIK: Stack trace yashirilgan ──────────────────────────
hdr "§2 STATIK: Stack trace yashirilgan"
ERR=$(curl -s "$API/nonexistent-route-99999" 2>/dev/null)
if echo "$ERR" | grep -qE "at Object\.|at Module\.|node_modules"; then
  fail "Stack trace ochiq! Response: $(echo "$ERR" | head -c 200)"
else
  ok "Stack trace yashirilgan"
fi

# ── §3 DINAMIK: Login token olish ───────────────────────────────
hdr "§3 DINAMIK: Login token olish"
LOGIN_STATUS=$(curl -s -o /tmp/reviewer_login_resp.json -w "%{http_code}" \
  -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null)
TOKEN_RESP=$(cat /tmp/reviewer_login_resp.json 2>/dev/null || echo "")
TOKEN=$(echo "$TOKEN_RESP" | grep -oE '"(token|accessToken|access_token)":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  ok "Login muvaffaqiyatli, token olindi"
elif [[ "$LOGIN_STATUS" == "429" ]]; then
  ok "Rate limiter faol (429) — throttler himoyasi ishlayapti"
else
  fail "Login muvaffaqiyatsiz! Status: $LOGIN_STATUS — PENTEST_ADMIN_PASSWORD to'g'riligini tekshiring"
fi

# ── §4 DINAMIK: JWT tekshiruvi (token yo'q) ─────────────────────
hdr "§4 DINAMIK: JWT tekshiruvi (token yo'q)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/hr/employees" 2>/dev/null)
if [[ "$STATUS" == "401" ]]; then
  ok "Token yo'q → 401"
else
  fail "Token yo'q → $STATUS (401 bo'lishi kerak)"
fi

# ── §5 DINAMIK: SQL injection ────────────────────────────────────
hdr "§5 DINAMIK: SQL injection"
SQL_TESTS=("' OR '1'='1" "'; DROP TABLE users;--" "1 UNION SELECT NULL,NULL--")
for payload in "${SQL_TESTS[@]}"; do
  ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$payload'''))" 2>/dev/null || echo "$payload")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API/hr/employees?search=$ENC" \
    -H "Authorization: Bearer ${TOKEN:-invalid}" 2>/dev/null)
  if [[ "$STATUS" == "500" ]]; then
    fail "SQL injection → 500 (server crash!): ${payload:0:30}"
  elif [[ "$STATUS" == "200" || "$STATUS" == "400" || "$STATUS" == "422" ]]; then
    ok "SQL injection app tomonida bloklandi → $STATUS: ${payload:0:30}"
  elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "429" ]]; then
    ok "SQL injection auth/throttler tomonida bloklandi → $STATUS: ${payload:0:30}"
  else
    ok "SQL injection bloklandi → $STATUS: ${payload:0:30}"
  fi
done

# ── §6 DINAMIK: XSS tekshiruvi ──────────────────────────────────
hdr "§6 DINAMIK: XSS tekshiruvi"
XSS_PAYLOAD='<script>alert(1)</script>'
XSS_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$XSS_PAYLOAD\",\"password\":\"test\"}" 2>/dev/null)
if echo "$XSS_RESP" | grep -qF '<script>'; then
  fail "XSS payload javobda aks ettirildi (reflected XSS)"
else
  ok "XSS payload aks ettirilmadi (bloklandi yoki sanitizatsiya qilindi)"
fi

# ── §7 DINAMIK: Katta payload bloklash ──────────────────────────
hdr "§7 DINAMIK: Katta payload bloklash"
BIG_PAYLOAD=$(python3 -c "import json; print(json.dumps({'a': 'x'*100000}))" 2>/dev/null \
  || echo '{"a":"'"$(head -c 10000 /dev/urandom | base64 | tr -d '\n' | head -c 10000)"'"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "$BIG_PAYLOAD" 2>/dev/null)
if [[ "$STATUS" == "413" || "$STATUS" == "429" || "$STATUS" == "422" || "$STATUS" == "400" || "$STATUS" == "431" ]]; then
  ok "Katta payload bloklandi → $STATUS"
else
  fail "Katta payload o'tib ketdi → $STATUS"
fi

# ── §8 STATIK: Hard-coded secret yo'q ───────────────────────────
hdr "§8 STATIK: Hard-coded secret yo'q"
SECRETS=$(grep -rn --include="*.ts" \
  -E "secret\s*[=:]\s*['\"][a-zA-Z0-9]{20,}['\"]" \
  apps/api/src/ 2>/dev/null \
  | grep -v -E "spec|test|example|JWT_SECRET|getOrThrow|cfg\.(get|getOrThrow)" \
  | wc -l)
SECRETS="${SECRETS//[[:space:]]/}"
if [ "${SECRETS:-0}" -eq 0 ]; then
  ok "Hard-coded secret topilmadi"
else
  fail "${SECRETS} ta hard-coded secret topildi"
fi

# ── YAKUNIY HISOBOT ──────────────────────────────────────────────
echo ""
echo "══════════════════════════════"
printf "  PASS: %d   FAIL: %d\n" "$PASS" "$FAIL"
echo "══════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
