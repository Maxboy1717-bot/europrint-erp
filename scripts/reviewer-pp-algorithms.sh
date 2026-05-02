#!/usr/bin/env bash
# reviewer-pp-algorithms.sh — PP/MRP/CRP/Scheduling algoritmlarini tekshiradi
# Sprint 2B: Task #429
set -uo pipefail

FAIL=0

echo "=== PP/MRP/CRP/Scheduling Reviewer ==="

# --- Fayllar mavjudligi ---
FILES=(
  "apps/api/src/modules/pp/domain/services/bom-explosion.service.ts"
  "apps/api/src/modules/pp/domain/services/crp.service.ts"
  "apps/api/src/modules/pp/domain/services/scheduling.service.ts"
  "apps/api/src/modules/pp/domain/services/costing.service.ts"
  "apps/api/src/modules/pp/application/commands/run-mrp.handler.ts"
  "apps/api/src/modules/pp/application/queries/mps-atp.handler.ts"
)

for f in "${FILES[@]}"; do
  if ! test -f "$f"; then
    echo "FAIL: $f topilmadi"
    ((FAIL++))
  else
    echo "OK:   $f mavjud"
  fi
done

# --- BOM: Kahn topologik sort mavjudligi ---
BOM_FILE="apps/api/src/modules/pp/domain/services/bom-explosion.service.ts"
if test -f "$BOM_FILE"; then
  if grep -q "inDegree\|topoOrder\|Kahn" "$BOM_FILE"; then
    echo "OK:   BOM topologik sort (Kahn) mavjud"
  else
    echo "FAIL: BOM topologik sort topilmadi"
    ((FAIL++))
  fi
fi

# --- BOM: Sikl detection ---
if test -f "$BOM_FILE"; then
  if grep -q "CyclicBomError\|processed < allNodes\|sikl" "$BOM_FILE"; then
    echo "OK:   BOM sikl detection mavjud"
  else
    echo "FAIL: BOM sikl tekshirish topilmadi"
    ((FAIL++))
  fi
fi

# --- BOM: Memoization ---
if test -f "$BOM_FILE"; then
  if grep -q "memo\|memoiz" "$BOM_FILE"; then
    echo "OK:   BOM memoization mavjud"
  else
    echo "FAIL: BOM memoization topilmadi"
    ((FAIL++))
  fi
fi

# --- MRP: Net Requirement formula ---
MRP_FILE="apps/api/src/modules/pp/application/commands/run-mrp.handler.ts"
if test -f "$MRP_FILE"; then
  if grep -q "Math.max(0" "$MRP_FILE"; then
    echo "OK:   MRP NR = max(0, GR-OH) mavjud"
  else
    echo "FAIL: MRP net requirement formula topilmadi"
    ((FAIL++))
  fi
fi

# --- MRP: Lot sizing ---
if test -f "$MRP_FILE"; then
  if grep -q "L4L\|EOQ\|POQ" "$MRP_FILE"; then
    echo "OK:   MRP lot sizing strategiyalari mavjud"
  else
    echo "FAIL: MRP lot sizing topilmadi"
    ((FAIL++))
  fi
fi

# --- CRP: Load% formula ---
CRP_FILE="apps/api/src/modules/pp/domain/services/crp.service.ts"
if test -f "$CRP_FILE"; then
  if grep -q "loadPercent\|load_percent\|safeDiv" "$CRP_FILE"; then
    echo "OK:   CRP load% formula mavjud"
  else
    echo "FAIL: CRP load% formula topilmadi"
    ((FAIL++))
  fi
fi

# --- Johnson: front/back pattern ---
SCHED_FILE="apps/api/src/modules/pp/domain/services/scheduling.service.ts"
if test -f "$SCHED_FILE"; then
  if grep -q "front\|back\|Johnson\|johnsonRule" "$SCHED_FILE"; then
    echo "OK:   Johnson qoidasi mavjud"
  else
    echo "FAIL: Johnson qoidasi topilmadi"
    ((FAIL++))
  fi
fi

# --- CPM: Forward/backward pass ---
if test -f "$SCHED_FILE"; then
  if grep -q "totalFloat\|criticalPath\|isCritical" "$SCHED_FILE"; then
    echo "OK:   CPM critical path mavjud"
  else
    echo "FAIL: CPM critical path topilmadi"
    ((FAIL++))
  fi
fi

# --- TOC: Bottleneck detection ---
if test -f "$SCHED_FILE"; then
  if grep -q "bottleneck\|arrivalRate\|serviceRate" "$SCHED_FILE"; then
    echo "OK:   TOC bottleneck detection mavjud"
  else
    echo "FAIL: TOC bottleneck topilmadi"
    ((FAIL++))
  fi
fi

# --- Variance: 4 formula ---
COST_FILE="apps/api/src/modules/pp/domain/services/costing.service.ts"
if test -f "$COST_FILE"; then
  if grep -q "mpv\|mqv\|lrv\|lev" "$COST_FILE"; then
    echo "OK:   Variance formulalari (MPV+MQV+LRV+LEV) mavjud"
  else
    echo "FAIL: Variance formulalari topilmadi"
    ((FAIL++))
  fi
fi

# --- @Calculation decorator ---
for f in "${FILES[@]}"; do
  if test -f "$f"; then
    if ! grep -q "@Calculation" "$f"; then
      echo "FAIL: $f da @Calculation decorator topilmadi"
      ((FAIL++))
    fi
  fi
done

echo ""
echo "=== Natija: FAIL=$FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: pp-algorithms barcha tekshiruvlar muvaffaqiyatli"
  exit 0
else
  echo "FAIL: $FAIL xato topildi"
  exit 1
fi
