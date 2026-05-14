/**
 * @module result
 * @description Source module. See exports for details.
 */

import { InternalServerErrorException } from '@nestjs/common';
export class Result<T = void> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly value?: T;
  public readonly error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.value = value;
    this.error = error;
  }

  static ok<U = void>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  static fail<U = void>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }

  static combine(results: Result[]): Result {
    const failed = (Array.isArray(results) ? results : []).find((result) => !result.isSuccess);
    if (failed) {
      return Result.fail(String(failed.error ?? 'Unknown error'));
    }
    return Result.ok();
  }

  getErrorValue(): string {
    return this.error || 'Unknown error';
  }

  getValue(): T {
    if (!this.value) {
      throw new InternalServerErrorException('Cannot get value from a failed result');
    }
    return this.value;
  }
}
