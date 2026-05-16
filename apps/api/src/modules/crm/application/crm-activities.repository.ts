/**
 * @module crm-activities.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_ACTIVITIES_REPO` symbol + `ICrmActivitiesRepo`
 *   from `domain/repositories/i-crm-activities.repo`.
 */

export { CrmActivitiesRepository } from '../infrastructure/repositories/crm-activities.repository';
