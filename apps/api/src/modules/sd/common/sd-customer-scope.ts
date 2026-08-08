/**
 * @module sd-customer-scope
 * @description Ownership scoping for SD customer WRITES (owner decision 2026-07-13,
 *   chat): other SD_WRITE_ROLES managers may VIEW but not EDIT a customer they don't
 *   own (sd_customers.manager_id existed but was never read for authorization anywhere
 *   — GET list/detail stay unrestricted, view-all was already correct there; only the
 *   PUT update() path gets an ownership gate).
 *
 *   Privileged set mirrors the SAME system-level exempt roles the rest of the RBAC
 *   design already uses (RolesGuard bypass / PermissionGuard.isAdminRole /
 *   login.service.isCardExemptRole / CRM's crm-row-scope.ts CRM_SEES_ALL_ROLES =
 *   super_admin/admin/director). Duplicated here deliberately rather than importing
 *   crm-row-scope.ts across the SD/CRM module boundary (service/util import between
 *   modules is banned by this repo's module-contract rule — modules only talk via
 *   events) — same rationale crm-row-scope.ts itself documents for its own
 *   duplication of the set.
 */

/** System-level roles that bypass SD customer ownership checks (mirror of CARD_EXEMPT_ROLES). */
const SD_CUSTOMER_SEES_ALL_ROLES: ReadonlyArray<string> = ['super_admin', 'admin', 'director'];

/** True if the role bypasses ownership checks (sees/edits every customer). Case-insensitive. */
export function sdCustomerSeesAllOwners(role: string | null | undefined): boolean {
  return role != null && SD_CUSTOMER_SEES_ALL_ROLES.includes(String(role).toLowerCase());
}

/**
 * Whether `user` may edit a customer whose `sd_customers.manager_id` is `ownerId`.
 *
 * NULL-safe fallback: `manager_id` is currently NULL for every row (nothing in
 * application code populates it on create yet — verified live 2026-07-13, table
 * post-reset and empty). An UNOWNED customer (ownerId == null) is therefore editable
 * by any SD_WRITE_ROLES caller until claimed — an unresolvable OWNER must never lock
 * every manager out of a row nobody has claimed. (This is the mirror image of CRM's
 * crmOwnerScope, which fails closed on an unresolvable ACTOR id for READ-scoping —
 * here the ambiguity is on the ROW's owner, not the caller's identity, so the safe
 * default runs the other way.)
 */
export function canEditSdCustomer(
  ownerId: number | null | undefined,
  user: { id?: number | null; role?: string | null } | null | undefined,
): boolean {
  if (sdCustomerSeesAllOwners(user?.role)) return true;
  if (ownerId == null) return true;
  return user?.id != null && Number(user.id) === Number(ownerId);
}
