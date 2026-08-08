/**
 * @module security.constants
 * @description Canonical security parameters shared across the codebase.
 *
 * Centralising these values prevents drift between modules (e.g. the admin
 * seeder using one cost factor while the runtime hasher uses another, which
 * would produce hashes that look valid in one path but unverifiable in the
 * other).
 *
 * SECURITY: PA-S5 — `BCRYPT_ROUNDS` MUST be the same constant everywhere
 * bcrypt is invoked. Any new bcrypt.hash() call site must import from here.
 */

/**
 * Bcrypt cost factor used for ALL password / PIN hashing in this codebase.
 *
 * 12 was chosen as the floor: <11 is widely considered too weak for any
 * production identity surface, and >13 noticeably slows down the admin seed
 * step in CI without measurable security gain at our threat profile.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Failed-login count at which an account is locked out.
 *
 * MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md item #7 (M7): this value was
 * previously duplicated as two independent literals (drizzle-auth.repo.ts's
 * raw-SQL CASE WHEN and login.service.ts's application-layer check) with no
 * shared source -- exactly the drift risk this file exists to prevent for
 * BCRYPT_ROUNDS. Both call sites now import this constant.
 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
