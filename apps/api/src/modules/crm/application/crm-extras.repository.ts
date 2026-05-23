/**
 * @module crm-extras.repository
 * @description Re-export barrel for CrmExtrasRepository.
 *   Tests and legacy code that import from this path get the concrete
 *   infrastructure implementation.
 */
export { CrmExtrasRepository } from '../infrastructure/repositories/crm-extras.repository';
export { CRM_EXTRAS_REPO } from '../domain/repositories/i-crm-extras.repo';
