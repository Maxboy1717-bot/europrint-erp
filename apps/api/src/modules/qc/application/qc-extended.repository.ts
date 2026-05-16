/**
 * @module qc-extended.repository (shim)
 * @description Back-compat re-export. The concrete implementation moved to
 *   `infrastructure/repositories/qc-extended.repository.ts` per PA1-9.
 *   Prefer DI via {@link QC_EXTENDED_REPO} Symbol + {@link IQcExtendedRepo}.
 */

export { QcExtendedRepository } from '../infrastructure/repositories/qc-extended.repository';
export {
  QC_EXTENDED_REPO,
  type IQcExtendedRepo,
} from '../domain/repositories/i-qc-extended.repo';
