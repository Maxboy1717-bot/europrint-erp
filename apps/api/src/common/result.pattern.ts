/**
 * @module result.pattern
 * @description Source module. See exports for details.
 */

export type { AppError, AppErrorCode, Result, PaginatedResult } from './result';
export { Ok, Err, isOk, isErr, AppErr, safeCall, safeJsonParse } from './result';
