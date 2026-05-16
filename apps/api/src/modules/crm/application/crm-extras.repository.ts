/**
 * @module crm-extras.repository (shim)
 * @description Back-compat re-export. The concrete implementation moved to
 *   `infrastructure/repositories/crm-extras.repository.ts` per PA1-9.
 *   Prefer DI via {@link CRM_EXTRAS_REPO} Symbol + {@link ICrmExtrasRepo}.
 */

export { CrmExtrasRepository } from '../infrastructure/repositories/crm-extras.repository';
export {
  CRM_EXTRAS_REPO,
  type ICrmExtrasRepo,
} from '../domain/repositories/i-crm-extras.repo';
