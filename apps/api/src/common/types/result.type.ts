export type { Result, AppError, AppErrorCode, PaginatedResult } from '../result';
export { Ok, Err, isOk, isErr, AppErr, safeCall, safeJsonParse } from '../result';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: number;
};
