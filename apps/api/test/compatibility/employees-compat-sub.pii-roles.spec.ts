/**
 * test/compatibility/employees-compat-sub.pii-roles.spec.ts
 *
 * VISION-3340 #55: `EmployeesCompatSubController`'s PII sub-endpoints (passport, bank
 * accounts, salary history) were previously gated ONLY by the class-level `@Roles(...HR_ROLES)`,
 * which includes plain 'MANAGER' — wider than the FE's `RoleGate` component
 * (`artifacts/erp-dashboard/src/components/RoleGate.tsx`, `PII_VIEWER_ROLES`), which masks
 * salary/passport/bank data client-side for anyone who isn't super_admin/director/hr_manager/
 * hr_specialist/hr. Any plain MANAGER could bypass the FE mask entirely via a direct API call.
 *
 * Fix: added a narrower method-level `@Roles(...PII_ROLES)` directly above each of the 6
 * PII-sensitive handlers (getPassport, createPassport, getBankAccounts, createBankAccount,
 * getSalaryHistory, createSalaryHistory), mirroring the FE's `PII_VIEWER_ROLES` list exactly.
 *
 * `RolesGuard` resolves required roles via `reflector.getAllAndOverride('roles', [handler,
 * class])` — the method-level decorator wins when present (see roles.guard.ts doc + the
 * pre-existing precedent test `test/org-structure/org-structure.controller.roles.spec.ts`).
 * This suite exercises the REAL `RolesGuard` + REAL `Reflector` against the REAL controller
 * class (no HTTP bootstrap, no service mocks needed since we only reach the guard, not the
 * handler body), proving:
 *   1. A plain MANAGER role is now forbidden (403) on all 6 PII endpoints.
 *   2. HR_MANAGER (and the rest of the FE's PII_VIEWER_ROLES set) still gets through (200-path,
 *      i.e. canActivate resolves `true`).
 *   3. A non-PII method on the same controller (e.g. getAssets) is UNCHANGED — plain MANAGER
 *      still passes there via the class-level HR_ROLES fallback, proving the narrowing is
 *      scoped to only the 6 target methods.
 */

import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { EmployeesCompatSubController } from '../../src/modules/compatibility/employees-compat-sub.controller';

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

function makeContext(methodName: keyof EmployeesCompatSubController, role: string): ExecutionContext {
  const handler = EmployeesCompatSubController.prototype[methodName] as unknown as object;
  return {
    getHandler: () => handler,
    getClass: () => EmployeesCompatSubController,
    switchToHttp: () => ({
      getRequest: () => ({ user: { role }, params: { id: '42' } }),
    }),
  } as unknown as ExecutionContext;
}

// The 6 PII-sensitive endpoints named in VISION-3340 #55.
const PII_METHODS = [
  'getPassport',
  'createPassport',
  'getBankAccounts',
  'createBankAccount',
  'getSalaryHistory',
  'createSalaryHistory',
] as const;

// Mirrors FE `PII_VIEWER_ROLES` (RoleGate.tsx) exactly.
const PII_VIEWER_ROLES = ['super_admin', 'director', 'hr_manager', 'hr_specialist', 'hr'] as const;

describe('EmployeesCompatSubController — VISION-3340 #55 PII route narrowing', () => {
  function makeGuard(): RolesGuard {
    return new RolesGuard(new Reflector(), makeI18n());
  }

  describe.each(PII_METHODS)('%s', (methodName) => {
    it('forbids a plain MANAGER role (403)', async () => {
      const guard = makeGuard();
      const ctx = makeContext(methodName, 'MANAGER');
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it.each(PII_VIEWER_ROLES)('allows FE PII_VIEWER_ROLES member %s', async (role) => {
      const guard = makeGuard();
      const ctx = makeContext(methodName, role);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('has a method-level roles list matching PII_VIEWER_ROLES exactly (case-insensitive)', () => {
      const roles = Reflect.getMetadata('roles', EmployeesCompatSubController.prototype[methodName] as unknown as object) as
        | string[]
        | undefined;
      expect(roles).toBeDefined();
      const lower = (roles ?? []).map((r) => r.toLowerCase()).sort();
      expect(lower).toEqual([...PII_VIEWER_ROLES].sort());
      expect(lower).not.toContain('manager');
      expect(lower).not.toContain('admin');
    });
  });

  it('non-PII method (getAssets) is unaffected — plain MANAGER still passes via class-level HR_ROLES', async () => {
    const guard = makeGuard();
    const ctx = makeContext('getAssets', 'MANAGER');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    // Confirms getAssets carries no method-level override (falls back to class metadata).
    expect(Reflect.getMetadata('roles', EmployeesCompatSubController.prototype.getAssets as unknown as object)).toBeUndefined();
  });

  it('super_admin bypasses on PII methods even though it is also allow-listed explicitly', async () => {
    const guard = makeGuard();
    const ctx = makeContext('getPassport', 'super_admin');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
