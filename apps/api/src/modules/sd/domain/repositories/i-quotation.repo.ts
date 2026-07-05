/**
 * @module i-quotation.repo
 * @description Domain repository interface for quotation/contract/order/payment
 *   mutations exposed by `SdQuotationsController`. Each method returns
 *   `Result<T, AppError>` so the application layer can map failures to HTTP
 *   responses via `unwrapOrThrow`. The concrete implementation lives at
 *   `infrastructure/repositories/drizzle-quotation.repo.ts`.
 * @layer Domain (SD)
 */

import { Result, AppError } from '@common/result';

export type MutationRow = Record<string, unknown>;

export interface QuotationUpdatePatch {
  title?: unknown;
  total_amount?: unknown;
  currency?: unknown;
  valid_until?: unknown;
  notes?: unknown;
  status?: unknown;
  items?: unknown;
}

export interface KpiTargetPatch {
  /** Canonical DB column — maps FE revenueTarget / quota_amount / target_value. */
  quota_amount?: unknown;
  target_value?: unknown;
  period?: unknown;
}

/**
 * Price-settings patch — the SDSettings form sends a PARTIAL set of these
 * camelCase price fields (only the ones the user changed). They map 1:1 to the
 * snake_case columns of the singleton `sd_price_formulas` row (id=1).
 */
export interface PriceFormulaPatch {
  paperBPrice?: unknown;
  paperCPrice?: unknown;
  paperBcPrice?: unknown;
  paperEPrice?: unknown;
  print1ColorPrice?: unknown;
  print2ColorPrice?: unknown;
  print4ColorPrice?: unknown;
  plateCostPerColor?: unknown;
  dieCostNew?: unknown;
  laminationPrice?: unknown;
  embossingPrice?: unknown;
  perforationPrice?: unknown;
  deliveryBaseCost?: unknown;
  storageFreedays?: unknown;
  storageDailyRate?: unknown;
  defaultMarkupPercent?: unknown;
  vatRate?: unknown;
}

export interface IQuotationRepo {
  // Quotation status transitions
  sendQuotation(id: string): Promise<Result<MutationRow | null, AppError>>;
  approveQuotation(id: string, approvedBy?: number): Promise<Result<MutationRow | null, AppError>>;

  // Quotation partial update + soft delete
  updateQuotation(id: string, patch: QuotationUpdatePatch): Promise<Result<MutationRow | null, AppError>>;
  softDeleteQuotation(id: string): Promise<Result<MutationRow | null, AppError>>;

  // KPI targets
  updateKpiTarget(id: string, patch: KpiTargetPatch): Promise<Result<MutationRow | null, AppError>>;

  // Sales orders
  cancelSalesOrder(id: string, reason: unknown): Promise<Result<MutationRow | null, AppError>>;

  // Payments
  markPaymentPaid(id: string, paymentDate: unknown): Promise<Result<MutationRow | null, AppError>>;

  // Contracts
  signContract(id: string, signatureData: unknown): Promise<Result<MutationRow | null, AppError>>;

  // Price formulas (singleton settings row, id=1)
  upsertPriceFormula(patch: PriceFormulaPatch): Promise<Result<MutationRow | null, AppError>>;
  getPriceSettings(): Promise<Result<MutationRow | null, AppError>>;
}

export const QUOTATION_REPO = Symbol('QUOTATION_REPO');
