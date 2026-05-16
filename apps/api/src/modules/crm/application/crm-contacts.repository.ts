/**
 * @module crm-contacts.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_CONTACTS_APP_REPO` symbol + `ICrmContactsAppRepo`
 *   from `domain/repositories/i-crm-contacts-app.repo`.
 */

export { CrmContactsRepository } from '../infrastructure/repositories/crm-contacts.repository';
