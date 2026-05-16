/**
 * @module money.vo
 * @description Value object. Immutable money amount + ISO-4217 currency code.
 *
 * PA1-12 — canonical Money VO with:
 *   - Result-returning factory (`of`)
 *   - structural `equals`
 *   - arithmetic methods that return `Result<Money>` (no throws)
 *   - `compareTo` for ordering, `toString` for debug formatting
 *
 * NOTE: This is the lightweight Money used by CRM domain code. A separate,
 * Decimal.js-backed Money lives at `@common/money/money.vo` for SD/finance
 * paths that need 4-dp precision. They are intentionally not the same type.
 */

import { Result, Ok, Err } from '@common/types/result.type';
import { AppErr } from '@common/result';
import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string) {
    this._amount = amount;
    this._currency = currency;
  }

  /**
   * Result-returning factory — fails on NaN/Infinity, negative amounts, or
   * malformed currency codes (must be 3 ASCII letters).
   */
  static of(amount: number, currency: string = 'UZS'): Result<Money> {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return Err(AppErr('VALIDATION', 'Money amount must be a finite number'));
    }
    if (amount < 0) {
      return Err(AppErr('VALIDATION', 'Money amount cannot be negative'));
    }
    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
      return Err(AppErr('VALIDATION', `Invalid currency code: ${currency}`));
    }
    const code = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      return Err(AppErr('VALIDATION', `Invalid currency code: ${currency}`));
    }
    return Ok(new Money(amount, code));
  }

  /**
   * Throwing factory — kept ONLY for the legacy hot paths that already wrap
   * with try/catch. New code MUST use `Money.of(...)`.
   *
   * @deprecated Use `Money.of(...)` and unwrap the Result.
   */
  static ofOrThrow(amount: number, currency: string = 'UZS'): Money {
    const r = Money.of(amount, currency);
    if (!r.ok) {
      throw new DomainError(r.error.code, r.error.message);
    }
    return r.data;
  }

  // -- Accessors --

  get amount(): number { return this._amount; }
  get currency(): string { return this._currency; }

  // Back-compat accessors for callers that used the older getter style.
  getAmount(): number { return this._amount; }
  getCurrency(): string { return this._currency; }

  // -- Equality --

  equals(other: Money | null | undefined): boolean {
    if (!other) return false;
    return this._amount === other._amount && this._currency === other._currency;
  }

  // -- Arithmetic (Result-returning) --

  add(other: Money): Result<Money> {
    if (this._currency !== other._currency) {
      return Err(AppErr(
        'VALIDATION',
        `Currency mismatch: ${this._currency} vs ${other._currency}`,
      ));
    }
    return Money.of(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Result<Money> {
    if (this._currency !== other._currency) {
      return Err(AppErr(
        'VALIDATION',
        `Currency mismatch: ${this._currency} vs ${other._currency}`,
      ));
    }
    const next = this._amount - other._amount;
    if (next < 0) {
      return Err(AppErr('VALIDATION', 'Subtraction would produce a negative amount'));
    }
    return Money.of(next, this._currency);
  }

  multiply(factor: number): Result<Money> {
    if (typeof factor !== 'number' || !Number.isFinite(factor) || factor < 0) {
      return Err(AppErr('VALIDATION', 'Multiplication factor must be a non-negative number'));
    }
    return Money.of(this._amount * factor, this._currency);
  }

  divide(divisor: number): Result<Money> {
    if (typeof divisor !== 'number' || !Number.isFinite(divisor) || divisor <= 0) {
      return Err(AppErr('VALIDATION', 'Divisor must be a positive number'));
    }
    return Money.of(this._amount / divisor, this._currency);
  }

  /**
   * Returns -1, 0, or 1 — same shape as Java/C# compareTo. Err if currencies differ.
   */
  compareTo(other: Money): Result<number> {
    if (this._currency !== other._currency) {
      return Err(AppErr(
        'VALIDATION',
        `Currency mismatch: ${this._currency} vs ${other._currency}`,
      ));
    }
    if (this._amount < other._amount) return Ok(-1);
    if (this._amount > other._amount) return Ok(1);
    return Ok(0);
  }

  // -- Misc --

  toNumber(): number { return this._amount; }
  toString(): string { return `${this._amount.toFixed(2)} ${this._currency}`; }
}
