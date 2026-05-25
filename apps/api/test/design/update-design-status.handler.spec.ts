/**
 * test/design/update-design-status.handler.spec.ts
 * Unit tests for UpdateDesignStatusHandler. IDesignRepo + EventBus mocked; DesignOrder real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
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
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
interface BusMock { publish: jest.Mock }

function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}
function makeBus(): BusMock { return { publish: jest.fn() }; }

function makeOrder(status: string = 'in_progress'): DesignOrder {
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

    const r = await handler.execute(new UpdateDesignStatusCommand('missing', 'review', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns INTERNAL when status transition is invalid for current state', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder('not_started')));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'completed', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/cannot transition/i);
  });

  it('applies status and persists when transition is allowed', async () => {
    const o = makeOrder('in_progress');
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'review', 'u1'));

    expect(r.ok).toBe(true);
    expect(o.status).toBe('review');
  });

  it('stamps approvedAt when status transitions to completed', async () => {
    const o = makeOrder('approved');
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    await handler.execute(new UpdateDesignStatusCommand('id', 'completed', 'u1'));

    expect(o.approvedAt).not.toBeNull();
  });

  it('joins file URLs into aiGeneratedDesign when files array is provided', async () => {
    const o = makeOrder('in_progress');
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Ok(o));

    await handler.execute(new UpdateDesignStatusCommand('id', 'review', 'u1', ['a.png', 'b.png']));

    expect(o.aiGeneratedDesign).toBe('a.png,b.png');
  });

  it('propagates repo error when update fails', async () => {
    const o = makeOrder('in_progress');
    repo.findById.mockResolvedValue(Ok(o));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new UpdateDesignStatusCommand('id', 'review', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
