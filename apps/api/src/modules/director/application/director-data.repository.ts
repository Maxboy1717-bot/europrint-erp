/**
 * @module director-data.repository (back-compat shim)
 * @deprecated Import from `../infrastructure/repositories/director-data.repository`
 *   or via the `DIRECTOR_DATA_REPO` Symbol token.
 */

export {
  DirectorDataRepository,
  type DashboardData,
  type SummaryData,
  type ProductionData,
  type HrData,
  type FinanceData,
  type AlertsData,
  type AiSummaryData,
} from '../infrastructure/repositories/director-data.repository';
