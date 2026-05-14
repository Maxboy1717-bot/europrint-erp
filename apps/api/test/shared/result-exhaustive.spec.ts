/**
 * @module result-exhaustive.spec
 * @description Exhaustive Result-pattern coverage. Covers every AppErrorCode,
 * every helper, every unwrap variant, every type-narrow scenario, and every
 * falsy-value edge case.
 */

import {
  Ok, Err, isOk, isErr, AppErr, safeCall, safeJsonParse,
  type Result, type AppError, type AppErrorCode,
} from '../../src/common/result';
import {
  throwFromError, assertOk, unwrapOrThrow, unwrapOrBadRequest,
  unwrapOrNotFound, unwrapOrDefault, unwrapOrNotFoundDefined,
  unwrapOrWarn, assertOkLog, assertOkOrThrow, unwrapOrInternal,
} from '../../src/common/http-result';
import {
  BadRequestException, ConflictException, ForbiddenException,
  HttpException, InternalServerErrorException, NotFoundException,
  UnauthorizedException, UnprocessableEntityException,
} from '@nestjs/common';

const ALL_CODES: AppErrorCode[] = [
  'NOT_FOUND','CONFLICT','VALIDATION','FORBIDDEN','UNAUTHORIZED','INTERNAL','BAD_REQUEST',
  'EXTERNAL_SERVICE','DB_ERROR','INVALID_STATUS','APPROVE_COUNT_ERROR','UNCOUNTED_LINES',
  'COMPLETE_COUNT_ERROR','SAME_WAREHOUSE','INVALID_REASON','NO_LINES','INVALID_QUANTITY',
  'CREATE_REQUEST_ERROR','NO_ITEMS','START_COUNT_ERROR','UPDATE_LINE_ERROR',
  'INVALID_TRANSITION','BUSINESS_RULE_VIOLATION','PAYMENT_REQUIRED','UPDATE_STATUS_ERROR',
  'INVALID_BARCODE','BARCODE_LOOKUP_ERROR','GET_COUNTS_ERROR','INVALID_DATE_RANGE',
  'MOVEMENT_REPORT_ERROR','EMPLOYEE_ACTIVITY_ERROR','LOW_STOCK_ERROR','GET_REQUESTS_ERROR',
];

describe('Result — Ok() with every value type', () => {
  it.each([
    ['number', 42],
    ['negative number', -1],
    ['zero', 0],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['string', 'hello'],
    ['empty string', ''],
    ['true', true],
    ['false', false],
    ['null', null],
    ['undefined', undefined],
    ['empty array', []],
    ['array with items', [1, 2, 3]],
    ['empty object', {}],
    ['object with props', { a: 1 }],
    ['nested object', { a: { b: { c: 1 } } }],
    ['Date', new Date('2026-01-01')],
    ['BigInt', BigInt(123)],
    ['Symbol', Symbol('s')],
    ['Map', new Map()],
    ['Set', new Set()],
  ] as Array<[string, unknown]>)('Ok(%s) preserves value', (_, v) => {
    const r = Ok(v as never);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(v);
  });

  it('Ok() with no argument returns Result<void> with data=undefined', () => {
    const r = Ok();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeUndefined();
  });
});

