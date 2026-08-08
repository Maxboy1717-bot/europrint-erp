/**
 * @module owner-scope
 * @description Row-level ownership scoping for CRM lead/deal reads.
 *
 * Owner decision (2026-07-09, Item A — CRM ownership converge onto assigned_to):
 * a non-privileged sales manager may only see rows they own (`assigned_to = self`),
 * while the privileged set {super_admin, admin, director} sees everything.
 *
 * `isPrivileged` mirrors EXACTLY the RolesGuard system-role bypass
 * (roles.guard.ts: `admin | super_admin | director`, case-insensitive) so the read
 * scope and the route allow-list agree on who is exempt. Keep the two in lockstep.
 */

/** The system-level roles that bypass row-level ownership scoping (see RolesGuard). */
const PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'director']);

/** True when the role bypasses ownership scoping (case-insensitive). */
export function isPrivileged(role?: string | null): boolean {
  return role != null && PRIVILEGED_ROLES.has(String(role).toLowerCase());
}

/**
 * Resolve the ownership filter for the authenticated user.
 * @returns `null` for privileged users (= see all rows), otherwise the user's own id
 *   (= see only rows where `assigned_to = <id>`). A `null` id (should not happen behind
 *   JwtAuthGuard) falls back to a non-matching sentinel so the default is fail-closed.
 */
export function scopedOwnerId(user: { id?: number | null; role?: string | null } | null | undefined): number | null {
  if (!user) return -1; // no identity → match nothing (fail-closed)
  if (isPrivileged(user.role ?? null)) return null; // privileged → see all
  return typeof user.id === 'number' ? user.id : -1;
}
