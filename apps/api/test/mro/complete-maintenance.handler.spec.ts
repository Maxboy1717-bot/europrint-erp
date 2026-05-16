/**
 * test/mro/complete-maintenance.handler.spec.ts
 * Unit tests for CompleteMaintenanceHandler. Repo + EventEmitter2 mocked; aggregate real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CompleteMaintenanceHandler, CompleteMaintenanceCommand } from '../../src/modules/mro/application/commands/complete-maintenance.handler';
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

function makeEmitter(): EventEmitter2 {
  return { emit: jest.fn().mockReturnValue(true) } as unknown as EventEmitter2;
}

function makeOrder(productionOrderAffected: string | null = null): MaintenanceOrder {
  const o = MaintenanceOrder.create('M-1', MaintenanceType.PREVENTIVE, 'desc', new Date('2026-06-01'));
  o.productionOrderAffected = productionOrderAffected;
  return o;
}

describe('CompleteMaintenanceHandler', () => {
  let handler: CompleteMaintenanceHandler;
  let repo: RepoMock;
  let emitter: EventEmitter2;

  beforeEach(async () => {
    repo = makeRepo();
    emitter = makeEmitter();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteMaintenanceHandler,
        { provide: MAINTENANCE_REPO, useValue: repo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();
    handler = moduleRef.get(CompleteMaintenanceHandler);
  });

  it('returns NOT_FOUND when order does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new CompleteMaintenanceCommand('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('sets aggregate status to completed and stamps completedAt when order exists', async () => {
    const order = makeOrder();
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Ok(order));

    await handler.execute(new CompleteMaintenanceCommand(order.id));

    expect(order.status).toBe('completed');
    expect(order.completedAt).not.toBeNull();
  });

  it('does NOT emit MRO_MAINTENANCE_COMPLETED event when productionOrderAffected is null', async () => {
    const order = makeOrder(null);
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Ok(order));

    await handler.execute(new CompleteMaintenanceCommand(order.id));

    expect((emitter.emit as jest.Mock)).not.toHaveBeenCalled();
  });

  it('emits MRO_MAINTENANCE_COMPLETED event when productionOrderAffected is set', async () => {
    const order = makeOrder('po-77');
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Ok(order));

    await handler.execute(new CompleteMaintenanceCommand(order.id));

    expect((emitter.emit as jest.Mock)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ productionOrderId: 'po-77' }),
    );
  });

  it('propagates repo error when update fails', async () => {
    const order = makeOrder();
    repo.findById.mockResolvedValue(Ok(order));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new CompleteMaintenanceCommand('id'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
