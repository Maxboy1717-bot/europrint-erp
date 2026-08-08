/**
 * test/sd/sd-order-departments.controller.role-enum-unification.spec.ts
 *
 * M8 independent-verification finding (2026-07-07): two same-named `Role` enums coexisted
 * (roles.constants.ts, lowercase, canonical — vs. the now-deleted auth/enums/role.enum.ts,
 * UPPERCASE, minority). SdOrderDepartmentsController imported the minority enum and gated
 * two real, live endpoints (`PATCH :id/shipping/status`, `PATCH :id/materials/:reqId/status`)
 * with `Role.WAREHOUSE` = 'WAREHOUSE' — a value that exists ONLY in the deleted enum and never
 * matches any real user's role/rbacTier string (the canonical, seed-defined warehouse role is
 * 'warehouse_keeper'). Since RolesGuard lowercases both sides before comparing, 'WAREHOUSE' can
 * never equal 'warehouse_keeper' — real warehouse staff were silently locked out of both
 * endpoints (reachable only via the director/super_admin bypass), a genuine live authorization
 * bug, not merely a code-hygiene inconsistency.
 *
 * Fix: import the canonical `Role` from roles.constants.ts and remap `Role.WAREHOUSE` to the
 * real `Role.WAREHOUSE_KEEPER` ('warehouse_keeper'). This test inspects the `@Roles(...)`
 * decorator's Reflect metadata directly to prove the dead value is gone and the real one is
 * present, for both previously-broken methods.
 */

import 'reflect-metadata';
import { SdOrderDepartmentsController } from '../../src/modules/sd/presentation/sd-order-departments.controller';

function methodRoles(methodName: keyof SdOrderDepartmentsController): string[] | undefined {
  return Reflect.getMetadata('roles', SdOrderDepartmentsController.prototype[methodName] as unknown as object);
}

describe('SdOrderDepartmentsController — M8 Role enum unification (dead WAREHOUSE -> real warehouse_keeper)', () => {
  it.each(['setShippingStatus', 'setMaterialStatus'] as const)(
    '%s no longer requires the dead "WAREHOUSE" value and now requires the real "warehouse_keeper" value',
    (methodName) => {
      const roles = methodRoles(methodName);
      expect(roles).toBeDefined();
      expect(roles).not.toContain('WAREHOUSE');
      expect(roles).toContain('warehouse_keeper');
    },
  );

  it.each(['setShippingStatus', 'setMaterialStatus'] as const)(
    '%s still allows director and super_admin (unchanged, lowercase values from the canonical enum)',
    (methodName) => {
      const roles = methodRoles(methodName);
      expect(roles).toEqual(expect.arrayContaining(['director', 'super_admin']));
    },
  );

  it('other unaffected methods (list, saga) still carry their unchanged canonical role sets', () => {
    expect(methodRoles('list')).toEqual(expect.arrayContaining(['sales_manager', 'director', 'super_admin']));
    expect(methodRoles('saga')).toEqual(expect.arrayContaining(['sales_manager', 'director', 'super_admin']));
  });
});
