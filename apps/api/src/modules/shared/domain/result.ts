import { InternalServerErrorException } from '@nestjs/common';
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string,
  ) {}

  static ok<T>(value?: T): Result<T> { return new Result<T>(true, value); }
  static fail<T>(error: string): Result<T> { return new Result<T>(false, undefined, error); }

  getValue(): T {
    if (!this.isSuccess) throw new InternalServerErrorException(this._error);
    return this._value as T;
  }

  getError(): string { return this._error || ''; }
  getErrorValue(): string { return this._error || ''; }

  get value(): T { return this._value as T; }
  get error(): string { return this._error || ''; }
  get isFailure(): boolean { return !this.isSuccess; }

  get ok(): boolean { return this.isSuccess; }
  get data(): T { return this._value as T; }

  toJSON(): object {
    return this.isSuccess
      ? { ok: true, data: this._value }
      : { ok: false, error: this._error };
  }
}

export type ResultType<T> = Result<T>;
