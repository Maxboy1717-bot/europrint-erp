/**
 * @module phone-number.vo
 * @description Phone number value object. Validates a simplified E.164
 * (optional leading +, 7..15 digits, first digit non-zero) and strips
 * spaces / dashes / parentheses before validation so user-entered formats
 * like "+998 (90) 123-45-67" survive. Storage form is digits-only with
 * the optional leading "+".
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  /**
   * Validate raw input and wrap as a PhoneNumber. Strips spaces, dashes, and
   * parentheses so common human formats are accepted; rejects anything that
   * still does not match E.164 after normalisation.
   * @param raw - candidate phone number
   * @returns Ok(PhoneNumber) on a valid E.164 shape; Err(VALIDATION) otherwise
   */
  static create(raw: string): Result<PhoneNumber, AppError> {
    if (typeof raw !== 'string') {
      return Err(AppErr('VALIDATION', `Invalid PhoneNumber: ${String(raw)}`));
    }
    const stripped = raw.replace(/[\s\-()]/g, '');
    if (!PHONE_RE.test(stripped)) {
      return Err(AppErr('VALIDATION', `Invalid PhoneNumber: ${raw}`));
    }
    return Ok(new PhoneNumber(stripped));
  }

  /**
   * Escape hatch for trusted-source hydration (repository → aggregate).
   * Still strips whitespace but skips E.164 validation.
   */
  static fromRaw(value: string): PhoneNumber {
    return new PhoneNumber(String(value).replace(/[\s\-()]/g, ''));
  }

  equals(other: PhoneNumber): boolean {
    return other instanceof PhoneNumber && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
