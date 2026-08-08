/**
 * org-cascade.spec.ts — EP-ORG-041 (ORG-CASCADE, owner decision #13)
 *
 * Covers OrgCascadeListener.handle() with a mocked OrgCascadeRepository:
 *   1. warehouse-bearing dept created  → warehouse + RBAC created
 *   2. non-warehouse dept              → nothing
 *   3. idempotent (second event)       → no duplicate warehouse
 *   4. head missing                    → warehouse created, RBAC skipped + note
 *
 * Repo is mocked (domain-logic orchestration unit — the real INSERTs live in
 * OrgCascadeRepository and are exercised against the live DB separately).
 */

import { OrgCascadeListener } from '../src/modules/org-structure/cascade/org-cascade.listener';
import { DepartmentCreatedEvent } from '../src/modules/org-structure/cascade/department-created.event';
import { Ok, Err } from '../src/common/result';

interface FakeCascadeRepo {
  findWarehouseByNode: jest.Mock;
  createWarehouseForNode: jest.Mock;
  getUserRole: jest.Mock;
  grantRoleToUser: jest.Mock;
}

function makeRepo(overrides: Partial<FakeCascadeRepo> = {}): FakeCascadeRepo {
  return {
    findWarehouseByNode: jest.fn().mockResolvedValue(Ok(null)),
    createWarehouseForNode: jest.fn().mockResolvedValue(Ok({ id: 101, code: 'ORG-WH-7' })),
    getUserRole: jest.fn().mockResolvedValue(Ok('employee')),
    grantRoleToUser: jest.fn().mockResolvedValue(Ok(true)),
    ...overrides,
  };
}

function listener(repo: FakeCascadeRepo): OrgCascadeListener {
  return new OrgCascadeListener(repo as never);
}

describe('OrgCascadeListener.handle — EP-ORG-041', () => {
  it('warehouse-bearing node (sex) → creates warehouse + grants RBAC', async () => {
    const repo = makeRepo();
    const event = new DepartmentCreatedEvent(7, 'sex', 42, 'Gofra Sexi');
    const result = await listener(repo).handle(event);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.applied).toBe(true);
    expect(result.data.warehouseCreated).toBe(true);
    expect(result.data.warehouseId).toBe(101);
    expect(result.data.roleGranted).toBe(true);
    expect(repo.createWarehouseForNode).toHaveBeenCalledWith({
      nodeId: 7,
      name: 'Gofra Sexi',
      headUserId: 42,
    });
    expect(repo.grantRoleToUser).toHaveBeenCalledWith(42, 'wms_operator');
  });

  it('non-warehouse node (department) → does nothing', async () => {
    const repo = makeRepo();
    const event = new DepartmentCreatedEvent(8, 'department', 42, 'Buxgalteriya');
    const result = await listener(repo).handle(event);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.applied).toBe(false);
    expect(result.data.warehouseCreated).toBe(false);
    expect(result.data.warehouseId).toBeNull();
    expect(result.data.roleGranted).toBe(false);
    expect(repo.findWarehouseByNode).not.toHaveBeenCalled();
    expect(repo.createWarehouseForNode).not.toHaveBeenCalled();
    expect(repo.grantRoleToUser).not.toHaveBeenCalled();
  });

  it('idempotent — warehouse already exists → no duplicate, no grant', async () => {
    const repo = makeRepo({
      findWarehouseByNode: jest.fn().mockResolvedValue(Ok(55)),
    });
    const event = new DepartmentCreatedEvent(7, 'warehouse', 42, 'Asosiy Ombor');
    const result = await listener(repo).handle(event);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.applied).toBe(true);
    expect(result.data.warehouseCreated).toBe(false);
    expect(result.data.warehouseId).toBe(55);
    expect(result.data.roleGranted).toBe(false);
    expect(repo.createWarehouseForNode).not.toHaveBeenCalled();
    expect(repo.grantRoleToUser).not.toHaveBeenCalled();
  });

  it('head missing → warehouse created, RBAC skipped + noted', async () => {
    const repo = makeRepo();
    const event = new DepartmentCreatedEvent(9, 'sex', null, 'Yangi Sex');
    const result = await listener(repo).handle(event);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.applied).toBe(true);
    expect(result.data.warehouseCreated).toBe(true);
    expect(result.data.roleGranted).toBe(false);
    expect(result.data.note).toMatch(/rahbar tayinlanmagan|RBAC/i);
    expect(repo.createWarehouseForNode).toHaveBeenCalledWith({
      nodeId: 9,
      name: 'Yangi Sex',
      headUserId: null,
    });
    expect(repo.grantRoleToUser).not.toHaveBeenCalled();
  });

  it('protected/already-set head role → warehouse created, role NOT overwritten', async () => {
    const repo = makeRepo({
      grantRoleToUser: jest.fn().mockResolvedValue(Ok(false)), // skipped by guard
    });
    const event = new DepartmentCreatedEvent(11, 'sex', 1, 'Direktor Ombori');
    const result = await listener(repo).handle(event);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.warehouseCreated).toBe(true);
    expect(result.data.roleGranted).toBe(false);
    expect(repo.grantRoleToUser).toHaveBeenCalledWith(1, 'wms_operator');
  });

  it('type matching is case-insensitive (SEX)', async () => {
    const repo = makeRepo();
    const event = new DepartmentCreatedEvent(12, 'SEX', 5, 'Ofset Sexi');
    const result = await listener(repo).handle(event);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.applied).toBe(true);
    expect(repo.createWarehouseForNode).toHaveBeenCalled();
  });

  it('warehouse create failure → Result err, no grant attempted', async () => {
    const repo = makeRepo({
      createWarehouseForNode: jest.fn().mockResolvedValue(Err('DB down')),
    });
    const event = new DepartmentCreatedEvent(13, 'sex', 5, 'Sex X');
    const result = await listener(repo).handle(event);
    expect(result.ok).toBe(false);
    expect(repo.grantRoleToUser).not.toHaveBeenCalled();
  });
});
