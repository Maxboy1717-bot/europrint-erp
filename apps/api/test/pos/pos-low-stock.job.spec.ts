/**
 * test/pos/pos-low-stock.job.spec.ts
 *
 * Owner-decisions batch item 2: LOW_STOCK auto-routes to WAREHOUSE-role users. The job
 * now resolves the routing rule's role to concrete user ids (resolveUserIds, fallback
 * 'warehouse_keeper') and writes ONE per-user notification each (sendNotification) —
 * instead of a role-broadcast row (user_id=0) that the reader (getForUser = user_id
 * match) never surfaced. This pins: warehouse fallback role, per-user fan-out, and that
 * the invisible broadcast path is no longer used.
 */

import { PosLowStockJob } from '../../src/modules/pos/application/jobs/pos-low-stock.job';
import { Ok } from '../../src/common/result';

function makeJob() {
  const fifo = { getLowStockMaterials: jest.fn().mockResolvedValue(Ok([
    { materialId: 1, materialCode: 'RM-001', warehouseId: 7, currentQty: 5, minQty: 20 },
  ])) };
  const telegram = { sendAlert: jest.fn().mockResolvedValue(Ok(undefined)) };
  const notifications = {
    sendNotification: jest.fn().mockResolvedValue(Ok({})),
    createNotification: jest.fn().mockResolvedValue(Ok(undefined)), // broadcast — must NOT be used
  };
  const routing = { resolveUserIds: jest.fn().mockResolvedValue(Ok([101, 102])) };
  const job = new PosLowStockJob(fifo as never, telegram as never, notifications as never, routing as never);
  return { job, fifo, telegram, notifications, routing };
}

describe('PosLowStockJob.checkLowStock — warehouse-role per-user routing (item 2)', () => {
  it('resolves users via the warehouse_keeper fallback and fans out one row per user', async () => {
    const { job, notifications, routing } = makeJob();
    await job.checkLowStock();

    expect(routing.resolveUserIds).toHaveBeenCalledWith('wms.low_stock', 'warehouse_keeper');
    // 1 low-stock item x 2 resolved users = 2 per-user notifications
    expect(notifications.sendNotification).toHaveBeenCalledTimes(2);
    const calledUserIds = notifications.sendNotification.mock.calls.map((c: unknown[]) => c[0]);
    expect(calledUserIds).toEqual(expect.arrayContaining([101, 102]));
    const [, type] = notifications.sendNotification.mock.calls[0];
    expect(type).toBe('LOW_STOCK');
    // the invisible role-broadcast (user_id=0) path is no longer used
    expect(notifications.createNotification).not.toHaveBeenCalled();
  });

  it('writes nothing when no warehouse users resolve (no recipients)', async () => {
    const { job, notifications, routing } = makeJob();
    routing.resolveUserIds.mockResolvedValueOnce(Ok([]));
    await job.checkLowStock();
    expect(notifications.sendNotification).not.toHaveBeenCalled();
  });
});
