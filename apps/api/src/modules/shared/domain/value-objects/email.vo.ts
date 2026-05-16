/**
 * @module email.vo
 * @description Email value object. Validates against a simplified RFC 5322
 * pattern (single @, at least one dot in the domain, no whitespace) and
 * normalises to lowercase so equality is case-insensitive. Strict RFC 5322
 * is deliberately not enforced; the regex covers the address shapes the ERP
 * actually accepts (latin alphanumerics + common symbols).
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(public readonly value: string) {}

  /**
   * Validate raw input and wrap as an Email. Trims whitespace and lowercases
   * the result before storing — so `Email.create("  Foo@BAR.com  ").value`
   * yields `"foo@bar.com"`.
   * @param raw - candidate email
   * @returns Ok(Email) on a syntactically valid address; Err(VALIDATION) otherwise
   */
  static create(raw: string): Result<Email, AppError> {
    if (typeof raw !== 'string') {
      return Err(AppErr('VALIDATION', `Invalid Email: ${String(raw)}`));
    }
    const trimmed = raw.trim();
    if (!EMAIL_RE.test(trimmed)) {
      return Err(AppErr('VALIDATION', `Invalid Email: ${raw}`));
    }
    return Ok(new Email(trimmed.toLowerCase()));
  }

  /**
   * Escape hatch for trusted-source hydration (repository → aggregate).
   * Still normalises (lowercase) but skips regex validation.
   */
  static fromRaw(value: string): Email {
    return new Email(String(value).trim().toLowerCase());
  }

  equals(other: Email): boolean {
    return other instanceof Email && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
