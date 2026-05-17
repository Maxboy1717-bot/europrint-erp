/**
 * @module salary.vo
 * @description Salary value object. Immutable monthly payroll snapshot with a
 * non-negative `net` invariant. Composes `gross`, `inps`, `jshd`, and `net`
 * (per HR audit 2026-05-16 §2.3 #3) where:
 *
 *   net = max(0, gross - inps - jshd - other)
 *
 * The clamp at zero is intentional — Uzbekistan payroll rules can produce a
 * computed "net" below zero (e.g. when garnishments + taxes exceed gross),
 * and the recorded net in those cases is 0 with the remainder logged as a
 * payable. The aggregate is responsible for emitting that overflow as an
 * event; the VO only owns the invariant `net >= 0`.
 *
 * Construction goes through `Salary.create(...)` (Result<Salary>); the
 * private constructor accepts already-validated values.
 */

import { Result, Ok, Err, AppErr } from '@common/types/result.type';

export interface SalaryReadonlyProps {
  readonly gross: number;
  readonly inps: number;
  readonly jshd: number;
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
    inps: number,
    jshd: number,
    other: number = 0,
    currency: string = 'UZS',
  ): Result<Salary> {
    const fields: Record<string, number> = { gross, inps, jshd, other };
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
    const net = Math.max(0, gross - inps - jshd - other);
    return Ok(new Salary({ gross, inps, jshd, net, currency: cur }));
  }

  get gross(): number { return this.p.gross; }
  get inps(): number { return this.p.inps; }
  get jshd(): number { return this.p.jshd; }
  get net(): number { return this.p.net; }
  get currency(): string { return this.p.currency; }

  /** INPS + JSHD — convenience for GL postings and dashboards. */
  totalTax(): number {
    return this.p.inps + this.p.jshd;
  }

  equals(other: Salary): boolean {
    return (
      this.p.gross === other.p.gross &&
      this.p.inps === other.p.inps &&
      this.p.jshd === other.p.jshd &&
      this.p.net === other.p.net &&
      this.p.currency === other.p.currency
    );
  }
}
