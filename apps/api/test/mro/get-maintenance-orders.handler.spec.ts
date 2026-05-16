/**
 * test/mro/get-maintenance-orders.handler.spec.ts
 * Unit tests for GetMaintenanceOrdersHandler. IMaintenanceRepo is mocked; aggregate real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetMaintenanceOrdersHandler } from '../../src/modules/mro/application/queries/get-maintenance-orders.handler';
import { GetMaintenanceOrdersQuery } from '../../src/modules/mro/application/queries/get-maintenance-orders.query';
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
  return MaintenanceOrder.create('M-1', MaintenanceType.PREVENTIVE, 'd', new Date('2026-06-01'));
}

describe('GetMaintenanceOrdersHandler', () => {
  let handler: GetMaintenanceOrdersHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetMaintenanceOrdersHandler,
        { provide: MAINTENANCE_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetMaintenanceOrdersHandler);
  });

  it('returns Ok with PaginatedResult when repo returns orders', async () => {
    const items = [makeOrder(), makeOrder()];
    repo.findAll.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetMaintenanceOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetMaintenanceOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes status + priority + assignedTo filters through unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetMaintenanceOrdersQuery({
      status: 'scheduled', priority: 'high', assignedTo: 'tech-1', page: 2, limit: 15,
    }));

    expect(repo.findAll).toHaveBeenCalledWith({
      status: 'scheduled', priority: 'high', assignedTo: 'tech-1', page: 2, limit: 15,
    });
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetMaintenanceOrdersQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
