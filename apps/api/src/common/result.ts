export type AppErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'INTERNAL'
  | 'BAD_REQUEST'
  | 'EXTERNAL_SERVICE'
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
  | 'GET_REQUESTS_ERROR';

export interface AppError {
  message: string;
  code: AppErrorCode;
  details?: unknown;
}

export type Result<T, E = AppError> =
  | { ok: true; data: T; error?: E }
  | { ok: false; error: E; data?: T };

export function Ok<T = void>(data?: T): Result<T> {
  return { ok: true, data: data as T };
}

export function Err<T = never>(error: string | AppError): Result<T, AppError> {
  const appError: AppError =
    typeof error === 'string' ? { code: 'INTERNAL', message: error } : error;
  return { ok: false, error: appError };
}

export function isOk<T, E>(r: Result<T, E>): r is { ok: true; data: T } {
  return r.ok === true;
}

export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return r.ok === false;
}

export function AppErr(code: AppErrorCode, message: string, details?: unknown): AppError {
  return { code, message, details };
}

export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
};

/**
 * NestJS HttpException turlarini AppErrorCode'ga map qiladi.
 * Shu sababli `safeCall` ichida throw qilingan `BadRequestException`/`NotFoundException`
 * va h.k. — to'g'ri HTTP status (400, 404) bilan qaytariladi (500 emas).
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

export async function safeCall<T>(
  fn: () => Promise<T>,
  code: AppErrorCode = 'EXTERNAL_SERVICE',
): Promise<Result<T>> {
  try {
    return Ok(await fn());
  } catch (err) {
    const message = err instanceof Error ? (err as Error).message : String(err);
    // NestJS HttpException turlarini saqlash (BadRequest → 400, NotFound → 404, ...)
    const httpCode = mapHttpExceptionToCode(err);
    return Err({ code: httpCode ?? code, message });
  }
}
