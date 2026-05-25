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
