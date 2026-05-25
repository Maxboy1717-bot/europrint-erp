/**
 * @module i-director-state.repo
 * @description Domain repository interface for director company-state queries
 *   (WMS rental, weekly company-state history, ideal vs actual KPIs, ad-hoc actions).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/director-state.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface WmsRentalData {
  rentalData: unknown[];
  grandTotal: number;
  grandTotalToDate: number;
  daysElapsed: number;
  daysInMonth: number;
  month: string;
  generatedAt: string;
}

export interface CompanyStateHistoryData {
  history: {
    week_label: string;
    week_start: string;
    revenue: number;
    profit: number;
    perf_ratio: number;
    state_key: string;
  }[];
}

export interface IdealVsActualData {
  week_start: string;
  profit: {
    actual: number;
    target: number;
    pct: number;
    deviation_pct: number;
    formatted_actual: string;
    formatted_target: string;
  };
  revenue: {
    actual: number;
    target: number;
    pct: number;
    deviation_pct: number;
    formatted_actual: string;
    formatted_target: string;
  };
  orders: { completed: number; total: number; completion_pct: number };
}

export interface IDirectorStateRepo {
  queryWmsRental(): Promise<Result<WmsRentalData>>;
  queryCompanyStateHistory(): Promise<Result<CompanyStateHistoryData>>;
  queryIdealVsActual(): Promise<Result<IdealVsActualData>>;
  executeMarkVip(orderId: number): Promise<Result<void>>;
}

export const DIRECTOR_STATE_REPO = Symbol('DIRECTOR_STATE_REPO');
