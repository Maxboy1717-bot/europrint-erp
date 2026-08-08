/**
 * @module crm-row-scope
 * @description Row-level ownership scoping for CRM lead/deal reads (Item A).
 *   Rule (owner-approved): a non-privileged manager sees only rows they own; privileged system
 *   roles see everything.
 *
 *   ⭐ CORRECTED 2026-07-11 (owner interview log — supersedes the original "Item A: CRM ownership
 *   convergence" note, which declared `assigned_to` canonical): live `assigned_to` was found to be
 *   either empty (pre-convergence rows) or a mirror written alongside `assigned_by_id`/`manager_id`
 *   by only SOME write paths — misleading as an authorization source. The corrected canonical
 *   ownership column, in priority order, is `COALESCE(assigned_by_id, manager_id)` — see
 *   `crmResolveOwnerId()` below. `assigned_to` stays populated by every write path exactly as
 *   before (additive, unchanged) for any existing display-only reader; it is simply no longer
 *   trusted for authorization/scoping decisions.
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

/**
 * Resolves the CRM ownership id from an already-fetched row using the corrected canonical column
 * priority (2026-07-11 owner resolution, see module doc comment above): `assigned_by_id` first,
 * `manager_id` as fallback when it is null. `assigned_to` is deliberately NOT read here.
 * Callers (DealsService.findOne / LeadsService.findOne via mapLeadRow) must have selected both
 * physical columns onto the row first — crm_deals (a passthrough VIEW over `deals`) exposes them
 * directly; crm_leads needs an explicit raw-SQL select for `manager_id` since the Drizzle compat
 * schema's `manager_id` property is aliased to the physical `assigned_to` column.
 */
export function crmResolveOwnerId(row: { assigned_by_id?: unknown; manager_id?: unknown } | null | undefined): number | null {
  if (!row) return null;
  if (row.assigned_by_id != null) {
    const n = Number(row.assigned_by_id);
    if (!Number.isNaN(n)) return n;
  }
  if (row.manager_id != null) {
    const n = Number(row.manager_id);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}
