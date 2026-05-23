#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — JWT Guard Reviewer
# Ishlatish: bash scripts/reviewer-jwt-guard.sh
#
# Tekshiradi:
#   1. Global { provide: APP_GUARD, useClass: JwtAuthGuard } ro'yxatdan o'tganmi
#   2. Yo'q bo'lsa: har bir controller faylida @UseGuards(JwtAuthGuard) aniq
#      ko'rsatilganmi (faqat @UseGuards() emas — aniq JwtAuthGuard kerak)
#   3. @Public()/@SkipAuth() FAQAT metod/klass darajasida atayin belgilangan
#      bo'lishi kerak. Fayl ichida bitta @Public() bo'lsa boshqa metodlar
#      tekshirilishdan ozod EMAS.
#
# CHIQISH:
#   exit 0 → PASS
#   exit 1 → FAIL (himoyalanmagan non-public endpoint topildi)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[2m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

MODULES_DIR="apps/api/src/modules"
GLOBAL_GUARD_FILE="apps/api/src/app.module.ts"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  JWT Guard Reviewer                                  ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: Global guard tekshiruvi ───────────────────────────────────
echo ""
echo -e "${BOLD}§1 — Global guard: { provide: APP_GUARD, useClass: JwtAuthGuard }${NC}"
echo "──────────────────────────────────────────────────────"

HAS_GLOBAL_GUARD=0
if [ -f "$GLOBAL_GUARD_FILE" ]; then
  # ANIQ tekshiruv: APP_GUARD AND useClass: JwtAuthGuard BIRGA bo'lishi shart
  # Bir satrda yoki ketma-ket satrlarda (multi-line provider block)
  has_app_guard=0
  has_app_guard=$(grep -cE "APP_GUARD" "$GLOBAL_GUARD_FILE" 2>/dev/null) || true
  has_app_guard="${has_app_guard//[^0-9]/}"; has_app_guard="${has_app_guard:-0}"

  # "useClass: JwtAuthGuard" yoki "useClass:JwtAuthGuard"
  has_useclass_jwt=0
  has_useclass_jwt=$(grep -cE "useClass\s*:\s*JwtAuthGuard" "$GLOBAL_GUARD_FILE" 2>/dev/null) || true
  has_useclass_jwt="${has_useclass_jwt//[^0-9]/}"; has_useclass_jwt="${has_useclass_jwt:-0}"

  if [ "$has_app_guard" -gt 0 ] && [ "$has_useclass_jwt" -gt 0 ]; then
    ok "app.module.ts — { provide: APP_GUARD, useClass: JwtAuthGuard } ANIQLANDI"
    echo "  ~ Global guard barcha controllerlarni himoyalaydi"
    echo "  ~ @Public()/@SkipAuth() bilan belgilangan endpointlar istisno"
    HAS_GLOBAL_GUARD=1
  elif [ "$has_app_guard" -gt 0 ]; then
    ng "app.module.ts — APP_GUARD bor, lekin useClass: JwtAuthGuard TOPILMADI"
  elif [ "$has_useclass_jwt" -gt 0 ]; then
    ng "app.module.ts — JwtAuthGuard bor, lekin APP_GUARD orqali ro'yxatdan o'tkazilmagan"
  else
    warn "app.module.ts — Global JwtAuthGuard o'rnatilmagan"
  fi
else
  warn "app.module.ts topilmadi"
fi

# ── §2: Global guard YO'Q bo'lsa — controller darajasida tekshirish ─
echo ""
echo -e "${BOLD}§2 — Controller darajasida @UseGuards(JwtAuthGuard) tekshiruvi${NC}"
echo "──────────────────────────────────────────────────────"

if [ "$HAS_GLOBAL_GUARD" -eq 1 ]; then
  echo "  ~ Global guard aniqlandi — controller darajasida tekshiruv kerak emas"
  echo "  ~ (Barcha endpoint himoyalangan, faqat @Public() lar istisno)"
