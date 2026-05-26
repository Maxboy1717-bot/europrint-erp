#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Result Pattern Reviewer
# Ishlatish: bash scripts/reviewer-result-pattern.sh
#
# Tekshiradi: METOD DARAJASIDA — barcha async metodlarda
#   - return type: Promise<Result<...>> bo'lishi shart
#   - "return null;" taqiqlangan
#
# PERFORMANCE: §1 and §3 use bulk grep (single call for all files).
# §2 uses per-file awk (preserves exact old-reviewer semantics with
# getline lookahead). Total: ~1m40s vs old ~3m32s (54% faster).
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

# grep -c xavfsiz helper (exit 1 when count=0 — catch that)
gcount() { local n=0; n=$(grep -cE "$1" "$2" 2>/dev/null) || true; n="${n//[^0-9]/}"; echo "${n:-0}"; }

REPO_DIR="apps/api/src/modules"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Result Pattern Reviewer (METOD DARAJASIDA)          ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── Pre-load file lists once (avoid repeated find/sort subprocesses) ─
if [ ! -d "$REPO_DIR" ]; then
  warn "$REPO_DIR papkasi topilmadi"
  echo ""; echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
  echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
  echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
  if [ "$FAIL" -eq 0 ]; then exit 0; else exit 1; fi
fi

mapfile -t REPO_FILES < <(find "$REPO_DIR" -name "*.repository.ts" 2>/dev/null \
  | grep -v "spec\|test\|\.d\.ts" | sort)
mapfile -t CTRL_FILES < <(find "$REPO_DIR" -name "*.controller.ts" 2>/dev/null \
  | grep -v "spec\|test\|\.d\.ts" | sort)

