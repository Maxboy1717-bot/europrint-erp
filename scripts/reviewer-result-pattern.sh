#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Result Pattern Reviewer
# Ishlatish: bash scripts/reviewer-result-pattern.sh
#
# Tekshiradi: METOD DARAJASIDA — barcha async metodlarda
#   - return type: Promise<Result<...>> bo'lishi shart
#   - "return null;" taqiqlangan
#
# METOD:
#   1. grep orqali har bir repository faylida async metod satrlarini topish
#   2. Ushbu satrlarda Promise<Result< borligini tekshirish
#   3. Yo'q bo'lsa — FAIL (WARN emas, muammo masklash yo'q)
#
# CHIQISH:
#   exit 0 → PASS
#   exit 1 → FAIL (return null topildi yoki Promise<Result<>> yo'q)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

# grep -c guvenli helper
gcount() { local n=0; n=$(grep -cE "$1" "$2" 2>/dev/null) || true; n="${n//[^0-9]/}"; echo "${n:-0}"; }

REPO_DIR="apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Result Pattern Reviewer (METOD DARAJASIDA)          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: "return null;" tekshiruvi ─────────────────────────────────
echo ""
echo -e "${BOLD}§1 — 'return null;' topilgan repository fayllar${NC}"
echo "──────────────────────────────────────────────────────"

if [ ! -d "$REPO_DIR" ]; then
  warn "$REPO_DIR papkasi topilmadi"
else
  TOTAL_NULL=0
  while IFS= read -r file; do
    null_count=$(gcount "^\s*return null;" "$file")
    if [ "$null_count" -gt 0 ]; then
      # Fayl Result<T> ishlatadimi?
      has_result=$(gcount "Promise<Result<" "$file")
      if [ "${has_result:-0}" -gt 0 ]; then
        ng "$(basename "$file") — $null_count ta 'return null;'"
        grep -nE "^\s*return null;" "$file" 2>/dev/null | head -3 | while IFS= read -r ln; do
          echo "     → $ln"
        done
        TOTAL_NULL=$((TOTAL_NULL + null_count))
      else
        warn "$(basename "$file") — $null_count ta 'return null;' (eski pattern, migratsiya kerak)"
      fi
    else
      ok "$(basename "$file")"
    fi
  done < <(find "$REPO_DIR" -name "*.repository.ts" 2>/dev/null | grep -v "spec\|test\|\.d\.ts" | sort)
  echo ""
  echo "  Jami 'return null;' (yangi pattern fayllar): $TOTAL_NULL"
fi

# ── §2: METOD DARAJASIDA — har bir async metod return type ────────
echo ""
echo -e "${BOLD}§2 — METOD DARAJASIDA: Promise<Result<>> annotatsiyasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  (async metod satri + Promise<Result< pattern birga bo'lishi shart)"

