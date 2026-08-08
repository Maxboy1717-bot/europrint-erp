/**
 * test/compatibility/employees-org-assignment-role.spec.ts
 *
 * M7 (Magic-Numbers Fix Loop, 2026-07-05): resolveRoleFromPositionRbacTier()
 * replaced a positionId-numeric-range guess (<=2 super_admin, <=5 director,
 * <=20 manager, else employee) with a real lookup of positions.rbac_tier.
 */

import { resolveRoleFromPositionRbacTier } from '../../src/modules/compatibility/employees-org-assignment.helper';

function fakeExec(rbacTier: string | null) {
  return jest.fn().mockResolvedValue({ rows: rbacTier === null ? [] : [{ rbac_tier: rbacTier }] });
}

describe('resolveRoleFromPositionRbacTier()', () => {
  it('returns employee when positionId is null (no position assigned)', async () => {
    const role = await resolveRoleFromPositionRbacTier(fakeExec(null), null);
    expect(role).toBe('employee');
  });

  it('maps rbac_tier=owner to super_admin', async () => {
    const role = await resolveRoleFromPositionRbacTier(fakeExec('owner'), 1);
    expect(role).toBe('super_admin');
  });

  it('maps rbac_tier=executive to director', async () => {
    const role = await resolveRoleFromPositionRbacTier(fakeExec('executive'), 3);
    expect(role).toBe('director');
  });

  it('maps rbac_tier=manager to manager regardless of numeric id (the old bug)', async () => {
    // Position #22 "Savdo Menejeri" has rbac_tier=manager but id=22 > 20 --
    // the OLD positionId<=20 guess would have wrongly returned 'employee' here.
    const role = await resolveRoleFromPositionRbacTier(fakeExec('manager'), 22);
    expect(role).toBe('manager');
  });

  it('maps rbac_tier=specialist/operator/standard to employee', async () => {
    expect(await resolveRoleFromPositionRbacTier(fakeExec('specialist'), 25)).toBe('employee');
    expect(await resolveRoleFromPositionRbacTier(fakeExec('operator'), 50)).toBe('employee');
    expect(await resolveRoleFromPositionRbacTier(fakeExec('standard'), 90)).toBe('employee');
  });

  it('falls back to employee when the position id does not exist', async () => {
    const role = await resolveRoleFromPositionRbacTier(fakeExec(null), 999999);
    expect(role).toBe('employee');
  });
});
