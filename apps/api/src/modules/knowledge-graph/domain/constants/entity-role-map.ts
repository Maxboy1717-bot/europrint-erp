/**
 * @module entity-role-map
 * @description Row-level RBAC for the Knowledge Graph — which roles may see
 * nodes/edges of a given `entity_type`. `null` = visible to any authenticated
 * user. Mirrors the per-tool allow-list convention in AIsha
 * (`get-customer-info.tool.ts`'s `CUSTOMER_INFO_ROLES`, `get-employee-info.tool.ts`'s
 * HR role set) rather than inventing a new permission model. Applied by
 * `DrizzleKnowledgeGraphRepository` as a `WHERE entity_type = ANY(allowed)`
 * filter — never trusted from the client, and admin/super_admin/director
 * bypass via `hasAishaRole`'s existing system-wide-role semantics.
 */

const SALES_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin'];
const HR_ROLES = ['hr_manager', 'manager', 'director', 'super_admin'];

export const ENTITY_TYPE_ROLE_MAP: Record<string, readonly string[] | null> = {
  customer:            SALES_ROLES,
  sales_order:         SALES_ROLES,
  employee:            HR_ROLES,
  production_order:    null,
  production_session:  null,
  qc_inspection:        null,
  material:            null,
  document:            null, // erp_documents already owner-scoped at its own layer
  sop:                 null,
};

/** Every known entity_type — used to default a caller's filter when none is given. */
export const ALL_ENTITY_TYPES = Object.keys(ENTITY_TYPE_ROLE_MAP);
