/**
 * @module i-sd-quotations.repo
 * @description Domain repository interface for SD quotations / contracts /
 *   price formulas / KPI / funnel / quotation-to-order conversion.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/sd-quotations.repository.ts`.
 * @layer Domain (SD)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ISdQuotationsRepo {
  listQuotations(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  createQuotation(body: Row): Promise<Result<Row | null>>;
  listContracts(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  createContract(body: Row): Promise<Result<Row | null>>;
  listPriceFormulas(lim: number, off: number): Promise<Result<Row[]>>;
  getKpiTeam(): Promise<Result<Row[]>>;
  getKpiTargets(managerId: number | null): Promise<Result<Row[]>>;
  getFunnelReport(): Promise<Result<Row>>;
  getQuotationById(id: string): Promise<Result<Row | null>>;
  convertQuotationToOrder(id: string): Promise<Result<{ error: string } | { order: Row }>>;
}

export const SD_QUOTATIONS_REPO = Symbol('SD_QUOTATIONS_REPO');
