/**
 * test/wms/rop-trigger.handler.spec.ts
 *
 * Unit tests for RopTriggerHandler — auto purchase requisition trigger.
 * `runQuery` is mocked; the handler is event-driven and returns void.
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { RopTriggerHandler, StockLevelUpdatedPayload } from '../../src/modules/wms/infrastructure/event-handlers/rop-trigger.handler';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

interface PolicyRow { material_id: number; reorder_point: number; eoq: number }
interface MaterialRow {
  name: string;
  code: string;
  current_stock: number;
  min_order_qty: number;
}

function policy(rop: number, eoq = 0): PolicyRow {
  return { material_id: 100, reorder_point: rop, eoq };
}
function material(stock: number, min = 0): MaterialRow {
  return { name: 'Karton', code: 'MAT-100', current_stock: stock, min_order_qty: min };
}

describe('RopTriggerHandler', () => {
  let handler: RopTriggerHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [RopTriggerHandler],
    }).compile();
    handler = moduleRef.get(RopTriggerHandler);
  });

  it('exits silently when no policy row exists for the material', async () => {
    mockRun.mockResolvedValueOnce({ rows: [] } as never);
    const payload: StockLevelUpdatedPayload = { materialId: 100, newOnHand: 0 };

    await handler.handleStockLevelUpdated(payload);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('exits when canonical on-hand still above the reorder point', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [policy(50)] } as never)
      .mockResolvedValueOnce({ rows: [material(80)] } as never);

    await handler.handleStockLevelUpdated({ materialId: 100, newOnHand: 80 });

    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('skips creating a new requisition when an open one already exists within dedup window', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [policy(50)] } as never)
      .mockResolvedValueOnce({ rows: [material(30)] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 999 }] } as never);

    await handler.handleStockLevelUpdated({ materialId: 100, newOnHand: 30 });

    // 3 reads (policy, material, dedup) and NO insert
    expect(mockRun).toHaveBeenCalledTimes(3);
  });

  it('inserts a requisition when on-hand drops below ROP and no recent req exists', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [policy(50, 200)] } as never)
      .mockResolvedValueOnce({ rows: [material(30, 100)] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [{ eoq_qty: 150 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await handler.handleStockLevelUpdated({ materialId: 100, newOnHand: 30 });

    expect(mockRun).toHaveBeenCalledTimes(5);
  });

  it('swallows and logs errors thrown by runQuery', async () => {
    mockRun.mockRejectedValueOnce(new Error('db down'));

    await expect(
      handler.handleStockLevelUpdated({ materialId: 100, newOnHand: 0 }),
    ).resolves.toBeUndefined();
  });
});