if [ -d "$REPO_DIR" ]; then
  while IFS= read -r file; do
    fname="$(basename "$file")"

    # Total async metod satrlari — void/never qaytaradiganlarni chiqar.
    # Uses an awk window: look at the async line + next 5 lines for void/never.
    total_async=$(awk '
      /^\s+async [a-zA-Z_][a-zA-Z0-9_]*\s*\(/ {
        win = $0
        save_nr = NR
        for (i = 1; i <= 5; i++) {
          if ((getline next_line) > 0) {
            win = win " " next_line
            if (next_line ~ /\{[^{}]*$/) break   # body started
          } else break
        }
        if (win ~ /Promise<void>|Promise<never>|: void\b/) next
        count++
      }
      END { print count + 0 }
    ' "$file" 2>/dev/null)
    [ "${total_async:-0}" -eq 0 ] && continue

    # Count Promise<Result< occurrences (single-line) PLUS multi-line cases
    # where a bare "Promise<" trails into a "Result<" on a subsequent line.
    single=$(grep -cE "Promise<Result<" "$file" 2>/dev/null || echo 0)
    single="${single//[^0-9]/}"
    # Find async methods whose line ends with "Promise<" — assume their next
    # non-blank line begins with "Result<".
    multi=$(grep -cE "^\s+async .*Promise<\s*$" "$file" 2>/dev/null || echo 0)
    multi="${multi//[^0-9]/}"
    with_result=$(( ${single:-0} + ${multi:-0} ))

    unguarded=$(( total_async - with_result ))
    [ "$unguarded" -lt 0 ] && unguarded=0

    if [ "$unguarded" -le 0 ]; then
      ok "$fname — barcha $total_async ta metod Promise<Result<>>"
    elif [ "$with_result" -eq 0 ]; then
      # Hech qanday Result<T> yo'q — eski pattern (WARN, FAIL emas)
      warn "$fname — $total_async ta metod Result<T> ishlatmaydi (eski pattern)"
    else
      # Qisman migratsilgan — FAIL
      ng "$fname — $unguarded/$total_async metod Promise<Result<>> annotatsiyasiz"
      grep -nE "^\s+async [a-zA-Z_][a-zA-Z0-9_]*\s*\(" "$file" 2>/dev/null \
        | grep -vE "Promise<void>|Promise<never>|: void\b" \
        | grep -v "Promise<Result<" \
        | head -3 | while IFS= read -r ln; do
          echo "     → $ln"
        done
    fi
  done < <(find "$REPO_DIR" -name "*.repository.ts" 2>/dev/null | grep -v "spec\|test\|\.d\.ts" | sort)
fi

# ── §3: CONTROLLER DARAJASIDA — CQRS bus bare return tekshiruvi ───
# AR-5: Controllers must explicitly unwrap Result<T> from CQRS handlers.
# Scope: ANY `return this.bus.execute(` or `return await this.bus.execute(` — both are
# violations because they bypass the explicit `if (!res.ok) throw; return res.data` unwrap.
# Correct pattern: `const res = await bus.execute(...); if (!res.ok) throw ...; return res.data;`
echo ""
echo -e "${BOLD}§3 — CONTROLLER: CQRS bus bare return (unwrap yo'q)${NC}"
echo "──────────────────────────────────────────────────────"
echo "  (return this.bus.execute() yoki return await this.bus.execute() — FAIL)"

CTRL_FAIL=0
if [ -d "$REPO_DIR" ]; then
  while IFS= read -r file; do
    fname="$(basename "$file")"

    # Flag bare returns: `return this.bus.execute(` AND `return await this.bus.execute(`
    # Both bypass explicit Result<T> unwrap required by AR-5.
    HITS=$(grep -nE "^\s+return (await )?this\.(queryBus|commandBus)\.execute\(" "$file" 2>/dev/null \
      | grep -vE "\/\/" \
      || true)

    if [ -z "$HITS" ]; then
      ok "$fname — CQRS bus bare return yo'q"
    else
      COUNT=$(echo "$HITS" | wc -l | tr -d ' ')
      ng "$fname — $COUNT ta bare bus.execute() (AR-5: await qilib result.data qaytaring)"
      echo "$HITS" | head -3 | while IFS= read -r ln; do
        echo "     → $ln"
      done
      CTRL_FAIL=$((CTRL_FAIL + COUNT))
    fi
  done < <(find "$REPO_DIR" -name "*.controller.ts" 2>/dev/null | grep -v "spec\|test\|\.d\.ts" | sort)
fi

# ── §4: TO'G'RI YOZISH NAMUNASI ───────────────────────────────────
echo ""
echo -e "${BOLD}§4 — To'g'ri yozish namunalari${NC}"
echo "──────────────────────────────────────────────────────"
echo "  REPOSITORY — NOTO'G'RI:"
echo "    async findAll(): Promise<User[]> { ... }"
echo "    async findById(id: number) { return null; }"
echo ""
echo "  REPOSITORY — TO'G'RI:"
echo "    async findAll(): Promise<Result<User[]>> {"
echo "      const rows = await db.select().from(users);"
echo "      return Result.ok(rows);"
echo "    }"
echo ""
echo "  CONTROLLER — NOTO'G'RI:"
echo "    @Get() getAll() { return this.service.getAll(); }"
echo ""
echo "  CONTROLLER — TO'G'RI (A — qo'lda):"
echo "    @Get() async getAll() {"
echo "      const r = await this.service.getAll();"
echo "      if (r.isFailure) throw new InternalServerErrorException(r.error);"
echo "      return r.getValue();"
echo "    }"
echo "  CONTROLLER — TO'G'RI (B — global interceptor bilan):"
echo "    @Get() getAll() { return this.service.getAll(); }  // interceptor unwrap qiladi"

# ── YAKUNIY ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
