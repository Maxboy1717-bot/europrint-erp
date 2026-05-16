/**
 * test/mes/mes-maintenance.service.spec.ts
 *
 * MesMaintenanceService is a thin layer over MesMaintenanceRepository.
 * Notable transformation: updateTaskProgress clamps incoming progress into
 * [0, 100] and derives status (completed if ≥100, otherwise in_progress).
 */

import { MesMaintenanceService } from '../../src/modules/mes/application/mes-maintenance.service';
import { MesMaintenanceRepository } from '../../src/modules/mes/infrastructure/repositories/mes-maintenance.repo';

function buildRepo(overrides: Partial<jest.Mocked<MesMaintenanceRepository>> = {}): jest.Mocked<MesMaintenanceRepository> {
  return {
    listMaintenanceRequests: jest.fn().mockResolvedValue([]),
    createMaintenanceRequest: jest.fn().mockResolvedValue([{ id: 1 }]),
    updateMaintenanceRequest: jest.fn().mockResolvedValue([{ id: 1 }]),
    listTasks: jest.fn().mockResolvedValue([]),
    updateTaskProgress: jest.fn().mockResolvedValue([{ id: 1 }]),
    createSos: jest.fn().mockResolvedValue([{ id: 1 }]),
    getSosHistory: jest.fn().mockResolvedValue([]),
    getDowntimeReasons: jest.fn().mockResolvedValue([]),
    createDowntimeEvent: jest.fn().mockResolvedValue([{ id: 1 }]),
    getDowntimeEvents: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as jest.Mocked<MesMaintenanceRepository>;
}

describe('MesMaintenanceService.updateTaskProgress', () => {
  it("derives status='completed' when progress reaches 100", async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.updateTaskProgress(1, 100, 'done');

    expect(repo.updateTaskProgress).toHaveBeenCalledWith(1, 100, 'completed', 'done');
  });

  it("derives status='in_progress' for progress below 100", async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.updateTaskProgress(1, 60, 'halfway');

    expect(repo.updateTaskProgress).toHaveBeenCalledWith(1, 60, 'in_progress', 'halfway');
  });

  it('clamps progress above 100 down to 100', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.updateTaskProgress(2, 250, undefined);

    expect(repo.updateTaskProgress).toHaveBeenCalledWith(2, 100, 'completed', undefined);
  });

  it('clamps negative progress up to 0', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.updateTaskProgress(3, -25, undefined);

    expect(repo.updateTaskProgress).toHaveBeenCalledWith(3, 0, 'in_progress', undefined);
  });
});

describe('MesMaintenanceService — passthroughs', () => {
  it('listMaintenanceRequests forwards status filter and pagination', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.listMaintenanceRequests('open', 20, 5);

    expect(repo.listMaintenanceRequests).toHaveBeenCalledWith('open', 20, 5);
  });

  it('createMaintenanceRequest forwards body and userId', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.createMaintenanceRequest('Calibrate press', 'q-check', 4, 'high', 9);

    expect(repo.createMaintenanceRequest).toHaveBeenCalledWith(
      'Calibrate press', 'q-check', 4, 'high', 9,
    );
  });

  it('createSos forwards session/reason/userId', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.createSos(11, 'machine jam', 2, 7);

    expect(repo.createSos).toHaveBeenCalledWith(11, 'machine jam', 2, 7);
  });

  it('getDowntimeEvents forwards session id', async () => {
    const repo = buildRepo();
    const svc = new MesMaintenanceService(repo);

    await svc.getDowntimeEvents(33);

    expect(repo.getDowntimeEvents).toHaveBeenCalledWith(33);
  });
});
