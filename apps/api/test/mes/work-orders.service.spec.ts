/**
 * test/mes/work-orders.service.spec.ts
 *
 * WorkOrdersService wraps IWorkOrdersRepository in `safeCall(...)`, but it
 * carries real branching/transform logic worth locking down:
 *   - findAll:      derives { page, limit, offset, totalPages } from a raw
 *                    query object and forwards limit/offset to the repo.
 *   - findOne:       404s (Result NOT_FOUND) when the order does not exist,
 *                    and otherwise merges sessions/crews onto the order,
 *                    tolerating a failed sub-lookup by falling back to [].
 *   - updateStatus:  refuses to update (and never calls repo.updateStatus)
 *                    when the order does not exist.
 */

import { WorkOrdersService } from '../../src/modules/mes/work-orders/work-orders.service';
import { IWorkOrdersRepository } from '../../src/modules/mes/work-orders/i-work-orders.repo';
import { Ok, Err } from '../../src/common/result';

function buildRepo(
  overrides: Partial<jest.Mocked<IWorkOrdersRepository>> = {},
): jest.Mocked<IWorkOrdersRepository> {
  return {
    findAll: jest.fn().mockResolvedValue(Ok({ data: [], count: 0 })),
    findById: jest.fn().mockResolvedValue(Ok(null)),
    findSessionsByOrderId: jest.fn().mockResolvedValue(Ok([])),
    findCrewsByOrderId: jest.fn().mockResolvedValue(Ok([])),
    create: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    updateStatus: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'in_progress' })),
    ...overrides,
  } as unknown as jest.Mocked<IWorkOrdersRepository>;
}

describe('WorkOrdersService.findAll — pagination derivation', () => {
  it('defaults to page=1/limit=10 and computes offset=0 when the query is empty', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findAll({});

    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        data: [{ id: 1 }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    }
  });

  it('computes offset and totalPages from explicit page/limit (page 3, limit 20, total 95)', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue(Ok({ data: [], count: 95 })),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findAll({ page: 3, limit: 20 });

    // offset = (page-1)*limit = 40
    expect(repo.findAll).toHaveBeenCalledWith(20, 40);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        data: [],
        pagination: { total: 95, page: 3, limit: 20, totalPages: 5 },
      });
    }
  });

  it('returns a Result error (not a throw) when the repository fails', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue(Err('connection lost')),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findAll({});

    expect(result.ok).toBe(false);
  });
});

describe('WorkOrdersService.findOne', () => {
  it('returns a NOT_FOUND result and skips session/crew lookups when the order is missing', async () => {
    const repo = buildRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findOne(404);

    expect(repo.findById).toHaveBeenCalledWith(404);
    expect(repo.findSessionsByOrderId).not.toHaveBeenCalled();
    expect(repo.findCrewsByOrderId).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('404');
    }
  });

  it('merges sessions and crews onto the order when it exists', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 7, status: 'in_progress' })),
      findSessionsByOrderId: jest.fn().mockResolvedValue(Ok([{ id: 1, orderId: 7 }])),
      findCrewsByOrderId: jest.fn().mockResolvedValue(Ok([{ id: 2, orderId: 7 }])),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findOne(7);

    expect(repo.findSessionsByOrderId).toHaveBeenCalledWith(7);
    expect(repo.findCrewsByOrderId).toHaveBeenCalledWith(7);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        id: 7,
        status: 'in_progress',
        sessions: [{ id: 1, orderId: 7 }],
        crews: [{ id: 2, orderId: 7 }],
      });
    }
  });

  it('falls back to empty arrays (not a thrown error) when a sub-lookup fails', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 7 })),
      findSessionsByOrderId: jest.fn().mockResolvedValue(Err('timeout')),
      findCrewsByOrderId: jest.fn().mockResolvedValue(Ok([{ id: 2 }])),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.findOne(7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 7, sessions: [], crews: [{ id: 2 }] });
    }
  });
});

describe('WorkOrdersService.create', () => {
  it('forwards the dto unchanged and wraps the repository result', async () => {
    const created = { id: 42, status: 'pending' };
    const repo = buildRepo({ create: jest.fn().mockResolvedValue(Ok(created)) });
    const svc = new WorkOrdersService(repo);
    const dto = { production_order_id: 3, quantity: 100 };

    const result = await svc.create(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(Ok(created));
  });
});

describe('WorkOrdersService.updateStatus', () => {
  it('returns NOT_FOUND and never calls repo.updateStatus when the order does not exist', async () => {
    const repo = buildRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new WorkOrdersService(repo);

    const result = await svc.updateStatus(999, 'completed');

    expect(repo.findById).toHaveBeenCalledWith(999);
    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updates the status once the order is confirmed to exist', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 5, status: 'pending' })),
      updateStatus: jest.fn().mockResolvedValue(Ok({ id: 5, status: 'completed' })),
    });
    const svc = new WorkOrdersService(repo);

    const result = await svc.updateStatus(5, 'completed');

    expect(repo.updateStatus).toHaveBeenCalledWith(5, 'completed');
    expect(result).toEqual(Ok({ id: 5, status: 'completed' }));
  });
});
