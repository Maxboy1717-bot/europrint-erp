/**
 * @module result.type
 * @description Source module. See exports for details.
 */

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function Ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function Err<T>(error: string): Result<T> {
  return { ok: false, error };
}
