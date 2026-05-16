/**
 * @module crm-auto-lead.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_AUTO_LEAD_REPO` symbol + `ICrmAutoLeadRepo`
 *   from `domain/repositories/i-crm-auto-lead.repo`.
 */

export { CrmAutoLeadRepository } from '../infrastructure/repositories/crm-auto-lead.repository';
