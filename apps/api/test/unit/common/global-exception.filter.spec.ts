/**
 * test/unit/common/global-exception.filter.spec.ts
 *
 * Unit tests for GlobalExceptionFilter. Verifies HttpException → status,
 * ZodError → 422, unknown errors → 500 (or 503 via stats fallback for GET),
 * and the stats-endpoint graceful-OK fallback.
 */

import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ZodError, ZodIssue } from 'zod';
import { GlobalExceptionFilter } from '../../../src/common/filters/global-exception.filter';

interface ReplyCapture {
  statusCode?: number;
  body?: unknown;
}

function makeHost(method: string, url: string): {
  host: ArgumentsHost;
  reply: ReplyCapture;
} {
  const reply: ReplyCapture = {};
  const replyMock = {
    status: jest.fn((code: number) => {
      reply.statusCode = code;
      return replyMock;
    }),
    send: jest.fn((body: unknown) => {
      reply.body = body;
      return replyMock;
    }),
  };
  const request = { method, url, path: url };
  const host = {
    switchToHttp: () => ({
      getResponse: () => replyMock,
      getRequest: () => request,
    }),
    // I18nContext.current(host) calls host.getType() internally; real Nest
    // ArgumentsHost always implements this, so the mock must too.
    getType: () => 'http',
  } as unknown as ArgumentsHost;
  return { host, reply };
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('maps HttpException to its declared HTTP status', () => {
    const { host, reply } = makeHost('POST', '/api/items');
    filter.catch(new NotFoundException('Item topilmadi'), host);
    expect(reply.statusCode).toBe(HttpStatus.NOT_FOUND);
    const body = reply.body as { code: string; error: string };
    expect(body.code).toBe('NOT_FOUND');
    expect(body.error).toBe('Item topilmadi');
  });

  it('maps ZodError to HTTP 422 with VALIDATION_ERROR code', () => {
    const issues: ZodIssue[] = [
      { code: 'custom', path: ['name'], message: 'Required' } as ZodIssue,
    ];
    const { host, reply } = makeHost('POST', '/api/items');
    filter.catch(new ZodError(issues), host);
    expect(reply.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const body = reply.body as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('maps unknown errors to HTTP 500 on non-GET requests', () => {
    const { host, reply } = makeHost('POST', '/api/items');
    filter.catch(new Error('boom'), host);
    expect(reply.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = reply.body as { code: string; error: string };
    expect(body.code).toBe('INTERNAL_ERROR'); // source uses 'INTERNAL_ERROR' for unknown errors
    expect(body.error).toBe('boom');
  });

  it('returns 200 with empty body for 5xx on stats-like GET endpoints', () => {
    const { host, reply } = makeHost('GET', '/api/dashboard/summary');
    filter.catch(new Error('db unreachable'), host);
    expect(reply.statusCode).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({});
  });

  it('returns 503 for 5xx on non-stats GET endpoints', () => {
    const { host, reply } = makeHost('GET', '/api/orders');
    filter.catch(new Error('db unreachable'), host);
    expect(reply.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    const body = reply.body as { code: string };
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('maps 4xx HttpException on GET without stats-fallback masking', () => {
    const { host, reply } = makeHost('GET', '/api/orders/42');
    filter.catch(new ForbiddenException('Ruxsat yoq'), host);
    expect(reply.statusCode).toBe(HttpStatus.FORBIDDEN);
    const body = reply.body as { code: string };
    expect(body.code).toBe('FORBIDDEN');
  });

  it('preserves BAD_REQUEST status from HttpException on POST', () => {
    const { host, reply } = makeHost('POST', '/api/orders');
    filter.catch(new BadRequestException('Invalid'), host);
    expect(reply.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const body = reply.body as { code: string };
    expect(body.code).toBe('BAD_REQUEST');
  });
});
