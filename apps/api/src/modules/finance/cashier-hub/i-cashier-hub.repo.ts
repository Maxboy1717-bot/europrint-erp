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
  /** Optional per-shift daily cash ceiling (UZS). NULL/undefined = no limit. */
  dailyCashLimit?: number | null;
}

/** One ledger line: a movement enriched with the running drawer balance after it (chronological). */
export interface CashierLedgerLine {
  id: number;
  type: CashierMovementType;
  amount: number;
  /** Signed effect on the drawer: +amount for cash_in, −amount otherwise. */
  signedAmount: number;
  /** Running drawer balance AFTER this movement (opening + Σ signed up to and including this line). */
  runningBalance: number;
  reference: string;
  description: string | null;
  pinVerified: boolean;
  createdAt: Date | string | null;
}

/** The X/Z naqd-ledger for a shift: opening + chronological lines + saldo + (optional) limit warning. */
export interface CashierLedger {
  shiftId: number;
  status: string;
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  /** Current drawer balance = opening + Σ(cash_in) − Σ(cash_out). */
  balance: number;
  /** Effective daily cash ceiling (per-shift override → global cfo_config default → null). */
  dailyCashLimit: number | null;
  /** True when a positive limit is set and balance exceeds it (drawer over the ceiling). */
  limitExceeded: boolean;
  lines: CashierLedgerLine[];
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

/** Per-movement-type tally for the X/Z reconciliation breakdown (count + summed amount). */
export interface MovementTypeTally {
  type: CashierMovementType;
  count: number;
  total: number;
}

export interface ShiftMovementTotals {
  cashIn: number;
  cashOut: number;
  movementCount: number;
  /** Itemised breakdown per movement type (cash_in / cash_out / salary_payout / advance / expense). */
  byType: MovementTypeTally[];
}

/** Filters for the paginated shift list (GET shifts). */
export interface ListShiftsFilters {
  status?: 'open' | 'closed';
  cashierUserId?: number;
  limit: number;
  offset: number;
}

/** A shift list row joined to the cashier's display name (read-only projection). */
export interface ShiftListRow {
  id: number;
  cashierUserId: number;
  cashierName: string | null;
  openedAt: Date | string | null;
  openedAmount: string | number | null;
  closedAt: Date | string | null;
  closedAmount: string | number | null;
  expectedAmount: string | number | null;
  variance: string | number | null;
  status: string;
  notes: string | null;
}

/** A page of shift rows + the total matching count (matches the codebase {data,total} list shape). */
export interface ShiftListPage {
  data: ShiftListRow[];
  total: number;
}

/** X/Z reconciliation summary for a shift. */
export interface ShiftSummary {
  shift: CashierShift;
  cashIn: number;
  cashOut: number;
  movementCount: number;
  expectedAmount: number; // openedAmount + Σcash_in − Σcash_out
  /** Counted drawer cash declared at close (null while the shift is still open / X-report). */
  closedAmount: number | null;
  /** closedAmount − expectedAmount (null while open). >0 = over, <0 = short. */
  variance: number | null;
  /** Itemised per-type reconciliation breakdown (cash_in / cash_out / salary_payout / advance / expense). */
  byType: MovementTypeTally[];
}

export interface ICashierHubRepository {
  /** The currently OPEN shift for a cashier, or null if none. */
  findOpenShiftByCashier(cashierUserId: number): Promise<Result<CashierShift | null>>;
  findShiftById(id: number): Promise<Result<CashierShift | null>>;
  /** Paginated shift list (newest first), optionally filtered by status / cashier; joined to the cashier name. */
  listShifts(filters: ListShiftsFilters): Promise<Result<ShiftListPage>>;
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
  /** Global default cashier daily cash limit (cfo_config.cashier_daily_cash_limit_uzs), or null when unset/0. */
  findGlobalDailyCashLimit(): Promise<Result<number | null>>;
  /** A single shift joined to the cashier's display name (kunlik PDF header) — null if not found. */
  getShiftForPdf(shiftId: number): Promise<Result<ShiftListRow | null>>;
}
