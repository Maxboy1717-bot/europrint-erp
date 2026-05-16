/**
 * @module crm-leads-ops.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_LEADS_OPS_REPO` symbol + `ICrmLeadsOpsRepo`
 *   from `domain/repositories/i-crm-leads-ops.repo`.
 */

export { CrmLeadsOpsRepository } from '../infrastructure/repositories/crm-leads-ops.repository';
