/**
 * @module i-hr-dashboard-extra.repo
 * @description Domain repository interface for HR dashboard extra aggregates
 *   (resignations, risk scores, safety summary/incidents, offboarding stats,
 *   contracts expiring).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/hr-dashboard-extra.repository.ts`.
 * @layer Domain (HR)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IHrDashboardExtraRepo {
  getResignationStats(): Promise<Result<Row[]>>;
  getRiskScores(): Promise<Result<Row[]>>;
  getSafetySummary(): Promise<Result<Row>>;
  getSafetyIncidents(): Promise<Result<Row[]>>;
  getOffboardingStats(): Promise<Result<Row>>;
  getContractsExpiring(days: number): Promise<Result<Row[]>>;
}

export const HR_DASHBOARD_EXTRA_REPO = Symbol('HR_DASHBOARD_EXTRA_REPO');
