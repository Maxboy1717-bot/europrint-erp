#!/usr/bin/env bash
# Reviewer: WMS CRUD completeness
set -euo pipefail

PASS=0; FAIL=0
WMS_DIR="apps/api/src/modules/wms"

check_method() {
  local ctrl="$1" method="$2"
  local file
  file=$(find "$WMS_DIR" -name "$ctrl" 2>/dev/null | head -1)
  if [ -z "$file" ]; then
    echo "  ✗ $ctrl topilmadi"; ((FAIL++)) || true; return
  fi
  if grep -q "@${method}(" "$file"; then
    echo "  ✓ $ctrl → @${method}"; ((PASS++)) || true
  else
    echo "  ✗ $ctrl → @${method} YO'Q"; ((FAIL++)) || true
  fi
}

echo "=== WMS DELETE endpointlari ==="
check_method "wms-extended.controller.ts"    "Delete"
check_method "wms-goods-issue.controller.ts" "Delete"
check_method "wms-inventory.controller.ts"   "Delete"
check_method "wms-rental.controller.ts"      "Delete"
check_method "wms-stock.controller.ts"       "Delete"
check_method "wms-counts.controller.ts"      "Delete"
check_method "wms-warehouses.controller.ts"  "Delete"

echo "=== WMS PUT/PATCH endpointlari ==="
check_method "wms-extended.controller.ts"    "Patch"
check_method "wms-goods-issue.controller.ts" "Patch"
check_method "wms-inventory.controller.ts"   "Patch"
check_method "wms-rental.controller.ts"      "Patch"
check_method "wms-stock.controller.ts"       "Patch"

echo "=== Soft delete tekshiruvi (deletedAt) ==="
REPOS=(
  "$WMS_DIR/application/wms-crud.repository.ts"
  "$WMS_DIR/application/wms-extended.repository.ts"
  "$WMS_DIR/application/wms-counts.repository.ts"
  "$WMS_DIR/application/warehouse-rental.repository.ts"
  "$WMS_DIR/application/inventory-materials.repository.ts"
  "$WMS_DIR/domain/repositories/wms.repository.ts"
)
for f in "${REPOS[@]}"; do
  if grep -q "deletedAt\|deleted_at" "$f"; then
    echo "  ✓ $f — soft delete bor"; ((PASS++)) || true
  else
    echo "  ✗ $f — soft delete YO'Q"; ((FAIL++)) || true
  fi
done

echo "=== Array.isArray tekshiruvi (WMS controllerlar) ==="
CTRLS=$(find "$WMS_DIR" -name "*.controller.ts" 2>/dev/null)
for f in $CTRLS; do
  if grep -q "Array.isArray" "$f"; then
    echo "  ✓ $f"; ((PASS++)) || true
  else
    echo "  ✗ $f — Array.isArray yo'q"; ((FAIL++)) || true
  fi
done

echo "=== DTO validation tekshiruvi ==="
DTOS=$(find "$WMS_DIR" -name "*.dto.ts" 2>/dev/null)
for f in $DTOS; do
  if grep -q "@IsOptional\|@IsNumber\|@IsString" "$f"; then
    echo "  ✓ $f"; ((PASS++)) || true
  else
    echo "  ✗ $f — class-validator dekoratorlari yo'q"; ((FAIL++)) || true
  fi
done

echo ""
echo "══════════════════════════════"
echo "  PASS: $PASS   FAIL: $FAIL"
echo "══════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
