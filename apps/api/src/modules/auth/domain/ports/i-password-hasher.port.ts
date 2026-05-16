/**
 * @module i-password-hasher.port
 * @description Domain port (hexagonal). Defines the contract the auth domain
 * uses to hash and verify passwords without binding to a specific crypto
 * library. The concrete implementation (e.g. argon2, scrypt, password-hashing
 * library X) lives in the infrastructure layer and is bound in
 * `auth.module.ts` via the {@link PASSWORD_HASHER} DI token.
 *
 * Keeping crypto libraries out of the domain (the previous `password.vo.ts`
 * imported one directly) restores Clean Architecture: domain depends on
 * ports, not on infrastructure detail.
 */

/** DI token for {@link IPasswordHasher}. */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Port: password hashing + verification.
 * Implementations must use a constant-time comparison for `verify`.
 */
export interface IPasswordHasher {
  /**
   * Hashes a plain-text password using the configured algorithm and cost.
   * @param plain - plain-text password
   * @returns the encoded hash (algorithm-specific format, e.g. `$2b$10$…`)
   */
  hash(plain: string): Promise<string>;

  /**
   * Verifies a plain-text password against a previously produced hash.
   * @param plain - plain-text password supplied by the user
   * @param hashed - hash previously produced by {@link hash}
   * @returns true iff the password matches; false otherwise (never throws on mismatch)
   */
  verify(plain: string, hashed: string): Promise<boolean>;
}
