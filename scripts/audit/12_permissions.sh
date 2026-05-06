#!/bin/bash
# QATLAM 12: Permissions UI
BASE="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0; WARN=0
echo "=== QATLAM 12: Permissions UI ==="
DASH="$BASE/artifacts/erp-dashboard/src"

# 12.1 RoleGuard komponenti
if grep -rl "RoleGuard\|PermissionGuard\|hasRole\|hasPermission" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ RoleGuard/PermissionGuard topildi"
  PASS=$((PASS+1))
else
  echo "✘ RoleGuard komponenti yo'q — UI darajasida ruxsat tekshiruvi yo'q"
  FAIL=$((FAIL+1))
fi

# 12.2 useAuth hook
if grep -rl "useAuth\|AuthContext\|useUser" "$DASH" 2>/dev/null | grep -q .; then
  echo "✔ useAuth hook topildi"
  PASS=$((PASS+1))
else
  echo "⚠ useAuth hook topilmadi"
  WARN=$((WARN+1))
fi

# 12.3 role-based conditional rendering
RBAC=$(grep -rl "user\.role\|userRole\|isAdmin\|canEdit\|canDelete\|hasAccess" "$DASH" 2>/dev/null | wc -l)
if [ "$RBAC" -gt 3 ]; then
  echo "✔ Role-based rendering: $RBAC fayl"
  PASS=$((PASS+1))
else
  echo "⚠ Role-based rendering kam: $RBAC fayl"
  WARN=$((WARN+1))
fi

# 12.4 Protected menu items
MENU_PROTECT=$(grep -rl "disabled.*role\|hidden.*role\|role.*disabled" "$DASH" 2>/dev/null | wc -l)
if [ "$MENU_PROTECT" -gt 0 ]; then
  echo "✔ Protected menu items topildi"
  PASS=$((PASS+1))
else
  echo "⚠ Protected menu items topilmadi"
  WARN=$((WARN+1))
fi

echo ""
echo "Natija: ✔ $PASS  ✘ $FAIL  ⚠ $WARN"
[ $FAIL -eq 0 ] && exit 0 || exit 1
