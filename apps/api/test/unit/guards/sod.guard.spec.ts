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

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('translated') };
}

describe('SodGuard', () => {
  const guard = new SodGuard(makeI18n() as never);

  it('throws ForbiddenException when user can both create and approve purchase orders', async () => {
    const ctx = makeContext(
      { id: 1, permissions: ['po:create', 'po:approve'] },
      'POST',
      '/api/purchase-order',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user can both create invoices and approve payments', async () => {
    const ctx = makeContext(
      { id: 2, permissions: ['invoice:create', 'payment:approve'] },
      'POST',
      '/api/invoice',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user can both calculate and approve payroll', async () => {
    const ctx = makeContext(
      { id: 3, permissions: ['payroll:calculate', 'payroll:approve'] },
      'POST',
      '/api/payroll/calculate',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('returns true when user holds only purchase-order create permission (allowed)', async () => {
    const ctx = makeContext(
      { id: 4, permissions: ['po:create'] },
      'POST',
      '/api/purchase-order',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when path is unrelated to any SoD rule', async () => {
    const ctx = makeContext(
      { id: 5, permissions: ['po:create', 'po:approve'] },
      'GET',
      '/api/dashboard/summary',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when request has no authenticated user', async () => {
    const ctx = makeContext(undefined, 'POST', '/api/purchase-order');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException for conflicting CRM rfm + churn permissions', async () => {
    const ctx = makeContext(
      { id: 6, permissions: ['crm.rfm:CLUSTER', 'crm.churn:RETRAIN'] },
      'POST',
      '/api/crm/rfm/cluster',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
