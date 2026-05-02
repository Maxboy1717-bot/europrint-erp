#!/usr/bin/env bash
# reviewer-qc-spc.sh — Task #431 Sprint 3A: QC/SPC/FMEA algoritmlarini tekshiradi
set -euo pipefail

PASS=0
FAIL=0

ok()   { echo "OK:   $1"; PASS=$((PASS+1)); }
fail() { echo "FAIL: $1"; FAIL=$((FAIL+1)); }

# TZ-D10: OEE clamp mavjudmi?
if grep -q "clamp" apps/api/src/modules/iot/oee/oee-calculator.service.ts 2>/dev/null; then
  ok "OEE clamp() mavjud"
else
  fail "OEE clamp() topilmadi"
fi

# TZ-D10: OeeInputSchema (Zod cross-field validation)
if grep -q "OeeInputSchema\|refine" apps/api/src/modules/iot/oee/oee-calculator.service.ts 2>/dev/null; then
  ok "OEE Zod refine cross-field validation mavjud"
else
  fail "OEE Zod cross-field validation topilmadi"
fi

# TZ-D11: defect-detector.service.ts mavjudmi?
if test -f apps/api/src/modules/qc/domain/services/defect-detector.service.ts; then
  ok "defect-detector.service.ts mavjud"
else
  fail "defect-detector.service.ts topilmadi"
fi

# TZ-D11: Western Electric 4 qoidasi
if grep -q "RULE_1_3SIGMA" apps/api/src/modules/qc/domain/services/defect-detector.service.ts 2>/dev/null; then
  ok "WE Qoida 1 (3SIGMA) mavjud"
else
  fail "WE Qoida 1 topilmadi"
fi

if grep -q "RULE_2_2OF3_2SIGMA" apps/api/src/modules/qc/domain/services/defect-detector.service.ts 2>/dev/null; then
  ok "WE Qoida 2 (2OF3_2SIGMA) mavjud"
else
  fail "WE Qoida 2 topilmadi"
fi

if grep -q "RULE_3_4OF5_1SIGMA" apps/api/src/modules/qc/domain/services/defect-detector.service.ts 2>/dev/null; then
  ok "WE Qoida 3 (4OF5_1SIGMA) mavjud"
else
  fail "WE Qoida 3 topilmadi"
fi

if grep -q "RULE_4_8_RUN" apps/api/src/modules/qc/domain/services/defect-detector.service.ts 2>/dev/null; then
  ok "WE Qoida 4 (8_RUN) mavjud"
else
  fail "WE Qoida 4 topilmadi"
fi

# TZ-30: X-bar/R + Cp/Cpk
if grep -q "A2\|D4\|d2" apps/api/src/modules/qc/domain/services/spc.service.ts 2>/dev/null; then
  ok "SPC: X-bar/R konstantlari (A2, D4, d2) mavjud"
else
  fail "SPC: X-bar/R konstantlari topilmadi"
fi

if grep -q "Cpk\|cpk" apps/api/src/modules/qc/domain/services/spc.service.ts 2>/dev/null; then
  ok "SPC: Cpk mavjud"
else
  fail "SPC: Cpk topilmadi"
fi

# TZ-31: DPMO + Six Sigma
if grep -q "DPMO\|dpmo\|1_000_000\|sigmaLevel" apps/api/src/modules/qc/domain/services/fmea.service.ts 2>/dev/null; then
  ok "DPMO formula mavjud"
else
  fail "DPMO formula topilmadi"
fi

# TZ-32: FMEA RPN
if grep -q "requiresMitigation\|requiresStopProduction" apps/api/src/modules/qc/domain/services/fmea.service.ts 2>/dev/null; then
  ok "FMEA: RPN mitigation va stop-production mavjud"
else
  fail "FMEA: requiresMitigation topilmadi"
fi

# TZ-34: %TAC
if grep -q "TAC_LIMIT_EXCEEDED\|TAC_MAX" apps/api/src/modules/qc/domain/services/ink-consumption.service.ts 2>/dev/null; then
  ok "InkConsumption: TAC_MAX limit xato handling mavjud"
else
  fail "InkConsumption: TAC_MAX topilmadi"
fi

# TZ-35: FFDH Imposition
if grep -q "FFDH\|Strip\|strip" apps/api/src/modules/qc/domain/services/imposition.service.ts 2>/dev/null; then
  ok "Imposition: FFDH algoritmi mavjud"
else
  fail "Imposition: FFDH algoritmi topilmadi"
fi

# TZ-37: Spoilage
if grep -q "isAlarm\|STANDARD_SPOILAGE" apps/api/src/modules/qc/domain/services/spoilage.service.ts 2>/dev/null; then
  ok "Spoilage: alarm va standart darajalar mavjud"
else
  fail "Spoilage: isAlarm topilmadi"
fi

# TZ-38: Delta-E CIEDE2000
if grep -q "ciede2000\|CIEDE2000" apps/api/src/modules/qc/domain/services/delta-e.service.ts 2>/dev/null; then
  ok "Delta-E: CIEDE2000 algoritmi mavjud"
else
  fail "Delta-E: CIEDE2000 topilmadi"
fi

# schema-qc-spc mavjudmi?
if test -f apps/api/src/shared/db/schema-qc-spc.ts; then
  ok "schema-qc-spc.ts (control_chart_point) mavjud"
else
  fail "schema-qc-spc.ts topilmadi"
fi

# safeDiv / safeNum / clamp foydalanilganmi?
if grep -rq "safeDiv\|safeNum\|clamp" apps/api/src/modules/qc/domain/services/ 2>/dev/null; then
  ok "xavfsiz math utility'lar ishlatilgan (safeDiv/safeNum/clamp)"
else
  fail "safeDiv/safeNum/clamp topilmadi"
fi

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: qc-spc-fmea barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  exit 1
fi
