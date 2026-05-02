#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — DTO Validation Reviewer (Zod)
# Ishlatish: bash scripts/reviewer-dto-validation.sh
#
# Tekshiradi: @Body() qabul qiladigan controller metodlari uchun
#   Zod schema bilan validatsiya bormi.
#
# MANTIQ (Zod-first codebase):
#   1. Controller faylda @Body() bor
#   2. Tegishli *.dto.ts fayl topiladi (import yoki papkadan)
#   3. DTO faylda Zod pattern (z.object/z.string/ZodSchema) bormi tekshiriladi
#   4. Yoki controller o'zida .parse() / .safeParse() chaqiruvlari bor
#
# NIMA EMAS:
#   - Bu skript class-validator tekshirmaydi (loyiha Zod ishlatadi)
#   - 19 ta class-validator qoldig'i alohida tozalanadi
#
# CHIQISH:
#   exit 0 → PASS
#   exit 1 → FAIL (@Body() bor, lekin Zod validatsiya yo'q)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

MODULES_DIR="apps/api/src/modules"

# Zod ishlatilish belgilari (DTO faylda)
ZOD_DTO_PATTERN='z\.object|z\.string|z\.number|z\.boolean|z\.array|z\.enum|z\.union|ZodSchema|ZodType|z\.infer|z\.coerce'
# Controller ichida to'g'ridan parse qilish
ZOD_CTRL_PATTERN='\.parse\(|\.safeParse\(|ZodError|fromZodError|createZodDto|ZodValidationPipe'

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  DTO Validation Reviewer (Zod)                       ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: @Body() bor controller fayllarni tekshirish ───────────────
echo ""
echo -e "${BOLD}§1 — @Body() bor controller fayllar — Zod validatsiya bormi${NC}"
echo "──────────────────────────────────────────────────────"

if [ ! -d "$MODULES_DIR" ]; then
  warn "$MODULES_DIR topilmadi"
