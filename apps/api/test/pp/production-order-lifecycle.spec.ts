/**
 * test/pp/production-order-lifecycle.spec.ts
 * Unit tests for the PP production-order lifecycle (EP-PP-082) and the pure
 * priority / queue-ordering / frozen-zone logic (EP-PP-010/058/059/097/025/061).
 *
 * Covers:
 *   - the 7-status transitions incl. the NEW ones (confirm / sendToQc / close / pause / resume)
 *   - the original 5-status happy path still works (Q-46 — no regression)
 *   - invalid transitions return Err('INVALID_TRANSITION')
 *   - priority ordering: ZARUR first, then deadline, then band
 *   - frozen window is never preempted by a new higher-priority order
 */

import {
  ProductionOrder,
  PoStatus,
  canTransition,
} from '../../src/modules/pp/domain/aggregates/production-order.aggregate';
import {
  ProductionPriorityService,
  PoPriority,
  SchedulableOrder,
  PO_PRIORITY_RANK,
} from '../../src/modules/pp/domain/services/production-priority.service';

function newPo(id = 1): ProductionOrder {
  return new ProductionOrder(id, 100, 5, 7, new Date('2026-07-01'), new Date('2026-07-05'));
}

describe('ProductionOrder lifecycle (EP-PP-082)', () => {
  describe('original 5-status happy path (Q-46 — must not break)', () => {
    it('PLANNED → RELEASED → IN_PROGRESS → COMPLETED via legacy methods', () => {
      const po = newPo();
      po.setCheckpointValidated(true);
      expect(po.getStatus()).toBe(PoStatus.PLANNED);

      expect(po.release().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.RELEASED_TO_PRODUCTION);

      expect(po.startProduction().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.IN_PROGRESS);

      expect(po.complete().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.COMPLETED);
    });

    it('release() still requires checkpoint validation', () => {
      const po = newPo();
      const r = po.release();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('CHECKPOINT_REQUIRED');
    });

    it('startProduction() from PLANNED is rejected (NOT_RELEASED)', () => {
      const po = newPo();
      const r = po.startProduction();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('NOT_RELEASED');
    });
  });

  describe('new EP-PP-082 statuses', () => {
    it('PLANNED → CONFIRMED (Tasdiqlangan)', () => {
      const po = newPo();
      expect(po.confirm().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.CONFIRMED);
    });

    it('CONFIRMED → RELEASED (confirmed orders can be released)', () => {
      const po = newPo();
      po.confirm();
      expect(po.transitionTo(PoStatus.RELEASED_TO_PRODUCTION).ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.RELEASED_TO_PRODUCTION);
    });

    it('IN_PROGRESS → IN_QC (Sifatda) → COMPLETED (Tugadi)', () => {
      const po = newPo();
      po.setCheckpointValidated(true);
      po.release();
      po.startProduction();
      expect(po.sendToQc().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.IN_QC);
      expect(po.complete().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.COMPLETED);
    });

    it('COMPLETED → CLOSED (Yopildi) is terminal', () => {
      const po = newPo();
      po.setCheckpointValidated(true);
      po.release();
      po.startProduction();
      po.complete();
      expect(po.close().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.CLOSED);
      // CLOSED is terminal — nothing leaves it
      expect(po.cancel().ok).toBe(false);
      expect(po.transitionTo(PoStatus.IN_PROGRESS).ok).toBe(false);
    });

    it('pause() then resume() (To\'xtatilgan → Jarayonda)', () => {
      const po = newPo();
      po.setCheckpointValidated(true);
      po.release();
      po.startProduction();
      expect(po.pause().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.PAUSED);
      expect(po.resume().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.IN_PROGRESS);
    });

    it('cancel() from PLANNED (Bekor)', () => {
      const po = newPo();
      expect(po.cancel().ok).toBe(true);
      expect(po.getStatus()).toBe(PoStatus.CANCELLED);
    });
  });

  describe('invalid transitions → Err(INVALID_TRANSITION)', () => {
    it('cannot send a PLANNED order to QC', () => {
      const po = newPo();
      const r = po.sendToQc();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('INVALID_TRANSITION');
    });

    it('cannot close an order that is not completed', () => {
      const po = newPo();
      expect(po.close().ok).toBe(false);
    });

    it('cannot resume an order that is not paused', () => {
      const po = newPo();
      expect(po.resume().ok).toBe(false);
    });

    it('cannot transition out of CANCELLED', () => {
      const po = newPo();
      po.cancel();
      expect(po.transitionTo(PoStatus.IN_PROGRESS).ok).toBe(false);
      expect(po.confirm().ok).toBe(false);
    });
  });

  describe('canTransition() table', () => {
    it('allows the documented hops', () => {
      expect(canTransition(PoStatus.PLANNED, PoStatus.CONFIRMED)).toBe(true);
      expect(canTransition(PoStatus.IN_PROGRESS, PoStatus.IN_QC)).toBe(true);
      expect(canTransition(PoStatus.COMPLETED, PoStatus.CLOSED)).toBe(true);
    });
    it('rejects the illegal hops', () => {
      expect(canTransition(PoStatus.PLANNED, PoStatus.COMPLETED)).toBe(false);
      expect(canTransition(PoStatus.CLOSED, PoStatus.IN_PROGRESS)).toBe(false);
      expect(canTransition(PoStatus.CANCELLED, PoStatus.PLANNED)).toBe(false);
    });
  });
});

