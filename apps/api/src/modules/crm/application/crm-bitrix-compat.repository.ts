/**
 * @module crm-bitrix-compat.repository
 * @description Re-export barrel for CrmBitrixCompatRepository.
 *   Tests and legacy code that import from this path get the concrete
 *   infrastructure implementation.
 */
export { CrmBitrixCompatRepository } from '../infrastructure/repositories/crm-bitrix-compat.repository';
export { CRM_BITRIX_COMPAT_REPO } from '../domain/repositories/i-crm-bitrix-compat.repo';
