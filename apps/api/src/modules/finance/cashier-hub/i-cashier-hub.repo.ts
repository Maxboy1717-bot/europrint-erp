/**
 * @module i-cashier-hub.repo
 * @description Domain repository interface for the CASHIER-HUB KAS-1 (factory cashier hub).
 *   Shift open/close + cash movements. All methods return Result<T> (never throw/null).
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';
import type { CashierShift, CashierMovement } from '@workspace/db';

export const CASHIER_HUB_REPO = Symbol('ICashierHubRepository');

export type CashierMovementType =
  | 'cash_in'
  | 'cash_out'
  | 'salary_payout'
  | 'advance'
  | 'expense';

export interface OpenShiftDto {
  cashierUserId: number;
  openingAmount: number;
}

export interface RecordMovementDto {
  shiftId: number;
  type: CashierMovementType;
  amount: number;
  reference: string;
  description?: string | null;
  glEntryId?: number | null;
  createdBy?: number | null;
  pinVerified: boolean;
}

export interface ShiftMovementTotals {
  cashIn: number;
  cashOut: number;
  movementCount: number;
}

/** X/Z reconciliation summary for a shift. */
export interface ShiftSummary {
  shift: CashierShift;
  cashIn: number;
  cashOut: number;
  movementCount: number;
  expectedAmount: number; // openedAmount + Σcash_in − Σcash_out
}

export interface ICashierHubRepository {
  /** The currently OPEN shift for a cashier, or null if none. */
  findOpenShiftByCashier(cashierUserId: number): Promise<Result<CashierShift | null>>;
  findShiftById(id: number): Promise<Result<CashierShift | null>>;
  openShift(dto: OpenShiftDto): Promise<Result<CashierShift>>;
  /** Persist close fields (closedAmount/expectedAmount/variance/status). */
  closeShift(
    id: number,
    fields: { closedAmount: number; expectedAmount: number; variance: number; notes?: string | null },
  ): Promise<Result<CashierShift>>;
  /** Σ(cash_in) / Σ(cash_out) / count for a shift's movements. */
  getShiftMovementTotals(shiftId: number): Promise<Result<ShiftMovementTotals>>;
  /** Idempotency: the existing movement for a business reference, or null. */
  findMovementByReference(reference: string): Promise<Result<CashierMovement | null>>;
  insertMovement(dto: RecordMovementDto): Promise<Result<CashierMovement>>;
  listMovements(shiftId: number): Promise<Result<CashierMovement[]>>;
  /** Read a cashier's 4-digit PIN hash (users.pin_hash), or null if no PIN store/value. */
  findCashierPinHash(cashierUserId: number): Promise<Result<string | null>>;
}
