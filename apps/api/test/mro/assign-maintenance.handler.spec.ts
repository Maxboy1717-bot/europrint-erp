/**
 * test/mro/assign-maintenance.handler.spec.ts
 * Unit tests for AssignMaintenanceHandler. IMaintenanceRepo is mocked; aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AssignMaintenanceHandler } from '../../src/modules/mro/application/commands/assign-maintenance.handler';
import { AssignMaintenanceCommand } from '../../src/modules/mro/application/commands/assign-maintenance.command';
import { MAINTENANCE_REPO } from '../../src/modules/mro/domain/repositories/i-maintenance.repo';
import { MaintenanceOrder } from '../../src/modules/mro/domain/aggregates/maintenance-order.aggregate';
import { MaintenanceType } from '../../src/modules/mro/domain/enums/maintenance-status.enum';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findOpenByEquipment: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findOpenByEquipment: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeOrder(): MaintenanceOrder {
  return MaintenanceOrder.create('M-1', MaintenanceType.PREVENTIVE, 'desc', new Date('2026-06-01'));
}

describe('AssignMaintenanceHandler', () => {
  let handler: AssignMaintenanceHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AssignMaintenanceHandler,
        { provide: MAINTENANCE_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(AssignMaintenanceHandler);
  });

  it('returns NOT_FOUND when maintenance order does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new AssignMaintenanceCommand('missing', 'tech-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('assigns aggregate to technician when order exists', async () => {
    const order = makeOrder();
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Ok(order));

    await handler.execute(new AssignMaintenanceCommand(order.id, 'tech-99'));

    expect(order.assignedTo).toBe('tech-99');
    expect(order.status).toBe('in_progress');
  });

  it('persists assignedTo + status via repo.update when assignment succeeds', async () => {
    const order = makeOrder();
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Ok(order));

    await handler.execute(new AssignMaintenanceCommand(order.id, 'tech-7'));

    expect(repo.update).toHaveBeenCalledWith(order.id, expect.objectContaining({
      assignedTo: 'tech-7',
      status: 'in_progress',
    }));
  });

  it('propagates repo error when update fails', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new AssignMaintenanceCommand('id', 'tech-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
