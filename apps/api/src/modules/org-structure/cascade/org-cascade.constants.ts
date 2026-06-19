/**
 * @module org-structure/cascade/org-cascade.constants
 * @description EP-ORG-041 (ORG-CASCADE) own-module configuration. The set of
 *   node types that BEAR a warehouse is configurable here (NOT hardcoded across
 *   the listener) so the owner can extend it without touching logic — Q-40
 *   (vision-driven) + decision #13 ("barchasi sozlanadigan").
 *
 * Vision (CHAT-TARIXI §org-unit): the production hierarchy is
 *   Bo'lim → Sex → Uskuna → Ishchi. A new node of a warehouse-bearing type
 *   (a workshop / sex, or an explicit warehouse node, or a department that
 *   physically holds stock) auto-provisions a POS-Monitor warehouse.
 */

/** EventEmitter2 event name for the post-commit department-created signal. */
export const ORG_CASCADE_EVENT = 'org.department.created';

/**
 * Node types that trigger auto-warehouse + RBAC provisioning.
 * Configurable own-module list (owner may extend). Comparison is
 * case-insensitive (see isWarehouseBearingType).
 */
export const WAREHOUSE_BEARING_NODE_TYPES: readonly string[] = [
  'sex',                  // ishlab chiqarish sexi (workshop) — holds WIP/RM
  'warehouse',           // explicit ombor node
  'department_warehouse', // bo'lim ombori
];

/**
 * RBAC role granted to the node head when a warehouse is auto-created.
 * Matches the seeded `roles.name` set (docs/migration/seed/seed-01-roles.sql →
 * 'wms_operator' = "Ombor operatori"). The existing `users.role` column +
 * RolesGuard is the canonical RBAC mechanism (no parallel master — Q-46).
 */
export const WAREHOUSE_HEAD_ROLE = 'wms_operator';

/**
 * Roles that are NEVER downgraded by the cascade. If the node head already
 * holds a higher-privilege role we must not clobber it — only users with an
 * empty role or the default 'employee' role are granted the warehouse role.
 */
export const PROTECTED_ROLES: readonly string[] = [
  'super_admin',
  'admin',
  'director',
];

/**
 * Default warehouse `type` for an auto-created node warehouse. Must be a value
 * accepted by the `warehouses_type_chk` CHECK constraint (wms-schema.ts).
 */
export const CASCADE_WAREHOUSE_TYPE = 'department_warehouse';

/**
 * Deterministic warehouse code for a node — also the idempotency key. The
 * existing `warehouses.code` column is UNIQUE, so re-running the cascade for
 * the same node maps to the same code and is skipped (no duplicate).
 */
export function warehouseCodeForNode(nodeId: number): string {
  return `ORG-WH-${nodeId}`;
}

/** Case-insensitive membership test against WAREHOUSE_BEARING_NODE_TYPES. */
export function isWarehouseBearingType(nodeType: string | null | undefined): boolean {
  if (!nodeType) return false;
  const lower = nodeType.toLowerCase();
  return WAREHOUSE_BEARING_NODE_TYPES.some((t) => t.toLowerCase() === lower);
}

/** Whether a role may be overwritten by the cascade grant. */
export function isGrantableRole(currentRole: string | null | undefined): boolean {
  if (!currentRole) return true;
  const lower = currentRole.toLowerCase();
  if (PROTECTED_ROLES.some((r) => r.toLowerCase() === lower)) return false;
  // Already a warehouse operator → idempotent no-op (still "grantable" = same value).
  return true;
}
