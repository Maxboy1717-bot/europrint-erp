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
  getKpiTeam(year: number, month: number): Promise<Result<Row[]>>;
  getKpiTargets(managerId: number | null): Promise<Result<Row[]>>;
  getFunnelReport(): Promise<Result<Row>>;
  getQuotationById(id: string): Promise<Result<Row | null>>;
  getQuotationForPdf(id: string): Promise<Result<Row | null>>;
  getQuotationItems(id: string): Promise<Result<Row[]>>;
  convertQuotationToOrder(id: string): Promise<Result<{ error: string } | { order: Row }>>;
  // 06-sd#107 — load-capacity persist + non-blocking flute/layer recommendation
  setItemLoadCapacity(itemId: string, loadKg: number): Promise<Result<Row | null>>;
  recommendConstruction(loadKg: number): Promise<Result<Row | null>>;
}

export const SD_QUOTATIONS_REPO = Symbol('SD_QUOTATIONS_REPO');
