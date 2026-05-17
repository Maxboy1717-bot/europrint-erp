/**
 * @module currency.vo
 * @description ISO-4217 currency code value object. Three-letter alphabetic
 *   codes (e.g. UZS, USD, EUR). The whitelist is intentionally small — add
 *   codes only when the product genuinely supports them.
 * @layer Domain (shared)
 */

import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

const SUPPORTED = new Set(['UZS', 'USD', 'EUR', 'RUB']);

export class Currency {
  private constructor(public readonly code: string) {}

  static of(raw: string): Result<Currency, AppError> {
    if (!raw || typeof raw !== 'string') {
      return Err(AppErr('VALIDATION', `Invalid currency code: ${raw}`));
    }
    const code = raw.toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      return Err(AppErr('VALIDATION', `Invalid currency code: ${raw}`));
    }
    if (!SUPPORTED.has(code)) {
      return Err(AppErr('VALIDATION', `Unsupported currency: ${code}`));
    }
    return Ok(new Currency(code));
  }

  static UZS(): Currency { return new Currency('UZS'); }
  static USD(): Currency { return new Currency('USD'); }

  equals(other: Currency | null | undefined): boolean {
    return !!other && this.code === other.code;
  }

  toString(): string { return this.code; }
}
