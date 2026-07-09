/**
 * @module crm-row-scope
 * @description Row-level ownership scoping for CRM lead/deal reads (Item A).
 *   Rule (owner-approved): a non-privileged manager sees only rows they own (assigned_to = self);
 *   privileged system roles see everything.
 *
 *   The privileged set is the SAME system-level exempt set the rest of the RBAC design uses
 *   (RolesGuard bypass / PermissionGuard.isAdminRole / login.service.isCardExemptRole /
 *   card-gate-precheck.CARD_EXEMPT_ROLES = super_admin/admin/director). It is duplicated here
 *   deliberately — that set is already intentionally duplicated-and-kept-in-sync across auth,
 *   and CC row-scoping inlines it the same way — so CRM does not invent a new determination.
 */

/** System-level roles that see ALL CRM rows (mirror of CARD_EXEMPT_ROLES). */
const CRM_SEES_ALL_ROLES: ReadonlyArray<string> = ['super_admin', 'admin', 'director'];

/** True if the role bypasses row-scoping (sees every lead/deal). Case-insensitive. */
export function crmSeesAllRows(role: string | null | undefined): boolean {
  return role != null && CRM_SEES_ALL_ROLES.includes(String(role).toLowerCase());
}

/**
 * The owner id to filter CRM lead/deal reads by, or `null` to apply no filter (privileged → sees all).
 * Fail-closed: a user object with no resolvable id that is NOT privileged is scoped to -1 (matches
 * nothing) rather than defaulting to "see all" — a missing identity must never widen visibility.
 */
export function crmOwnerScope(user: { id?: number | null; role?: string | null } | null | undefined): number | null {
  if (crmSeesAllRows(user?.role)) return null;
  return user?.id ?? -1;
}