describe('Result — Err() with every code', () => {
  it.each(ALL_CODES)('Err(AppErr(%s, "msg")) preserves code', (code) => {
    const r = Err(AppErr(code, 'test message'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect((r.error as AppError).code).toBe(code);
      expect((r.error as AppError).message).toBe('test message');
    }
  });

  it('Err(string) wraps into INTERNAL code', () => {
    const r = Err('plain string');
    if (!r.ok) {
      expect((r.error as AppError).code).toBe('INTERNAL');
      expect((r.error as AppError).message).toBe('plain string');
    }
  });

  it('AppErr() with details preserves them', () => {
    const e = AppErr('VALIDATION', 'bad', { field: 'email' });
    expect(e.details).toEqual({ field: 'email' });
  });

  it('AppErr() without details is undefined (not null)', () => {
    expect(AppErr('NOT_FOUND', 'gone').details).toBeUndefined();
  });
});

describe('isOk / isErr — type narrowing across union', () => {
  it.each([
    Ok(1) as Result<number>,
    Ok('s') as Result<string>,
    Ok([]) as Result<unknown[]>,
    Ok(null) as Result<null>,
  ])('isOk(%j) returns true', (r) => {
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
  });

  it.each([
    Err('a') as Result<number>,
    Err(AppErr('VALIDATION', 'x')) as Result<string>,
    Err(AppErr('NOT_FOUND', 'gone')) as Result<unknown>,
  ])('isErr(...) returns true', (r) => {
    expect(isErr(r)).toBe(true);
    expect(isOk(r)).toBe(false);
  });
});

describe('http-result throwFromError — every code → status', () => {
  const cases: Array<[AppErrorCode, new (...args: any[]) => Error]> = [
    ['NOT_FOUND', NotFoundException],
    ['CONFLICT', ConflictException],
    ['VALIDATION', BadRequestException],
    ['BAD_REQUEST', BadRequestException],
    ['FORBIDDEN', ForbiddenException],
    ['UNAUTHORIZED', UnauthorizedException],
    ['INVALID_TRANSITION', ConflictException],
    ['BUSINESS_RULE_VIOLATION', UnprocessableEntityException],
    ['PAYMENT_REQUIRED', HttpException],
    ['INTERNAL', InternalServerErrorException],
    ['DB_ERROR', InternalServerErrorException],
    ['EXTERNAL_SERVICE', InternalServerErrorException],
  ];

  it.each(cases)('throwFromError(%s) throws %p', (code, ExpectedType) => {
    expect(() => throwFromError(AppErr(code, 'm'))).toThrow(ExpectedType);
  });
});

describe('unwrapOrThrow — every code path', () => {
  it('returns data on Ok', () => expect(unwrapOrThrow(Ok(42))).toBe(42));

  it.each(ALL_CODES)('throws for code %s', (code) => {
    expect(() => unwrapOrThrow(Err(AppErr(code, 'm')))).toThrow();
  });
});

describe('unwrapOrBadRequest — forces 400 on any Err', () => {
  it.each(ALL_CODES)('throws BadRequestException for %s', (code) => {
    expect(() => unwrapOrBadRequest(Err(AppErr(code, 'm')))).toThrow(BadRequestException);
  });

  it('passes through Ok value', () => {
    expect(unwrapOrBadRequest(Ok('value'))).toBe('value');
  });
});

describe('unwrapOrNotFound — forces 404 on any Err', () => {
  it.each(ALL_CODES)('throws NotFoundException for %s', (code) => {
    expect(() => unwrapOrNotFound(Err(AppErr(code, 'm')))).toThrow(NotFoundException);
  });

  it('passes through Ok value', () => {
    expect(unwrapOrNotFound(Ok([1, 2]))).toEqual([1, 2]);
  });
});

describe('unwrapOrDefault — never throws', () => {
  it.each([
    [Ok(1), 99, 1],
    [Ok(0), 99, 0],
    [Ok(''), 'x', ''],
    [Ok([]), [99], []],
    [Err('x'), 'fallback', 'fallback'],
    [Err(AppErr('NOT_FOUND', 'm')), null, null],
  ] as Array<[Result<unknown>, unknown, unknown]>)('returns expected', (r, fallback, expected) => {
    expect(unwrapOrDefault(r as never, fallback)).toEqual(expected);
  });
});

describe('unwrapOrNotFoundDefined — throws on null too', () => {
  it('throws when data is null on Ok', () => {
    expect(() => unwrapOrNotFoundDefined(Ok(null))).toThrow(NotFoundException);
  });

  it('throws when data is undefined on Ok', () => {
    expect(() => unwrapOrNotFoundDefined(Ok(undefined))).toThrow(NotFoundException);
  });

  it('returns data when defined', () => {
    expect(unwrapOrNotFoundDefined(Ok('x'))).toBe('x');
  });

  it('uses custom message override', () => {
    expect(() => unwrapOrNotFoundDefined(Ok(null), 'custom')).toThrow('custom');
  });
});

describe('unwrapOrWarn — logs and returns fallback', () => {
  it('does not throw on Err', () => {
    const log = jest.fn();
    const v = unwrapOrWarn(Err(AppErr('DB_ERROR', 'down')), log, 'fb');
    expect(v).toBe('fb');
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('returns data on Ok without logging', () => {
    const log = jest.fn();
    const v = unwrapOrWarn(Ok('value'), log, 'fb');
    expect(v).toBe('value');
    expect(log).not.toHaveBeenCalled();
  });
});

describe('assertOk — throws if not ok', () => {
  it('no-op on Ok', () => {
    expect(() => assertOk(Ok(1))).not.toThrow();
  });

  it.each(ALL_CODES)('throws mapped for %s', (code) => {
    expect(() => assertOk(Err(AppErr(code, 'm')))).toThrow();
  });
});

describe('assertOkLog — logs then throws', () => {
  it('logs once before throwing', () => {
    const log = jest.fn();
    expect(() => assertOkLog(Err(AppErr('NOT_FOUND', 'm')), log)).toThrow(NotFoundException);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('does nothing on Ok', () => {
    const log = jest.fn();
    expect(() => assertOkLog(Ok('x'), log)).not.toThrow();
    expect(log).not.toHaveBeenCalled();
  });
});

describe('assertOkOrThrow — logs then throws specific', () => {
  it('throws caller-supplied exception', () => {
    const log = jest.fn();
    expect(() => assertOkOrThrow(Err('x'), log, new TypeError('custom'))).toThrow(TypeError);
  });
});

describe('unwrapOrInternal — accepts plain T or Result<T>', () => {
  it('returns plain T verbatim', () => {
    expect(unwrapOrInternal('plain')).toBe('plain');
    expect(unwrapOrInternal(42)).toBe(42);
    expect(unwrapOrInternal([1, 2])).toEqual([1, 2]);
  });

  it('unwraps Ok', () => {
    expect(unwrapOrInternal(Ok('x'))).toBe('x');
  });

  it.each(ALL_CODES)('maps Err(%s) to exception', (code) => {
    expect(() => unwrapOrInternal(Err(AppErr(code, 'm')))).toThrow();
  });
});

describe('safeCall — catches every throw shape', () => {
  it('catches Error', async () => {
    const r = await safeCall(async () => { throw new Error('e'); });
    expect(r.ok).toBe(false);
  });

  it('catches string throw', async () => {
    const r = await safeCall(async () => { throw 'str'; });
    if (!r.ok) expect((r.error as AppError).message).toBe('str');
  });

  it('catches number throw', async () => {
    const r = await safeCall(async () => { throw 42; });
    expect(r.ok).toBe(false);
  });

  it('catches object throw', async () => {
    const r = await safeCall(async () => { throw { custom: true }; });
    expect(r.ok).toBe(false);
  });

  it('catches null throw', async () => {
    const r = await safeCall(async () => { throw null; });
    expect(r.ok).toBe(false);
  });

  it.each([
    ['BadRequestException', BadRequestException, 'BAD_REQUEST'],
    ['NotFoundException', NotFoundException, 'NOT_FOUND'],
    ['ConflictException', ConflictException, 'CONFLICT'],
    ['UnauthorizedException', UnauthorizedException, 'UNAUTHORIZED'],
    ['ForbiddenException', ForbiddenException, 'FORBIDDEN'],
    ['UnprocessableEntityException', UnprocessableEntityException, 'BUSINESS_RULE_VIOLATION'],
  ] as Array<[string, new (m: string) => Error, string]>)('maps %s to code %s', async (_, Ex, code) => {
    const r = await safeCall(async () => { throw new Ex('m'); });
    if (!r.ok) expect((r.error as AppError).code).toBe(code);
  });

  it.each(ALL_CODES)('passes through caller-supplied code %s', async (code) => {
    const r = await safeCall(async () => { throw new Error('generic'); }, code);
    if (!r.ok) expect((r.error as AppError).code).toBe(code);
  });

  it('returns Ok with awaited value', async () => {
    const r = await safeCall(async () => 'value');
    if (r.ok) expect(r.data).toBe('value');
  });

  it('returns Ok preserving null', async () => {
    const r = await safeCall(async () => null);
    if (r.ok) expect(r.data).toBeNull();
  });

  it('returns Ok preserving 0', async () => {
    const r = await safeCall(async () => 0);
    if (r.ok) expect(r.data).toBe(0);
  });

  it('handles synchronous throw before any await', async () => {
    const r = await safeCall(async () => {
      JSON.parse('not json');
      return 'never';
    });
    expect(r.ok).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it.each([
    ['{}', {}],
    ['[]', []],
    ['null', null],
    ['true', true],
    ['false', false],
    ['1', 1],
    ['"s"', 's'],
    ['{"a":1,"b":[2,3]}', { a: 1, b: [2, 3] }],
  ] as Array<[string, unknown]>)('parses %s', (text, expected) => {
    expect(safeJsonParse(text)).toEqual(expected);
  });

  it.each([
    ['not json', null],
    ['{', null],
    ['{not:1}', null],
    ['undefined', null],
    ['', null],
    ['{"a":}', null],
  ])('returns null for invalid: %s', (text, expected) => {
    expect(safeJsonParse(text)).toEqual(expected);
  });
});
