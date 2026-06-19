/**
 * @module result
 * @description Result pattern (discriminated union). Foundation type used by
 * every service and repository in the codebase. A function returning
 * `Result<T>` reports success with `{ ok: true, data: T }` or failure with
 * `{ ok: false, error: AppError }`. Companion helpers (`safeCall`, `isOk`,
 * `isErr`, `AppErr`) are exported here; HTTP-exception translation lives in
 * the sibling module `http-result.ts`.
 *
 * Why: avoids thrown exceptions inside business logic, makes failure paths
 * type-safe (TS narrows on `isOk` / `isErr`), and lets controllers translate
 * domain errors into HTTP responses without try/catch noise.
 */

/**
 * Closed enum of well-known error codes. Maps 1:1 to HTTP statuses in
 * `http-result.ts`. Add a new code only when the existing set can't express
 * the failure cleanly; update the switch in `throwFromError` at the same time.
 */
export type AppErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'INTERNAL'
  | 'BAD_REQUEST'
  | 'EXTERNAL_SERVICE'
  | 'EXTERNAL_5XX'
  | 'EXTERNAL_TIMEOUT'
  | 'DB_ERROR'
  | 'INVALID_STATUS'
  | 'APPROVE_COUNT_ERROR'
  | 'UNCOUNTED_LINES'
  | 'COMPLETE_COUNT_ERROR'
  | 'SAME_WAREHOUSE'
  | 'INVALID_REASON'
  | 'NO_LINES'
  | 'INVALID_QUANTITY'
  | 'CREATE_REQUEST_ERROR'
  | 'NO_ITEMS'
  | 'START_COUNT_ERROR'
  | 'UPDATE_LINE_ERROR'
  | 'INVALID_TRANSITION'
  | 'BUSINESS_RULE_VIOLATION'
  | 'PAYMENT_REQUIRED'
  | 'UPDATE_STATUS_ERROR'
  | 'INVALID_BARCODE'
  | 'BARCODE_LOOKUP_ERROR'
  | 'GET_COUNTS_ERROR'
  | 'INVALID_DATE_RANGE'
  | 'MOVEMENT_REPORT_ERROR'
  | 'EMPLOYEE_ACTIVITY_ERROR'
  | 'LOW_STOCK_ERROR'
  | 'GET_REQUESTS_ERROR'
  | 'NOT_IMPLEMENTED';

/**
 * Structured error payload returned inside `Result.error`.
 * @property code - one of the closed AppErrorCode set; drives HTTP mapping
 * @property message - human-readable, may be surfaced to the user (translated)
 * @property details - optional structured context for logging / debugging
 */
export interface AppError {
  message: string;
  code: AppErrorCode;
  details?: unknown;
}

/**
 * Discriminated union encoding success or failure.
 * @template T - the success payload type
 * @template E - the error type (defaults to AppError)
 */
export type Result<T, E = AppError> =
  | { ok: true; data: T; error?: E }
  | { ok: false; error: E; data?: T };

/**
 * Construct a success Result. Preserves falsy values verbatim (0, '', null, false, []).
 * @param data - success payload; omit for `Result<void>`
 * @returns Result<T> with ok=true
 */
export function Ok<T = void>(data?: T): Result<T> {
  return { ok: true, data: data as T };
}

/**
 * Construct a failure Result.
 * @param error - either a free-form string (gets wrapped as { code:'INTERNAL', message }) or a typed AppError
 * @returns Result with ok=false
 */
export function Err<T = never>(error: string | AppError): Result<T, AppError> {
  const appError: AppError =
    typeof error === 'string' ? { code: 'INTERNAL', message: error } : error;
  return { ok: false, error: appError };
}

/**
 * Type guard narrowing to the success branch.
 * @param r - any Result
 * @returns true if the result is a success; narrows r.data to T
 */
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; data: T } {
  return r.ok === true;
}

/**
 * Type guard narrowing to the failure branch.
 * @param r - any Result
 * @returns true if the result is a failure; narrows r.error to E
 */
export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return r.ok === false;
}

/**
 * Factory for typed AppError values. Prefer this over building inline literals
 * so the code+message contract is one call site.
 * @param code - one of AppErrorCode
 * @param message - human-readable explanation
 * @param details - optional structured context
 * @returns a fully populated AppError
 */
export function AppErr(code: AppErrorCode, message: string, details?: unknown): AppError {
  return { code, message, details };
}

/**
 * Non-throwing JSON parser. Returns null on any parse error.
 * @param text - candidate JSON
 * @returns parsed value, or null when text is not valid JSON
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Standard pagination envelope used by list endpoints.
 * @template T - row type
 */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
};

/**
 * Maps NestJS HttpException subclasses to AppErrorCode by constructor name.
 * WHY: when business code throws `BadRequestException` inside a `safeCall`,
 * we want the resulting Result to carry BAD_REQUEST (→ 400), not INTERNAL
 * (→ 500). Matching by name rather than `instanceof` keeps this file free
 * of @nestjs/common imports (otherwise it would couple result.ts to Nest).
 * @param err - the thrown value
 * @returns mapped AppErrorCode, or null if the throw is not a NestJS HttpException
 */
function mapHttpExceptionToCode(err: unknown): AppErrorCode | null {
  if (!err || typeof err !== 'object') return null;
  const name = (err as { constructor?: { name?: string } }).constructor?.name;
  switch (name) {
    case 'BadRequestException':       return 'BAD_REQUEST';
    case 'NotFoundException':         return 'NOT_FOUND';
    case 'ConflictException':         return 'CONFLICT';
    case 'UnauthorizedException':     return 'UNAUTHORIZED';
    case 'ForbiddenException':        return 'FORBIDDEN';
    case 'UnprocessableEntityException': return 'BUSINESS_RULE_VIOLATION';
    default: return null;
  }
}

/**
 * Wraps an async function so any throw becomes a `Result.err(...)`.
 * Preserves NestJS HttpException status by mapping the constructor name.
 *
 * Use this as the outermost wrapper inside service methods so the function
 * signature can stay `Promise<Result<T>>` even when calling third-party code
 * that throws.
 *
 * @param fn - the async work to attempt
 * @param code - fallback error code when the throw isn't a NestJS HttpException
 * @returns Ok(value) on success, Err({code, message}) on throw
 * @throws never — every error path returns a Result
 */
export async function safeCall<T>(
  fn: () => Promise<T>,
  code: AppErrorCode = 'EXTERNAL_SERVICE',
): Promise<Result<T>> {
  try {
    return Ok(await fn());
  } catch (err) {
    const message = err instanceof Error ? (err as Error).message : String(err);
    // WHY: preserve NestJS HttpException semantics (400 stays 400, etc.)
    const httpCode = mapHttpExceptionToCode(err);
    return Err({ code: httpCode ?? code, message });
  }
}
