/**
 * @module crm-companies.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_COMPANIES_REPO` symbol + `ICrmCompaniesRepo`
 *   from `domain/repositories/i-crm-companies.repo`.
 */

export { CrmCompaniesRepository } from '../infrastructure/repositories/crm-companies.repository';
