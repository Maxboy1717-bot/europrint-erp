/**
 * @module drizzle.types
 * @description Canonical location for the Drizzle transaction-executor opaque type.
 *
 * Drizzle's `db.transaction(async (tx) => ...)` supplies a `tx` whose API mirrors `db`.
 * We accept it as `unknown` so domain repository interfaces stay free of Drizzle
 * infrastructure dependencies (no leaking of ORM types into the domain layer).
 *
 * Import this in every domain repository interface that accepts an optional `tx`:
 *   import type { DrizzleExecutor } from '@common/types/drizzle.types';
 */
export type DrizzleExecutor = unknown;
