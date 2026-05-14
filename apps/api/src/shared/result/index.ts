/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export type Result<T> = Success<T> | Failure;

class Success<T> {
  constructor(readonly value: T) {}
  isOk(): this is Success<T> {
    return true;
  }
  isErr(): this is Failure {
    return false;
  }
}

class Failure {
  constructor(readonly error: string) {}
  isOk(): boolean {
    return false;
  }
  isErr(): this is Failure {
    return true;
  }
}

export const Ok = <T>(value: T): Result<T> => new Success(value);
export const Err = (error: string): Result<never> => new Failure(error);
