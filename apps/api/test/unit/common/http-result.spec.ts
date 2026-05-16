/**
 * test/unit/common/http-result.spec.ts
 *
 * Unit tests for http-result helpers: unwrapOrThrow, unwrapOrInternal,
 * unwrapOrBadRequest, unwrapOrNotFound, unwrapOrNotFoundDefined,
 * unwrapOrDefault. Validates the AppErrorCode → HttpException mapping.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Ok, Err, AppErr, Result } from '../../../src/common/result';
import {
  unwrapOrThrow,
  unwrapOrInternal,
  unwrapOrBadRequest,
  unwrapOrNotFound,
  unwrapOrNotFoundDefined,
  unwrapOrDefault,
} from '../../../src/common/http-result';

describe('http-result helpers', () => {
  it('returns success payload when unwrapOrThrow receives Ok', () => {
    const r: Result<number> = Ok(123);
    expect(unwrapOrThrow(r)).toBe(123);
  });

  it('throws NotFoundException when unwrapOrThrow receives Err with NOT_FOUND code', () => {
    const r = Err(AppErr('NOT_FOUND', 'missing')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(NotFoundException);
  });

  it('throws ConflictException when unwrapOrThrow receives Err with CONFLICT code', () => {
    const r = Err(AppErr('CONFLICT', 'duplicate')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(ConflictException);
  });

  it('throws BadRequestException when unwrapOrThrow receives Err with VALIDATION code', () => {
    const r = Err(AppErr('VALIDATION', 'bad')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(BadRequestException);
  });

  it('throws ForbiddenException when unwrapOrThrow receives Err with FORBIDDEN code', () => {
    const r = Err(AppErr('FORBIDDEN', 'no rights')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException when unwrapOrThrow receives Err with UNAUTHORIZED code', () => {
    const r = Err(AppErr('UNAUTHORIZED', 'login')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(UnauthorizedException);
  });

  it('throws UnprocessableEntityException when unwrapOrThrow receives BUSINESS_RULE_VIOLATION', () => {
    const r = Err(AppErr('BUSINESS_RULE_VIOLATION', 'rule')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(UnprocessableEntityException);
  });

  it('throws HttpException with 402 status when unwrapOrThrow receives PAYMENT_REQUIRED', () => {
    const r = Err(AppErr('PAYMENT_REQUIRED', 'pay first')) as Result<number>;
    try {
      unwrapOrThrow(r);
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    }
  });

  it('throws InternalServerErrorException when unwrapOrThrow receives an unknown code', () => {
    const r = Err(AppErr('DB_ERROR', 'db blew')) as Result<number>;
    expect(() => unwrapOrThrow(r)).toThrow(InternalServerErrorException);
  });

  it('returns success payload when unwrapOrInternal receives a Result Ok', () => {
    const r: Result<string> = Ok('hello');
    expect(unwrapOrInternal(r)).toBe('hello');
  });

  it('returns plain value when unwrapOrInternal receives a non-Result shape', () => {
    expect(unwrapOrInternal<number>(42)).toBe(42);
    expect(unwrapOrInternal<string>('plain')).toBe('plain');
  });

  it('throws NotFoundException when unwrapOrInternal receives NOT_FOUND Err', () => {
    const r = Err(AppErr('NOT_FOUND', 'no row')) as Result<number>;
    expect(() => unwrapOrInternal(r)).toThrow(NotFoundException);
  });

  it('throws InternalServerErrorException when unwrapOrInternal receives an unmapped code', () => {
    const r = Err(AppErr('DB_ERROR', 'oops')) as Result<number>;
    expect(() => unwrapOrInternal(r)).toThrow(InternalServerErrorException);
  });

  it('throws BadRequestException when unwrapOrBadRequest receives any Err', () => {
    const r = Err(AppErr('NOT_FOUND', 'irrelevant')) as Result<number>;
    expect(() => unwrapOrBadRequest(r)).toThrow(BadRequestException);
  });

  it('returns payload when unwrapOrNotFound receives Ok', () => {
    const r: Result<string> = Ok('found');
    expect(unwrapOrNotFound(r)).toBe('found');
  });

  it('throws NotFoundException when unwrapOrNotFound receives any Err', () => {
    const r = Err(AppErr('VALIDATION', 'bad')) as Result<number>;
    expect(() => unwrapOrNotFound(r)).toThrow(NotFoundException);
  });

  it('throws NotFoundException when unwrapOrNotFoundDefined receives Ok with null data', () => {
    const r: Result<{ id: number } | null> = Ok(null);
    expect(() => unwrapOrNotFoundDefined(r)).toThrow(NotFoundException);
  });

  it('returns data when unwrapOrNotFoundDefined receives Ok with defined data', () => {
    const r: Result<{ id: number } | null> = Ok({ id: 5 });
    expect(unwrapOrNotFoundDefined(r)).toEqual({ id: 5 });
  });

  it('returns fallback when unwrapOrDefault receives an Err', () => {
    const r: Result<number> = Err(AppErr('DB_ERROR', 'x')) as Result<number>;
    expect(unwrapOrDefault(r, -1)).toBe(-1);
  });

  it('returns data when unwrapOrDefault receives Ok', () => {
    const r: Result<number> = Ok(7);
    expect(unwrapOrDefault(r, -1)).toBe(7);
  });
});
