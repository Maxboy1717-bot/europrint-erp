/**
 * @module crm-custom-fields.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_CUSTOM_FIELDS_REPO` symbol + `ICrmCustomFieldsRepo`
 *   from `domain/repositories/i-crm-custom-fields.repo`.
 */

export { CrmCustomFieldsRepository } from '../infrastructure/repositories/crm-custom-fields.repository';
