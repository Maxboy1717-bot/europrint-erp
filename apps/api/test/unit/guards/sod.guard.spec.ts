/**
 * test/unit/guards/sod.guard.spec.ts
 *
 * Unit tests for SodGuard (Separation of Duties). Verifies that conflicting
 * permission pairs are blocked on the regulated endpoints and that benign
 * single-permission users (allowed combinations) pass through.
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SodGuard } from '../../../src/common/guards/sod.guard';

interface SodUser {
  id: number;
  permissions: string[];
}

function makeContext(
  user: SodUser | undefined,
  method: string,
  url: string,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, method, url, path: url }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('SodGuard', () => {
  const guard = new SodGuard();

  it('throws ForbiddenException when user can both create and approve purchase orders', () => {
    const ctx = makeContext(
      { id: 1, permissions: ['po:create', 'po:approve'] },
      'POST',
      '/api/purchase-order',
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user can both create invoices and approve payments', () => {
    const ctx = makeContext(
      { id: 2, permissions: ['invoice:create', 'payment:approve'] },
      'POST',
      '/api/invoice',
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user can both calculate and approve payroll', () => {
    const ctx = makeContext(
      { id: 3, permissions: ['payroll:calculate', 'payroll:approve'] },
      'POST',
      '/api/payroll/calculate',
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('returns true when user holds only purchase-order create permission (allowed)', () => {
    const ctx = makeContext(
      { id: 4, permissions: ['po:create'] },
      'POST',
      '/api/purchase-order',
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when path is unrelated to any SoD rule', () => {
    const ctx = makeContext(
      { id: 5, permissions: ['po:create', 'po:approve'] },
      'GET',
      '/api/dashboard/summary',
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when request has no authenticated user', () => {
    const ctx = makeContext(undefined, 'POST', '/api/purchase-order');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException for conflicting CRM rfm + churn permissions', () => {
    const ctx = makeContext(
      { id: 6, permissions: ['crm.rfm:CLUSTER', 'crm.churn:RETRAIN'] },
      'POST',
      '/api/crm/rfm/cluster',
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