describe('ProductionPriorityService — ordering & frozen-zone', () => {
  const svc = new ProductionPriorityService();

  function order(over: Partial<SchedulableOrder> & { id: number }): SchedulableOrder {
    return { deadline: new Date('2026-08-01'), ...over };
  }

  describe('priority bands (EP-PP-059)', () => {
    it('ranks Shoshilinch < Yuqori < Oddiy < Past', () => {
      expect(PO_PRIORITY_RANK[PoPriority.SHOSHILINCH]).toBeLessThan(PO_PRIORITY_RANK[PoPriority.YUQORI]);
      expect(PO_PRIORITY_RANK[PoPriority.YUQORI]).toBeLessThan(PO_PRIORITY_RANK[PoPriority.ODDIY]);
      expect(PO_PRIORITY_RANK[PoPriority.ODDIY]).toBeLessThan(PO_PRIORITY_RANK[PoPriority.PAST]);
    });
  });

  describe('buildQueue() — ZARUR first, then deadline, then band (EP-PP-010/058/097)', () => {
    it('floats ZARUR orders to the front regardless of deadline/band', () => {
      const orders = [
        order({ id: 1, deadline: new Date('2026-08-01'), priority: PoPriority.SHOSHILINCH }),
        order({ id: 2, deadline: new Date('2026-09-01'), priority: PoPriority.PAST, isUrgent: true }),
      ];
      const r = svc.buildQueue(orders);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.map((o) => o.id)).toEqual([2, 1]);
    });

    it('orders by earliest deadline when urgency is equal', () => {
      const orders = [
        order({ id: 1, deadline: new Date('2026-08-10') }),
        order({ id: 2, deadline: new Date('2026-08-02') }),
        order({ id: 3, deadline: new Date('2026-08-05') }),
      ];
      const r = svc.buildQueue(orders);
      if (r.ok) expect(r.data.map((o) => o.id)).toEqual([2, 3, 1]);
    });

    it('tie-breaks equal deadlines by priority band', () => {
      const d = new Date('2026-08-01');
      const orders = [
        order({ id: 1, deadline: d, priority: PoPriority.PAST }),
        order({ id: 2, deadline: d, priority: PoPriority.SHOSHILINCH }),
        order({ id: 3, deadline: d, priority: PoPriority.ODDIY }),
      ];
      const r = svc.buildQueue(orders);
      if (r.ok) expect(r.data.map((o) => o.id)).toEqual([2, 3, 1]);
    });

    it('handles a non-array input safely', () => {
      const r = svc.buildQueue(undefined as unknown as SchedulableOrder[]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });
  });

  describe('frozen-zone / no-preempt (EP-PP-025/061)', () => {
    it('keeps frozen orders ahead of the flexible segment in committed sequence', () => {
      const orders = [
        order({ id: 10, deadline: new Date('2026-08-20'), isFrozen: true, sequence: 2 }),
        order({ id: 11, deadline: new Date('2026-08-21'), isFrozen: true, sequence: 1 }),
        order({ id: 1, deadline: new Date('2026-08-01'), priority: PoPriority.SHOSHILINCH }),
      ];
      const r = svc.buildQueue(orders);
      // frozen first (by sequence 1,2), THEN the urgent-by-deadline flexible one
      if (r.ok) expect(r.data.map((o) => o.id)).toEqual([11, 10, 1]);
    });

    it('a new ZARUR order does NOT preempt a frozen/running job', () => {
      const queue = svc.buildQueue([
        order({ id: 10, deadline: new Date('2026-08-20'), isFrozen: true, sequence: 1 }),
        order({ id: 11, deadline: new Date('2026-08-25'), isFrozen: true, sequence: 2 }),
        order({ id: 1, deadline: new Date('2026-08-15') }),
      ]);
      expect(queue.ok).toBe(true);
      if (!queue.ok) return;

      const incoming = order({ id: 99, deadline: new Date('2026-08-01'), isUrgent: true });
      const slot = svc.findInsertionSlot(queue.data, incoming);
      expect(slot.ok).toBe(true);
      // earliest legal slot is index 2 — right after the two frozen orders,
      // NEVER 0 (that would preempt a frozen job)
      if (slot.ok) expect(slot.data).toBe(2);
    });

    it('rejects inserting a frozen order directly', () => {
      const r = svc.findInsertionSlot([], order({ id: 5, isFrozen: true }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('CANNOT_INSERT_FROZEN_ORDER');
    });

    it('isWithinFrozenWindow() is true inside the ~3-day horizon', () => {
      const now = new Date('2026-06-19T00:00:00Z');
      expect(svc.isWithinFrozenWindow(new Date('2026-06-21T00:00:00Z'), now)).toBe(true);
      expect(svc.isWithinFrozenWindow(new Date('2026-06-25T00:00:00Z'), now)).toBe(false);
    });
  });
});
