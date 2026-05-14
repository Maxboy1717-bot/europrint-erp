/**
 * @module result.util
 * @description Source module. See exports for details.
 */

import { Err } from '@common/result';
import { Result, Ok, AppErr, AppErrorCode } from '../result';
export class ResultUtil {
  static ok<T>(data: T): Result<T> {
    return Ok(data);
  }
  static error<T>(error: string, code?: string): Result<T> {
    return Err(AppErr((code as AppErrorCode) ?? 'INTERNAL', error));
  }
  static isOk<T>(result: Result<T>): result is { ok: true; data: T } {
    return result.ok === true;
  }
  static isError<T>(
    result: Result<T>,
  ): result is { ok: false; error: import('../result').AppError } {
    return result.ok === false;
  }
}