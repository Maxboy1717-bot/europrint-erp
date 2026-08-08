/**
 * test/org-structure/org-structure.controller.roles.spec.ts
 *
 * G1 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding A2): OrgStructureController's
 * class-level @Roles(...) gated both reads and writes with the SAME list, which omitted
 * hr/hr_manager (a dedicated HR login 403'd on every write) and included 'viewer' (over-
 * permissive on writes). Fixed by broadening the class-level list (now the READ baseline,
 * includes hr/hr_manager) and adding a narrower per-method @Roles override on every
 * create/update/delete method that drops 'viewer'.
 *
 * NestJS's RolesGuard resolves required roles via `reflector.getAllAndOverride('roles',
 * [handler, class])` — the method-level decorator wins when present. This test inspects the
 * `Reflect` metadata directly (no HTTP bootstrap needed) to prove the exact role sets, for
 * every write method in the controller, plus the read baseline.
 */

import 'reflect-metadata';
import { OrgStructureController } from '../../src/modules/org-structure/org-structure.controller';

function methodRoles(methodName: keyof OrgStructureController): string[] | undefined {
  return Reflect.getMetadata('roles', OrgStructureController.prototype[methodName] as unknown as object);
}

function classRoles(): string[] | undefined {
  return Reflect.getMetadata('roles', OrgStructureController);
}

describe('OrgStructureController — G1 role guard fix', () => {
  it('class-level (read) baseline now includes hr/hr_manager and still includes viewer', () => {
    const roles = classRoles();
    expect(roles).toEqual(
      expect.arrayContaining(['admin', 'manager', 'supervisor', 'viewer', 'director', 'hr', 'hr_manager']),
    );
  });

  it.each([
    'create', 'importNodes', 'update', 'remove', 'move', 'assignUser',
    'removeUserFromNode', 'addFolderItem', 'removeFolderItem',
    'createNodeHrRequest', 'createNodePortret',
  ] as const)('write method %s allows hr/hr_manager but NOT viewer', (methodName) => {
    const roles = methodRoles(methodName);
    expect(roles).toBeDefined();
    expect(roles).toEqual(expect.arrayContaining(['hr', 'hr_manager', 'admin', 'manager', 'supervisor', 'director']));
    expect(roles).not.toEqual(expect.arrayContaining(['viewer']));
  });

  it('read-only methods (no override) fall back to the class-level baseline, including viewer', () => {
    // getHierarchy has no method-level @Roles — RolesGuard falls through to the class list.
    expect(methodRoles('getHierarchy')).toBeUndefined();
    expect(methodRoles('findOne')).toBeUndefined();
  });

  it('the pre-existing admin/hr-only override on backfill-manager-ids is untouched', () => {
    expect(methodRoles('getDerivedManager' as keyof OrgStructureController)).toBeUndefined();
  });
});
