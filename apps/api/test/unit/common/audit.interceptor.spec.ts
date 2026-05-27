/**
 * test/unit/common/audit.interceptor.spec.ts
 *
 * Unit tests for AuditInterceptor. Verifies that audit rows are written for
 * mutating requests, that user identity is captured, that errors still trigger
 * an audit row (with result=error) and that GET requests skip the write.
 */

// Must be before any module imports that transitively load @workspace/db.
// schema-rbac.ts re-exports positionFeatureFlags from @workspace/db, which
// requires DATABASE_URL at load time. Mocking it here prevents that side-effect.
jest.mock('@workspace/db', () => ({
  positionFeatureFlags: {},
  posMaterialRequests: {},
  posMaterialRequestLines: {},
  db: {},
}));

const insertValues = jest.fn().mockResolvedValue(undefined);
const insertMock = jest.fn(() => ({ values: insertValues }));

jest.mock('@shared/db', () => ({
  db: { insert: insertMock },
}));

import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuditInterceptor } from '../../../src/common/interceptors/audit.interceptor';

interface AuditRow {
  userId?: string;
  userRole?: string;
  action: string;
  tableName: string;
  recordId: string;
  reason: string;
}

interface AuditUser {
  id?: number | string;
  role?: string;
  fullName?: string;
}

class FakeController {}

function makeContext(opts: {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  user?: AuditUser;
}): ExecutionContext {
  const request = {
    method: opts.method,
    path: opts.path,
    url: opts.path,
    body: opts.body ?? {},
    headers: { 'user-agent': 'jest', 'x-forwarded-for': '10.0.0.1' },
    ip: '10.0.0.1',
    user: opts.user,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getClass: () => FakeController,
    getHandler: () => ({}),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown, fail = false): CallHandler {
  return {
    handle: () =>
      fail ? throwError(() => new Error('boom')) : of(value),
  };
}

const reflector = new Reflector();

describe('AuditInterceptor', () => {
  beforeEach(() => {
    insertMock.mockClear();
    insertValues.mockClear();
  });

  it('writes an audit row when a POST request succeeds', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'POST',
      path: '/api/items',
      body: { name: 'Widget' },
      user: { id: 7, role: 'manager', fullName: 'Alice' },
    });
    await firstValueFrom(interceptor.intercept(ctx, makeHandler({ id: 100 })));
    await Promise.resolve();
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertValues.mock.calls[0][0] as AuditRow;
    expect(row.action).toBe('CREATE');
    expect(row.recordId).toBe('100');
  });

  it('captures the authenticated user id and role on the audit row', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'PUT',
      path: '/api/items/9',
      body: { name: 'Updated' },
      user: { id: 42, role: 'director', fullName: 'Bob' },
    });
    await firstValueFrom(interceptor.intercept(ctx, makeHandler({ id: 9 })));
    await Promise.resolve();
    const row = insertValues.mock.calls[0][0] as AuditRow;
    expect(row.userId).toBe('42');
    expect(row.userRole).toBe('director');
    expect(row.action).toBe('UPDATE');
  });

  it('still writes an audit row when the handler throws', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'DELETE',
      path: '/api/items/5',
      body: { id: 5 },
      user: { id: 1, role: 'admin' },
    });
    await expect(
      firstValueFrom(interceptor.intercept(ctx, makeHandler(undefined, true))),
    ).rejects.toThrow('boom');
    await Promise.resolve();
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertValues.mock.calls[0][0] as AuditRow;
    expect(row.reason).toContain('error');
  });

  it('skips audit write for GET requests', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'GET',
      path: '/api/items',
      user: { id: 1 },
    });
    await firstValueFrom(interceptor.intercept(ctx, makeHandler([{ id: 1 }])));
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('does not break the pipeline when DB insert fails (best-effort)', async () => {
    insertValues.mockRejectedValueOnce(new Error('audit table missing'));
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'POST',
      path: '/api/items',
      body: { name: 'x' },
      user: { id: 2 },
    });
    const result = await firstValueFrom(
      interceptor.intercept(ctx, makeHandler({ id: 1 })),
    );
    expect(result).toEqual({ id: 1 });
  });

  it('records DELETE action when DELETE method is used', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'DELETE',
      path: '/api/items/3',
      body: { id: 3 },
      user: { id: 1, role: 'admin' },
    });
    await firstValueFrom(interceptor.intercept(ctx, makeHandler({ id: 3 })));
    await Promise.resolve();
    const row = insertValues.mock.calls[0][0] as AuditRow;
    expect(row.action).toBe('DELETE');
  });

  it('writes anonymous audit row when request has no user', async () => {
    const interceptor = new AuditInterceptor(reflector);
    const ctx = makeContext({
      method: 'POST',
      path: '/api/items',
      body: { name: 'anon' },
    });
    await firstValueFrom(interceptor.intercept(ctx, makeHandler({ id: 1 })));
    await Promise.resolve();
    const row = insertValues.mock.calls[0][0] as AuditRow;
    expect(row.userId).toBeUndefined();
    expect(row.action).toBe('CREATE');
  });
});
