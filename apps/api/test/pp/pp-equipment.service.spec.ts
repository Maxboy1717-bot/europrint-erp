/**
 * test/pp/pp-equipment.service.spec.ts
 *
 * PpEquipmentService coordinates the equipment repo with a fallback to
 * listing work centers when no equipment rows are returned.
 */

import { PpEquipmentService } from '../../src/modules/pp/application/pp-equipment.service';
import { PpEquipmentRepository } from '../../src/modules/pp/application/pp-equipment.repository';

function buildRepo(overrides: Partial<jest.Mocked<PpEquipmentRepository>> = {}): jest.Mocked<PpEquipmentRepository> {
  return {
    listEquipment: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    listWorkCenters: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, name: 'WC1' }] }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<PpEquipmentRepository>;
}

describe('PpEquipmentService', () => {
  it('listEquipment returns equipment rows when the repository finds them', async () => {
    const repo = buildRepo({
      listEquipment: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, name: 'Press' }] }),
    });
    const svc = new PpEquipmentService(repo);

    const r = await svc.listEquipment(null, 50);

    expect(repo.listEquipment).toHaveBeenCalledWith(null, 50);
    expect(repo.listWorkCenters).not.toHaveBeenCalled();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as { data: unknown[] }).data).toEqual([{ id: 1, name: 'Press' }]);
  });

  it('falls back to listWorkCenters when equipment list is empty', async () => {
    const repo = buildRepo({
      listEquipment: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      listWorkCenters: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 9, name: 'WC9' }] }),
    });
    const svc = new PpEquipmentService(repo);

    const r = await svc.listEquipment('active', 25);

    expect(repo.listEquipment).toHaveBeenCalledWith('active', 25);
    expect(repo.listWorkCenters).toHaveBeenCalledWith(25);
    expect(r.ok).toBe(true);
  });

  it('getEquipment delegates to repo.findById', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 4, name: 'X' } }),
    });
    const svc = new PpEquipmentService(repo);

    const r = await svc.getEquipment(4);

    expect(repo.findById).toHaveBeenCalledWith(4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ id: 4, name: 'X' });
  });

  it('createEquipment forwards the body to the repository', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 99, name: 'New' } }),
    });
    const svc = new PpEquipmentService(repo);

    const r = await svc.createEquipment({ name: 'New', workCenterId: 1 });

    expect(repo.create).toHaveBeenCalledWith({ name: 'New', workCenterId: 1 });
    expect(r.ok).toBe(true);
  });

  it('updateEquipment forwards id and partial fields to the repository', async () => {
    const repo = buildRepo({
      update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'inactive' } }),
    });
    const svc = new PpEquipmentService(repo);

    const r = await svc.updateEquipment(1, { status: 'inactive' });

    expect(repo.update).toHaveBeenCalledWith(1, { status: 'inactive' });
    expect(r.ok).toBe(true);
  });
});
