/**
 * @module password.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 *
 * This VO is now PURE — it holds a hashed password and enforces complexity
 * rules on the plain-text candidate, but contains NO crypto library calls.
 * Hashing and verification are delegated to the {@link IPasswordHasher} port
 * (implemented by `BcryptPasswordHasher` in the infrastructure layer).
 *
 * Use:
 *   - `PasswordValueObject.validateComplexity(plain)` — throws BadRequest if weak
 *   - `PasswordValueObject.fromHash(hash)` — wrap a hash produced by the hasher
 *   - `vo.getHash()` — read the stored hash for persistence
 */

import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class PasswordValueObject {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  /**
   * Builds a VO directly from an already-hashed password (the canonical
   * factory). Use this after calling `IPasswordHasher.hash(plain)` in a
   * service.
   * @param hash - encoded hash produced by an IPasswordHasher (must start with `$2`)
   * @throws DomainError when the hash format is invalid
   */
  static fromHash(hash: string): PasswordValueObject {
    if (!hash.startsWith('$2')) {
      throw new DomainError('INVALID_PASSWORD_HASH', 'Invalid password hash format');
    }
    return new PasswordValueObject(hash);
  }

  /**
   * Legacy alias for {@link fromHash}. Kept for callers that already use the
   * `createFromHash` name (e.g. the aggregate's constructor).
   */
  static createFromHash(hash: string): PasswordValueObject {
    return PasswordValueObject.fromHash(hash);
  }

  /**
   * Validates plain-text password complexity (length, upper, lower, digit,
   * special). Throws on failure; returns nothing on success.
   *
   * Pure function — no crypto, no IO. Callers hash separately via
   * {@link IPasswordHasher}.
   *
   * @param password - plain-text candidate
   * @throws DomainError with all violations joined by `; `
   */
  static validateComplexity(password: string): void {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Parol kamida 1 ta katta harfni o\'z ichiga olishi kerak');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Parol kamida 1 ta kichik harfni o\'z ichiga olishi kerak');
    }
    if (!/\d/.test(password)) {
      errors.push('Parol kamida 1 ta raqamni o\'z ichiga olishi kerak');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Parol kamida 1 ta maxsus belgini o\'z ichiga olishi kerak');
    }

    if (errors.length > 0) {
      throw new DomainError('PASSWORD_COMPLEXITY', errors.join('; '));
    }
  }

  /** Returns the stored hash for persistence. */
  getHash(): string {
    return this.hash;
  }
}
