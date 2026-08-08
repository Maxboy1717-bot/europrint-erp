/**
 * test/pp/pp-order-flags-reason-code.repo.spec.ts
 *
 * VISION-3340 #23 — DrizzlePpProductionOrdersRepository.updateFlags now also
 * persists an OPTIONAL structured reason (production_orders.reason_code_id →
 * pp_reason_codes.id) alongside the urgent/frozen flags. The reason_code_id write
 * goes through a parameterised runQuery and fires ONLY when a reasonCodeId is
 * supplied — no fabrication (Q-40).
 *
 * Sibling style: makeDbMock + mock @shared/db and @europrint/schemas
 * (see drizzle-pp-bom.repo.spec.ts).
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  productionOrders: { id: 'id', isUrgent: 'is_urgent', isFrozen: 'is_frozen', frozenUntil: 'frozen_until' },
}));

import { DrizzlePpProductionOrdersRepository } from '../../src/modules/pp/production-orders/drizzle-pp-production-orders.repo';

describe('DrizzlePpProductionOrdersRepository.updateFlags — structured reason code (VISION-3340 #23)', () => {
  let repo: DrizzlePpProductionOrdersRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzlePpProductionOrdersRepository();
  });

  it('threads reasonCodeId into a reason_code_id persist (runQuery) alongside the flag write', async () => {
    kit.queueUpdate([{ id: 1, is_urgent: true }]); // drizzle flag write .returning()
    const r = await repo.updateFlags(1, { isUrgent: true, reasonCodeId: 9 });
    expect(r.ok).toBe(true);
    // the structured-reason UPDATE fired exactly once (reason code was persisted).
    expect(kit.runQuery).toHaveBeenCalledTimes(1);
  });

  it('does NOT write reason_code_id when reasonCodeId is omitted (Q-40 — no fabrication)', async () => {
    kit.queueUpdate([{ id: 1, is_frozen: true }]);
    const r = await repo.updateFlags(1, { isFrozen: true });
    expect(r.ok).toBe(true);
    expect(kit.runQuery).not.toHaveBeenCalled();
  });

  it('returns Err when the flag write throws (reason_code_id write not reached)', async () => {
    kit.queueUpdate(new Error('lock'));
    const r = await repo.updateFlags(1, { isUrgent: true, reasonCodeId: 3 });
    expect(r.ok).toBe(false);
    expect(kit.runQuery).not.toHaveBeenCalled();
  });

  // EP-PP-082 #2/#39 — the freeze/urgent override's mandatory written justification is now
  // persisted as an order-queryable audit row (previously validated then discarded).
  it('persists the override justification as an audit row when a reason is supplied', async () => {
    // the .returning() row carries `status` — the audit row uses it for old===new_status
    // (new_status is NOT NULL, so a real current status is required).
    kit.queueUpdate([{ id: 1, is_urgent: true, status: 'in_progress' }]);
    const r = await repo.updateFlags(1, { isUrgent: true }, 7, "Direktor buyrug'i bilan shoshilinch");
    expect(r.ok).toBe(true);
    // one runQuery: the flags-override audit insert (no reasonCodeId this time).
    expect(kit.runQuery).toHaveBeenCalledTimes(1);
  });

  it('writes BOTH the reason_code_id update AND the audit row when reasonCodeId + reason supplied', async () => {
    kit.queueUpdate([{ id: 1, is_frozen: true, status: 'released_to_production' }]);
    const r = await repo.updateFlags(1, { isFrozen: true, reasonCodeId: 9 }, 7, 'Muzlatish sababi yozildi');
    expect(r.ok).toBe(true);
    expect(kit.runQuery).toHaveBeenCalledTimes(2);
  });

  it('does NOT write an audit row when no reason is supplied (Q-40 — no fabrication)', async () => {
    kit.queueUpdate([{ id: 1, is_urgent: true }]);
    const r = await repo.updateFlags(1, { isUrgent: true });
    expect(r.ok).toBe(true);
    expect(kit.runQuery).not.toHaveBeenCalled();
  });
});
