/**
 * test/ai/ai-provider-config-reservation.role-enum-unification.spec.ts
 *
 * M8 independent-verification finding (2026-07-07): two same-named `Role` enums coexisted
 * (roles.constants.ts, lowercase, canonical — vs. the now-deleted auth/enums/role.enum.ts /
 * auth/types/role.ts re-export, UPPERCASE, minority). Two functional dead-value bugs found in
 * consumers of the minority enum:
 *
 * 1. AiProviderConfigController's `@Roles(...)` lists included `Role.ADMIN` alongside
 *    `Role.SUPER_ADMIN` on both methods — 'ADMIN'/'admin' is a 100%-dead role value (no user
 *    ever has it; confirmed by an earlier live-DB check this session), so it was pure
 *    redundant clutter, not a security hole, but still worth removing as dead weight now that
 *    the enum swap touched these lines anyway.
 * 2. AiReservationController's class-level `@Roles(...)` included `Role.WAREHOUSE` = 'WAREHOUSE'
 *    — a value that exists ONLY in the deleted minority enum and never matches any real user's
 *    role/rbacTier string (the canonical, seed-defined warehouse role is 'warehouse_keeper').
 *    Real warehouse staff were silently locked out of every endpoint on this controller.
 *
 * This test inspects the `@Roles(...)` decorator's Reflect metadata directly to prove the dead
 * values are gone and, for AiReservationController, that the real value is present.
 */

import 'reflect-metadata';
import { AiProviderConfigController } from '../../src/modules/ai/presentation/ai-provider-config.controller';
import { AiReservationController } from '../../src/modules/ai/presentation/ai-reservation.controller';

function methodRoles(target: object, methodName: string): string[] | undefined {
  return Reflect.getMetadata('roles', (target as Record<string, object>)[methodName]);
}

function classRoles(target: object): string[] | undefined {
  return Reflect.getMetadata('roles', target);
}

describe('AiProviderConfigController — M8 dead Role.ADMIN removed', () => {
  it.each(['findAll', 'update'] as const)('%s no longer requires the dead "ADMIN" value', (methodName) => {
    const roles = methodRoles(AiProviderConfigController.prototype, methodName);
    expect(roles).toBeDefined();
    expect(roles).not.toContain('ADMIN');
  });

  it('findAll still allows super_admin, director, finance_manager (unchanged)', () => {
    const roles = methodRoles(AiProviderConfigController.prototype, 'findAll');
    expect(roles).toEqual(expect.arrayContaining(['super_admin', 'director', 'finance_manager']));
  });

  it('update still allows super_admin and director (unchanged)', () => {
    const roles = methodRoles(AiProviderConfigController.prototype, 'update');
    expect(roles).toEqual(expect.arrayContaining(['super_admin', 'director']));
  });
});

describe('AiReservationController — M8 Role enum unification (dead WAREHOUSE -> real warehouse_keeper)', () => {
  it('class-level roles no longer require the dead "WAREHOUSE" value and now require the real "warehouse_keeper" value', () => {
    const roles = classRoles(AiReservationController);
    expect(roles).toBeDefined();
    expect(roles).not.toContain('WAREHOUSE');
    expect(roles).toContain('warehouse_keeper');
  });

  it('class-level roles still allow super_admin, director, production_manager (unchanged)', () => {
    const roles = classRoles(AiReservationController);
    expect(roles).toEqual(expect.arrayContaining(['super_admin', 'director', 'production_manager']));
  });
});
