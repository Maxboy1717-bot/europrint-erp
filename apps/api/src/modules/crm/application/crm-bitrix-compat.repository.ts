/**
 * @module crm-bitrix-compat.repository (shim)
 * @description Back-compat re-export. The concrete implementation moved to
 *   `infrastructure/repositories/crm-bitrix-compat.repository.ts` per PA1-9.
 *   Prefer DI via {@link CRM_BITRIX_COMPAT_REPO} Symbol + {@link ICrmBitrixCompatRepo}.
 */

export { CrmBitrixCompatRepository } from '../infrastructure/repositories/crm-bitrix-compat.repository';
export {
  CRM_BITRIX_COMPAT_REPO,
  type ICrmBitrixCompatRepo,
} from '../domain/repositories/i-crm-bitrix-compat.repo';