total_repo=${#REPO_FILES[@]}
total_ctrl=${#CTRL_FILES[@]}

# ── §1: "return null;" — BULK grep pre-filter ─────────────────────
echo ""
echo -e "${BOLD}§1 — 'return null;' topilgan repository fayllar${NC}"
echo "──────────────────────────────────────────────────────"

TOTAL_NULL=0
if [ "$total_repo" -eq 0 ]; then
  warn "Repository fayllar topilmadi"
else
  # Single grep across all repo files (1 subprocess instead of 233)
  mapfile -t NULL_FILES < <(
    grep -l "return null;" "${REPO_FILES[@]}" 2>/dev/null || true
  )
  null_file_count=${#NULL_FILES[@]}

  if [ "$null_file_count" -eq 0 ]; then
    ok "Jami $total_repo ta fayl tekshirildi — 'return null;' topilmadi"
  else
    clean_count=$(( total_repo - null_file_count ))
    [ "$clean_count" -gt 0 ] && ok "$clean_count ta fayl toza"
    for file in "${NULL_FILES[@]}"; do
      null_count=$(gcount "^\s*return null;" "$file")
      [ "$null_count" -eq 0 ] && continue
      has_result=$(gcount "Promise<Result<" "$file")
      if [ "${has_result}" -gt 0 ]; then
        ng "$(basename "$file") — $null_count ta 'return null;'"
        grep -nE "^\s*return null;" "$file" 2>/dev/null | head -3 | while IFS= read -r ln; do
          echo "     → $ln"
        done
        TOTAL_NULL=$((TOTAL_NULL + null_count))
      else
        warn "$(basename "$file") — $null_count ta 'return null;' (eski pattern, migratsiya kerak)"
      fi
    done
  fi
  echo ""
  echo "  Jami 'return null;' (yangi pattern fayllar): $TOTAL_NULL"
fi

# ── §2: METOD DARAJASIDA — per-file awk (preserves exact semantics) ─
# Uses getline lookahead to correctly classify multi-line method sigs.
# Per-file to match original reviewer's exact total_async behavior.
echo ""
echo -e "${BOLD}§2 — METOD DARAJASIDA: Promise<Result<>> annotatsiyasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  (async metod satri + Promise<Result< pattern birga bo'lishi shart)"

if [ "$total_repo" -gt 0 ]; then
  for file in "${REPO_FILES[@]}"; do
    fname="$(basename "$file")"

    # Count meaningful async methods using awk with getline lookahead.
    # Void/never methods are excluded via 5-line window check.
    total_async=$(awk '
      /^\s+async [a-zA-Z_][a-zA-Z0-9_]*\s*\(/ {
        win = $0
        for (i = 1; i <= 5; i++) {
          if ((getline next_line) > 0) {
            win = win " " next_line
            if (next_line ~ /\{[^{}]*$/) break
          } else break
        }
        if (win ~ /Promise<void>|Promise<never>|: void\b/) next
        count++
      }
      END { print count + 0 }
    ' "$file" 2>/dev/null)
    [ "${total_async:-0}" -eq 0 ] && continue

    # Single-line Promise<Result< occurrences
    single=$(gcount "Promise<Result<" "$file")
    # Multi-line: async method ending with "Promise<\s*$" (Result< on next line)
    multi=$(gcount "^\s+async .*Promise<\s*$" "$file")
    with_result=$(( ${single:-0} + ${multi:-0} ))

    unguarded=$(( total_async - with_result ))
    [ "$unguarded" -lt 0 ] && unguarded=0

    if [ "$unguarded" -le 0 ]; then
      ok "$fname — barcha $total_async ta metod Promise<Result<>>"
    elif [ "$with_result" -eq 0 ]; then
      warn "$fname — $total_async ta metod Result<T> ishlatmaydi (eski pattern)"
    else
      ng "$fname — $unguarded/$total_async metod Promise<Result<>> annotatsiyasiz"
      grep -nE "^\s+async [a-zA-Z_][a-zA-Z0-9_]*\s*\(" "$file" 2>/dev/null \
        | grep -vE "Promise<void>|Promise<never>|: void\b" \
        | grep -v "Promise<Result<" \
        | head -3 | while IFS= read -r ln; do
            echo "     → $ln"
          done
    fi
  done
fi

# ── §3: CONTROLLER DARAJASIDA — CQRS bus bare return — BULK ────────
# AR-5: Controllers must explicitly unwrap Result<T> from CQRS handlers.
echo ""
echo -e "${BOLD}§3 — CONTROLLER: CQRS bus bare return (unwrap yo'q)${NC}"
echo "──────────────────────────────────────────────────────"
echo "  (return this.bus.execute() yoki return await this.bus.execute() — FAIL)"

CTRL_FAIL=0
if [ "$total_ctrl" -eq 0 ]; then
  warn "Controller fayllar topilmadi"
else
  # Single grep across all controller files
  mapfile -t BUS_VIOLATORS < <(
    grep -lE "return (await )?this\.(queryBus|commandBus)\.execute\(" \
      "${CTRL_FILES[@]}" 2>/dev/null \
    | xargs grep -lE "^\s+return (await )?this\.(queryBus|commandBus)\.execute\(" \
        2>/dev/null \
    || true
  )
  bus_count=${#BUS_VIOLATORS[@]}

  if [ "$bus_count" -eq 0 ]; then
    ok "Jami $total_ctrl ta controller — CQRS bus bare return yo'q"
  else
    clean_ctrl=$(( total_ctrl - bus_count ))
    [ "$clean_ctrl" -gt 0 ] && ok "$clean_ctrl ta controller toza"
    for file in "${BUS_VIOLATORS[@]}"; do
      fname="$(basename "$file")"
      HITS=$(grep -nE "^\s+return (await )?this\.(queryBus|commandBus)\.execute\(" \
        "$file" 2>/dev/null | grep -vE "\//" || true)
      if [ -n "$HITS" ]; then
        COUNT=$(echo "$HITS" | wc -l | tr -d ' ')
        ng "$fname — $COUNT ta bare bus.execute() (AR-5: await qilib result.data qaytaring)"
        echo "$HITS" | head -3 | while IFS= read -r ln; do
          echo "     → $ln"
        done
        CTRL_FAIL=$((CTRL_FAIL + COUNT))
      fi
    done
  fi
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

if [ "$FAIL" -eq 0 ]; then
  exit 0
else
  exit 1
fi
