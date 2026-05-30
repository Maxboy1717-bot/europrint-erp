/**
 * @module salary.vo
 * @description Salary value object. Immutable monthly payroll snapshot with a
 * non-negative `net` invariant. Composes `gross` and `net` where:
 *
 *   net = max(0, gross - other)   // "other" = NON-TAX deductions (advances/debts)
 *
 * The ERP is GROSS-ONLY: it does NOT compute tax (JSHD/INPS/pension) — that is
 * done entirely in 1C. `net` here is gross minus non-tax deductions only.
 * The clamp at zero is intentional — when non-tax deductions exceed gross the
 * recorded net is 0 with the remainder tracked as a payable.
 *
 * Construction goes through `Salary.create(...)` (Result<Salary>); the
 * private constructor accepts already-validated values.
 */

import { Result, Ok, Err, AppErr } from '@common/types/result.type';

export interface SalaryReadonlyProps {
  readonly gross: number;
  /** = max(0, gross − other); "other" = NON-TAX deductions (advances/debts). No tax. */
  readonly net: number;
  readonly currency: string;
}

export class Salary {
  private constructor(private readonly p: SalaryReadonlyProps) {}

  /**
   * Build a Salary from raw payroll figures. Validates that every input is
   * a finite non-negative number, then computes `net = max(0, gross - inps -
   * jshd - other)`. Currency defaults to UZS (the only payroll currency in
   * use today) and is normalized to upper case.
   */
  static create(
    gross: number,
    other: number = 0,
    currency: string = 'UZS',
  ): Result<Salary> {
    const fields: Record<string, number> = { gross, other };
    for (const [name, v] of Object.entries(fields)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        return Err(AppErr('VALIDATION', `${name} must be a finite number (got ${v})`));
      }
      if (v < 0) {
        return Err(AppErr('VALIDATION', `${name} must be non-negative (got ${v})`));
      }
    }
    const cur = (currency || 'UZS').toUpperCase();
    if (cur.length !== 3) {
      return Err(AppErr('VALIDATION', `Invalid currency code: ${currency}`));
    }
    // NON-TAX only: gross minus non-tax deductions (advances/debts). Tax lives in 1C.
    const net = Math.max(0, gross - other);
    return Ok(new Salary({ gross, net, currency: cur }));
  }

  get gross(): number { return this.p.gross; }
  get net(): number { return this.p.net; }
  get currency(): string { return this.p.currency; }

  equals(other: Salary): boolean {
    return (
      this.p.gross === other.p.gross &&
      this.p.net === other.p.net &&
      this.p.currency === other.p.currency
    );
  }
}
