/**
 * @module common/db-rows (shim)
 * @description Back-compat re-export. Canonical location is `@common/db/db-rows`.
 * 78 import sites use `@common/db-rows` — this shim keeps them working while
 * migration to `@common/db/db-rows` proceeds incrementally.
 *
 * DO NOT add new exports here. Import from `@common/db/db-rows` directly.
 */
export {
  castTo,
  dbRows,
  rows,
  dbRow,
  dbCatch,
  unwrapError,
  safeInt,
  type DbRow,
} from './db/db-rows';