else
  if [ ! -d "$MODULES_DIR" ]; then
    warn "$MODULES_DIR topilmadi"
  else
    while IFS= read -r file; do
      ctrl_name="$(basename "$file" .ts)"

      # Klass darajasida himoya bormi?
      # @UseGuards(JwtAuthGuard) — ANIQ JwtAuthGuard, har qanday guard emas
      has_jwt_class=0
      has_jwt_class=$(grep -cE "@UseGuards\([^)]*JwtAuthGuard" "$file" 2>/dev/null) || true
      has_jwt_class="${has_jwt_class//[^0-9]/}"; has_jwt_class="${has_jwt_class:-0}"

      if [ "$has_jwt_class" -gt 0 ]; then
        ok "$ctrl_name — @UseGuards(JwtAuthGuard) bor"
        continue
      fi

      # @Public() yoki @SkipAuth() BARCHA HTTP metodlarida bormi?
      # Endpoint metodlari: @Get, @Post, @Put, @Patch, @Delete
      total_endpoints=0
      total_endpoints=$(grep -cE "@(Get|Post|Put|Patch|Delete)\(" "$file" 2>/dev/null) || true
      total_endpoints="${total_endpoints//[^0-9]/}"; total_endpoints="${total_endpoints:-0}"

      public_endpoints=0
      public_endpoints=$(grep -cE "@(Public|SkipAuth)\(\)" "$file" 2>/dev/null) || true
      public_endpoints="${public_endpoints//[^0-9]/}"; public_endpoints="${public_endpoints:-0}"

      if [ "$total_endpoints" -eq 0 ]; then
        ok "$ctrl_name — HTTP endpoint yo'q"
        continue
      fi

      if [ "$public_endpoints" -ge "$total_endpoints" ] && [ "$total_endpoints" -gt 0 ]; then
        echo -e "  ${DIM}~ $ctrl_name — barcha $total_endpoints endpoint @Public() (atayin ochiq)${NC}"
        ((WARN++)) || true
      else
        unprotected=$((total_endpoints - public_endpoints))
        ng "$ctrl_name — $unprotected ta himoyalanmagan non-public endpoint (JwtAuthGuard kerak)"
      fi
    done < <(find "$MODULES_DIR" -name "*.controller.ts" 2>/dev/null | grep -v "spec\|test" | sort)
  fi
fi

# ── §3: auth.controller.ts — /login @Public() belgilanganmi ───────
echo ""
echo -e "${BOLD}§3 — Auth controller: login endpointi tekshiruvi${NC}"
echo "──────────────────────────────────────────────────────"

AUTH_CTRL=$(find "$MODULES_DIR/auth" -name "*.controller.ts" 2>/dev/null | head -1)
if [ -n "$AUTH_CTRL" ]; then
  has_login_public=0
  has_login_public=$(grep -cE "@(Public|SkipAuth)\(\)" "$AUTH_CTRL" 2>/dev/null) || true
  has_login_public="${has_login_public//[^0-9]/}"; has_login_public="${has_login_public:-0}"

  if [ "$has_login_public" -gt 0 ]; then
    ok "auth.controller.ts — /login @Public()/@SkipAuth() bilan belgilangan (to'g'ri)"
  else
    warn "auth.controller.ts — /login @Public() belgilanmagan (kirish ishlamaydi)"
  fi
fi

# ── §4: YECHIM NAMUNASI ────────────────────────────────────────────
echo ""
echo -e "${BOLD}§4 — To'g'ri yozish namunasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  1. Global guard (eng qulay — app.module.ts da):"
echo "    providers: ["
echo "      { provide: APP_GUARD, useClass: JwtAuthGuard }, // barcha endpoint himoyalangan"
echo "    ]"
echo ""
echo "  2. Controller darajasida (ANIQ JwtAuthGuard):"
echo "    @Controller('employees')"
echo "    @UseGuards(JwtAuthGuard)  // <- aniq JwtAuthGuard, RolesGuard emas"
echo "    export class EmployeesController { ... }"
echo ""
echo "  3. Ochiq endpoint uchun (@Public dekoratori):"
echo "    @Public()  // yoki @SkipAuth()"
echo "    @Post('login')"
echo "    async login(...) { ... }"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN (ochiq): $WARN  |  FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}→ $FAIL ta himoyalanmagan controller!${NC}"
fi
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