else
  BODY_CTRLS=()
  while IFS= read -r f; do BODY_CTRLS+=("$f"); done < <(
    grep -rlE "@Body\(\)" "$MODULES_DIR" --include="*.controller.ts" 2>/dev/null \
      | grep -v "spec\|test" | sort
  )

  for ctrl_file in "${BODY_CTRLS[@]}"; do
    body_count=$(grep -cE "@Body\(\)" "$ctrl_file" 2>/dev/null) || true
    body_count="${body_count//[^0-9]/}"; body_count="${body_count:-0}"
    [ "$body_count" -eq 0 ] && continue

    ctrl_dir="$(dirname "$ctrl_file")"
    ctrl_basename="$(basename "$ctrl_file")"

    # 1) Controller o'zida .parse() / .safeParse() chaqiruvi bormi?
    ctrl_has_parse=0
    ctrl_has_parse=$(grep -cE "$ZOD_CTRL_PATTERN" "$ctrl_file" 2>/dev/null) || true
    ctrl_has_parse="${ctrl_has_parse//[^0-9]/}"; ctrl_has_parse="${ctrl_has_parse:-0}"

    if [ "$ctrl_has_parse" -gt 0 ]; then
      ok "$ctrl_basename — controller ichida .parse()/.safeParse() bor (inline Zod)"
      continue
    fi

    # 1.5) @Body() body: Record<string, unknown> — ataylab generic, WARN
    body_generic_count=0
    body_generic_count=$(grep -cE "@Body\(\) (_?body|dto|_?data): Record<string, unknown>" "$ctrl_file" 2>/dev/null) || true
    body_generic_count="${body_generic_count//[^0-9]/}"; body_generic_count="${body_generic_count:-0}"
    if [ "$body_generic_count" -ge "$body_count" ] && [ "$body_count" -gt 0 ]; then
      warn "$ctrl_basename — @Body() Record<string, unknown> — ataylab generic (Zod qo'shish tavsiya)"
      continue
    fi

    # 1.6) @Body() body: { field: type } — inline TypeScript typed, WARN
    body_inline_count=0
    body_inline_count=$(grep -cE "@Body\(\) (_?body|dto|_?data): \{" "$ctrl_file" 2>/dev/null) || true
    body_inline_count="${body_inline_count//[^0-9]/}"; body_inline_count="${body_inline_count:-0}"
    if [ "$body_inline_count" -ge "$body_count" ] && [ "$body_count" -gt 0 ]; then
      warn "$ctrl_basename — @Body() inline TS type — TypeScript typed lekin Zod yo'q (qo'shish tavsiya)"
      continue
    fi

    # 2) Import qilingan DTO fayllarini topish
    imported_dtos=()
    while IFS= read -r import_path; do
      if [[ "$import_path" == ./* ]] || [[ "$import_path" == ../* ]]; then
        candidate="$ctrl_dir/${import_path}.ts"
        if [ -f "$candidate" ]; then
          imported_dtos+=("$candidate")
        fi
      fi
    done < <(grep -E "^import .+ from ['\"]" "$ctrl_file" 2>/dev/null \
      | grep -oE "from ['\"][^'\"]+['\"]" \
      | sed "s/from ['\"]//;s/['\"]$//" \
      | grep -iE "\.dto|schema|validation")

    if [ "${#imported_dtos[@]}" -eq 0 ]; then
      # Papkadan fallback qidirish
      fallback_dto=""
      for dto_dir in "$ctrl_dir" "$ctrl_dir/dto" "$ctrl_dir/../dto"; do
        [ -d "$dto_dir" ] || continue
        f=$(find "$dto_dir" -maxdepth 1 -name "*.dto.ts" -o -name "*schema*.ts" 2>/dev/null | head -1)
        if [ -n "$f" ]; then fallback_dto="$f"; break; fi
      done

      if [ -n "$fallback_dto" ]; then
        # Fallback faylda Zod bormi?
        dto_has_zod=$(grep -cE "$ZOD_DTO_PATTERN" "$fallback_dto" 2>/dev/null) || true
        dto_has_zod="${dto_has_zod//[^0-9]/}"; dto_has_zod="${dto_has_zod:-0}"
        if [ "$dto_has_zod" -gt 0 ]; then
          warn "$ctrl_basename — DTO import qilinmagan lekin papkada Zod schema bor: $(basename "$fallback_dto")"
        else
          ng "$ctrl_basename — @Body() bor ($body_count ta), import qilinmagan va Zod schema topilmadi"
        fi
      else
        ng "$ctrl_basename — @Body() bor ($body_count ta) — DTO fayl ham, Zod schema ham yo'q"
      fi
    else
      # Import qilingan DTO fayllarini tekshirish
      dto_ok=0; dto_fail=0
      for dto_file in "${imported_dtos[@]}"; do
        has_zod=0
        has_zod=$(grep -cE "$ZOD_DTO_PATTERN" "$dto_file" 2>/dev/null) || true
        has_zod="${has_zod//[^0-9]/}"; has_zod="${has_zod:-0}"
        if [ "$has_zod" -gt 0 ]; then
          ((dto_ok++)) || true
        else
          ng "$ctrl_basename — DTO: $(basename "$dto_file") — Zod schema yo'q (z.object/z.string kerak)"
          ((dto_fail++)) || true
        fi
      done
      if [ "$dto_fail" -eq 0 ]; then
        ok "$ctrl_basename — ${#imported_dtos[@]} ta DTO, barchasi Zod schema bor"
      fi
    fi
  done
fi

# ── §2: ZodValidationPipe yoki global pipe bormi ──────────────────
echo ""
echo -e "${BOLD}§2 — Global Zod pipe (main.ts)${NC}"
echo "──────────────────────────────────────────────────────"

MAIN_FILE="apps/api/src/main.ts"
if [ -f "$MAIN_FILE" ]; then
  has_pipe=$(grep -cE "ZodValidationPipe|ValidationPipe|useGlobalPipes|ZodGuard" "$MAIN_FILE" 2>/dev/null) || true
  has_pipe="${has_pipe//[^0-9]/}"; has_pipe="${has_pipe:-0}"
  if [ "$has_pipe" -gt 0 ]; then
    ok "main.ts — global pipe o'rnatilgan"
  else
    ng "main.ts — global validation pipe yo'q"
  fi
else
  warn "main.ts topilmadi"
fi

# ── §3: class-validator qoldiqlari (tozalanishi kerak) ────────────
echo ""
echo -e "${BOLD}§3 — class-validator qoldiqlari (Zod ga ko'chirish kerak)${NC}"
echo "──────────────────────────────────────────────────────"
cv_count=$(grep -rl "from 'class-validator'" "$MODULES_DIR" --include="*.ts" 2>/dev/null | grep -v "spec\|test" | wc -l) || true
cv_count="${cv_count//[^0-9]/}"; cv_count="${cv_count:-0}"
if [ "$cv_count" -eq 0 ]; then
  ok "class-validator import topilmadi — hammasi Zod"
else
  warn "$cv_count ta fayl hali class-validator import qilmoqda — Zod ga ko'chirish kerak"
  grep -rl "from 'class-validator'" "$MODULES_DIR" --include="*.ts" 2>/dev/null | grep -v "spec\|test" | while read -r f; do
    echo "    ⚠  ${f#apps/api/src/}"
  done
fi

# ── §4: TO'G'RI YOZISH NAMUNASI ───────────────────────────────────
echo ""
echo -e "${BOLD}§4 — To'g'ri yozish namunasi (Zod)${NC}"
echo "──────────────────────────────────────────────────────"
cat << 'EXAMPLE'
  // create-employee.dto.ts
  import { z } from 'zod';

  export const CreateEmployeeSchema = z.object({
    firstName:    z.string().min(1).max(100),
    lastName:     z.string().min(1).max(100),
    email:        z.string().email(),
    departmentId: z.number().int().positive().optional(),
  });
  export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;

  // employees.controller.ts
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateEmployeeSchema.parse(body);   // ← bu validation
    return this.service.create(dto);
  }
EXAMPLE

# ── YAKUNIY ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
