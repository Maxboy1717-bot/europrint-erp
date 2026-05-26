/**
 * production-order.aggregate.spec.ts — Production Order aggregate (DDD C.23).
 *
 * Verifies that error returns are CODES (not Uzbek messages) so the
 * presentation layer can translate them centrally.
 */

import {
  ProductionOrder,
  MaterialRequirement,
  PoStatus,
} from '../../src/modules/pp/domain/aggregates/production-order.aggregate';

function newOrder(): ProductionOrder {
  return new ProductionOrder(1, 10, 100, 200, new Date(), new Date(Date.now() + 1_000_000));
}

describe('ProductionOrder — error codes (DDD C.23)', () => {
  it('release() returns CHECKPOINT_REQUIRED when not validated', () => {
    const po = newOrder();
    const r = po.release();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('CHECKPOINT_REQUIRED');
  });

  it('release() returns INVALID_STATUS_FOR_RELEASE when status is not PLANNED', () => {
    const po = newOrder();
    po.setCheckpointValidated(true);
    expect(po.release().ok).toBe(true);
    const r = po.release();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('INVALID_STATUS_FOR_RELEASE');
  });

  it('startProduction() returns NOT_RELEASED when status is PLANNED', () => {
    const po = newOrder();
    const r = po.startProduction();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('NOT_RELEASED');
  });

  it('complete() returns NOT_IN_PROGRESS when status is PLANNED', () => {
    const po = newOrder();
    const r = po.complete();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('NOT_IN_PROGRESS');
  });

  it('addMaterialRequirement returns MATERIAL_ALREADY_ADDED on duplicate', () => {
    const po = newOrder();
    expect(po.addMaterialRequirement(new MaterialRequirement(1, 10)).ok).toBe(true);
    const r = po.addMaterialRequirement(new MaterialRequirement(1, 5));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('MATERIAL_ALREADY_ADDED');
  });

  it('happy path: PLANNED -> RELEASED -> IN_PROGRESS -> COMPLETED', () => {
    const po = newOrder();
    po.setCheckpointValidated(true);
    expect(po.release().ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.RELEASED_TO_PRODUCTION);
    expect(po.startProduction().ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.IN_PROGRESS);
    expect(po.complete().ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.COMPLETED);
  });
});
