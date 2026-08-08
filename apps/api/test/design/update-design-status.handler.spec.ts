/**
 * test/design/update-design-status.handler.spec.ts
 * Unit tests for UpdateDesignStatusHandler. IDesignRepo + EventBus mocked; DesignOrder real.
 */

// Pre-existing hoisting fix (unrelated to A8): jest.mock() factories may only
// reference out-of-scope vars whose name starts with "mock" (case-insensitive).
// `_uuidCnt` didn't qualify, so this suite failed to load at all before this
// rename — no test in this file, old or new, could ever run.
let mockUuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++mockUuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UpdateDesignStatusHandler } from '../../src/modules/design/application/commands/update-design-status.handler';
import { UpdateDesignStatusCommand } from '../../src/modules/design/application/commands/update-design-status.command';
import { DESIGN_REPO } from '../../src/modules/design/domain/repositories/i-design.repo';
import { DesignOrder } from '../../src/modules/design/domain/aggregates/design-order.aggregate';
import { DesignStatus } from '../../src/modules/design/domain/enums/design-status.enum';
import { DesignApprovedEvent } from '../../src/modules/design/domain/events';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
interface BusMock { publish: jest.Mock }

function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}
function makeBus(): BusMock { return { publish: jest.fn() }; }

// Real DesignStatus vocabulary (new/ai_generated/designer_review/
// waiting_customer_approval/approved/rejected/revision_requested) — matches
// DESIGN_TRANSITIONS as fixed in A8 (2026-07-05). The previous version of this
// spec used a placeholder vocabulary (not_started/in_progress/review/completed)
// that never matched DesignOrder.status in production.
function makeOrder(status: string = DesignStatus.AI_GENERATED): DesignOrder {
  const o = DesignOrder.create(1, 2, 'desc', 99);
  o.status = status as DesignStatus;
  return o;
}

describe('UpdateDesignStatusHandler', () => {
  let handler: UpdateDesignStatusHandler;
  let repo: RepoMock;
  let bus: BusMock;

  beforeEach(async () => {
    repo = makeRepo();
    bus = makeBus();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDesignStatusHandler,
        { provide: DESIGN_REPO, useValue: repo },
        { provide: EventBus, useValue: bus },
      ],
    }).compile();
    handler = moduleRef.get(UpdateDesignStatusHandler);
  });

  it('returns NOT_FOUND when design order does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new UpdateDesignStatusCommand('missing', 'designer_review', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns INTERNAL when status transition is invalid for current state', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder(DesignStatus.NEW)));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'approved', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/cannot transition/i);
  });

  it('applies status and persists when transition is allowed', async () => {
    const o = makeOrder(DesignStatus.AI_GENERATED);
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'designer_review', 'u1'));

    expect(r.ok).toBe(true);
    expect(o.status).toBe('designer_review');
  });

  it('stamps approvedAt when status transitions to approved', async () => {
    const o = makeOrder(DesignStatus.WAITING_CUSTOMER_APPROVAL);
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    await handler.execute(new UpdateDesignStatusCommand('id', 'approved', 'u1'));

    expect(o.approvedAt).not.toBeNull();
  });

  it('joins file URLs into aiGeneratedDesign when files array is provided', async () => {
    const o = makeOrder(DesignStatus.AI_GENERATED);
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    await handler.execute(new UpdateDesignStatusCommand('id', 'designer_review', 'u1', ['a.png', 'b.png']));

    expect(o.aiGeneratedDesign).toBe('a.png,b.png');
  });

  it('propagates repo error when update fails', async () => {
    const o = makeOrder(DesignStatus.AI_GENERATED);
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'designer_review', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  // --- Golden-thread (A8, 2026-07-05): AIDesignGenerator.tsx now calls this
  // handler's route (PATCH design/:id/status) instead of the unvalidated
  // design-extended shortcut. Prove that reaching "approved" through the
  // validated path publishes DesignApprovedEvent, which PP's
  // DesignApprovedTrigger5Listener (design-lab-join.service.ts) consumes to
  // drive sales_orders.master_status -> 'pending_technology'.
  describe('golden thread: Trigger 5 (design approved -> PP signal)', () => {
    it('publishes DesignApprovedEvent with designOrderId + salesOrderId when transitioning to approved', async () => {
      const o = makeOrder(DesignStatus.WAITING_CUSTOMER_APPROVAL);
      o.id = 'design-order-77';
      o.salesOrderId = 4242;
      repo.findById.mockResolvedValue(Ok(o));
      repo.update.mockResolvedValue(Ok(o));

      const r = await handler.execute(new UpdateDesignStatusCommand('design-order-77', 'approved', 'u1'));

      expect(r.ok).toBe(true);
      expect(bus.publish).toHaveBeenCalledTimes(1);
      const published = bus.publish.mock.calls[0][0] as DesignApprovedEvent;
      expect(published).toBeInstanceOf(DesignApprovedEvent);
      expect(published.designOrderId).toBe('design-order-77');
      expect(published.salesOrderId).toBe(4242);
    });

    it('also fires on the ai_generated -> approved fast path used by AIDesignGenerator.tsx', async () => {
      // Mirrors the real UI flow: AIDesignGeneratorResults "approve" button
      // fires right after generation (status=ai_generated), skipping the
      // manual designer_review/waiting_customer_approval steps.
      const o = makeOrder(DesignStatus.AI_GENERATED);
      repo.findById.mockResolvedValue(Ok(o));
      repo.update.mockResolvedValue(Ok(o));

      const r = await handler.execute(new UpdateDesignStatusCommand('id', 'approved', 'u1'));

      expect(r.ok).toBe(true);
      expect(bus.publish).toHaveBeenCalledTimes(1);
      expect(bus.publish.mock.calls[0][0]).toBeInstanceOf(DesignApprovedEvent);
    });

    it('does NOT publish DesignApprovedEvent for non-approved transitions', async () => {
      const o = makeOrder(DesignStatus.AI_GENERATED);
      repo.findById.mockResolvedValue(Ok(o));
      repo.update.mockResolvedValue(Ok(o));

      await handler.execute(new UpdateDesignStatusCommand('id', 'designer_review', 'u1'));

      expect(bus.publish).not.toHaveBeenCalled();
    });

    it('does NOT publish DesignApprovedEvent when the transition is rejected', async () => {
      const o = makeOrder(DesignStatus.NEW);
      repo.findById.mockResolvedValue(Ok(o));

      const r = await handler.execute(new UpdateDesignStatusCommand('id', 'approved', 'u1'));

      expect(r.ok).toBe(false);
      expect(bus.publish).not.toHaveBeenCalled();
    });
  });
});
