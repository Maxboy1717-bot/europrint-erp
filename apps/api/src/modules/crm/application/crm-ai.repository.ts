/**
 * @module crm-ai.repository (back-compat shim)
 * @description Re-exports the concrete repo from its new infrastructure home.
 *   New code SHOULD inject via `CRM_AI_REPO` symbol + `ICrmAiRepo`
 *   from `domain/repositories/i-crm-ai.repo`.
 */

export { CrmAiRepository } from '../infrastructure/repositories/crm-ai.repository';
