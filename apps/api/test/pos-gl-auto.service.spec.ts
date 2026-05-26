/**
 * pos-gl-auto.service.spec.ts
 *
 * Unit tests for PosGlAutoListener (extracted from PosGlAutoService in Wave 4).
 * @workspace/db (drizzle) and GlPostingLogRepository are fully mocked.
 */

// ─── Mock @workspace/db ───────────────────────────────────────────────────────
// jest.config maps  ^@workspace/db$  →  <rootDir>/../../lib/db/dist/cjs/index.js
// We mock that resolved path so the listener's import is intercepted.

const mockSelect = jest.fn();
const mockFrom   = jest.fn();
const mockWhere  = jest.fn();

jest.mock('../../../lib/db/dist/cjs/index.js', () => {
  return {
    db:               { select: mockSelect },
    eq:               jest.fn((_col: unknown, _val: unknown) => ({})),
    posMovements:     { id: 'id', movementType: 'movementType' },
    posMovementLines: { movementId: 'movementId', quantity: 'quantity', unitPrice: 'unitPrice' },
  };
}, { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PosGlAutoListener } from '../src/modules/pos/application/event-handlers/pos-gl-auto.listener';
import { GlPostingLogRepository } from '../src/modules/pos/infrastructure/repositories/gl-posting-log.repository';
import { PosMovementCompletedEvent } from '../src/modules/pos/domain/events/pos-movement-completed.event';

// ─── Helper types ─────────────────────────────────────────────────────────────

type GlLogInsertData = {
  movementId:  number;
  stage:       number;
  stageName:   string;
  status:      string;
  glEntries:   Array<{ accountCode: string; debit: number; credit: number }>;
  processedAt: Date;
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_PAYLOAD = {
  movementId:     1001,
  movementNumber: 'MOV-2024-001',
  oldStatus:      'DRAFT',
  newStatus:      'COMPLETED',
  updatedById:    5,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PosGlAutoService', () => {
  let listener: PosGlAutoListener;
  let glRepo:   jest.Mocked<GlPostingLogRepository>;
  let emitter:  jest.Mocked<EventEmitter2>;

  // Drizzle fluent chain mocks are reset each test
  function mockDb(movementType: string, lines: Array<{ quantity: number; unitPrice: number }>) {
    // First select → from → where resolves movement row
    mockSelect.mockReturnValueOnce({ from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ movementType }]),
    }) });
    // Second select → from → where resolves movement lines
    mockSelect.mockReturnValueOnce({ from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(lines),
    }) });
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    glRepo = {
      insertLog:         jest.fn(),
      getByMovement:     jest.fn(),
      getPendingEntries: jest.fn(),
      approveEntry:      jest.fn(),
      rejectEntry:       jest.fn(),
      approveByMovement: jest.fn(),
      getJournal:        jest.fn(),
    } as jest.Mocked<GlPostingLogRepository>;

    emitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosGlAutoListener,
        { provide: GlPostingLogRepository, useValue: glRepo },
        { provide: EventEmitter2,          useValue: emitter },
      ],
    }).compile();

    listener = module.get<PosGlAutoListener>(PosGlAutoListener);
  });

  // ─── GL entry count per movement type ──────────────────────────────────────

  it('should create correct GL entries for EXTERNAL_IN (4 entries: karantin + main warehouse)', async () => {
    mockDb('EXTERNAL_IN', [{ quantity: 10, unitPrice: 100 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 1 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    expect(glRepo.insertLog).toHaveBeenCalledTimes(1);
    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.glEntries).toHaveLength(4); // EXTERNAL_IN has 4 entries
    // First entry: debit account 2110
    expect(arg.glEntries[0].accountCode).toBe('2110');
    expect(arg.glEntries[0].debit).toBe(1000); // 10 * 100
    expect(arg.glEntries[0].credit).toBe(0);
  });

  it('should create correct GL entries for EXTERNAL_OUT (4 entries: revenue + COGS)', async () => {
    mockDb('EXTERNAL_OUT', [{ quantity: 5, unitPrice: 200 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 2 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.glEntries).toHaveLength(4);
    const codes = arg.glEntries.map((e: { accountCode: string }) => e.accountCode);
    expect(codes).toContain('9010'); // Daromad (revenue)
    expect(codes).toContain('9110'); // COGS
  });

  it('should create correct GL entries for INTERNAL_ISSUE (2 entries)', async () => {
    mockDb('INTERNAL_ISSUE', [{ quantity: 3, unitPrice: 50 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 3 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.glEntries).toHaveLength(2);
    expect(arg.glEntries[0].accountCode).toBe('8100'); // Bo'lim xarajati debit
    expect(arg.glEntries[1].accountCode).toBe('1410'); // Asosiy Ombor credit
  });

  it('should create correct GL entries for DAMAGE (2 entries)', async () => {
    mockDb('DAMAGE', [{ quantity: 2, unitPrice: 75 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 4 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.glEntries).toHaveLength(2);
    expect(arg.glEntries[0].accountCode).toBe('8910'); // Zarar debit
    expect(arg.glEntries[1].accountCode).toBe('1410'); // Asosiy Ombor credit
  });

  it('should create correct GL entries for INTERNAL_RETURN (2 entries)', async () => {
    mockDb('INTERNAL_RETURN', [{ quantity: 4, unitPrice: 25 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 5 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.glEntries).toHaveLength(2);
    expect(arg.glEntries[0].accountCode).toBe('1410'); // Asosiy Ombor debit
    expect(arg.glEntries[1].accountCode).toBe('8100'); // Bo'lim xarajati credit
  });

  // ─── Total value calculation ────────────────────────────────────────────────

  it('should calculate correct total value from movement lines (qty * unitPrice)', async () => {
    // 3 lines: (2*100) + (5*50) + (1*200) = 200 + 250 + 200 = 650
    mockDb('INTERNAL_ISSUE', [
      { quantity: 2, unitPrice: 100 },
      { quantity: 5, unitPrice: 50  },
      { quantity: 1, unitPrice: 200 },
    ]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 6 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    // Every GL entry for INTERNAL_ISSUE should carry the total of 650
    expect(arg.glEntries[0].debit).toBe(650);
    expect(arg.glEntries[1].credit).toBe(650);
  });

  it('should handle zero-value lines (no NaN, no Infinity)', async () => {
    mockDb('DAMAGE', [
      { quantity: 0, unitPrice: 0 },
    ]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 7 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(isFinite(arg.glEntries[0].debit)).toBe(true);
    expect(arg.glEntries[0].debit).toBe(0);
  });

  // ─── Status ────────────────────────────────────────────────────────────────

  it('should set status AWAITING_REVIEW for all GL log entries', async () => {
    mockDb('INTERNAL_ISSUE', [{ quantity: 1, unitPrice: 10 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 8 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    const arg = glRepo.insertLog.mock.calls[0][0] as GlLogInsertData;
    expect(arg.status).toBe('AWAITING_REVIEW');
    expect(arg.stage).toBe(5);
    expect(arg.stageName).toBe('POST');
  });

  // ─── Event emission ────────────────────────────────────────────────────────

  it('should emit pos.gl.auto_posted event on success', async () => {
    mockDb('INTERNAL_ISSUE', [{ quantity: 10, unitPrice: 50 }]);
    glRepo.insertLog.mockResolvedValue({ ok: true, data: { id: 99 } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    expect(emitter.emit).toHaveBeenCalledWith('pos.gl.auto_posted', expect.objectContaining({
      movementId:   BASE_PAYLOAD.movementId,
      movementType: 'INTERNAL_ISSUE',
      totalValue:   500, // 10 * 50
      glLogId:      99,
    }));
  });

  it('should not emit event when glRepo.insertLog returns Err', async () => {
    mockDb('INTERNAL_ISSUE', [{ quantity: 1, unitPrice: 10 }]);
    glRepo.insertLog.mockResolvedValue({ ok: false, error: { code: 'DB_ERROR', message: 'insert failed' } } as never);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  // ─── Error handling (non-blocking) ─────────────────────────────────────────

  it('should not throw on error (non-blocking async handler)', async () => {
    // db.select throws unexpectedly
    mockSelect.mockImplementationOnce(() => { throw new Error('Unexpected DB crash'); });

    // Must resolve without throwing
    await expect(listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }))).resolves.toBeUndefined();
    expect(glRepo.insertLog).not.toHaveBeenCalled();
  });

  it('should not throw when movement is not found in DB', async () => {
    // Movement select returns empty array
    mockSelect.mockReturnValueOnce({ from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),  // no movement found
    }) });

    await expect(listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }))).resolves.toBeUndefined();
    expect(glRepo.insertLog).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  // ─── Unknown movement type ─────────────────────────────────────────────────

  it('should skip if movement type has no GL mapping', async () => {
    mockDb('UNKNOWN_TYPE', [{ quantity: 5, unitPrice: 10 }]);

    await listener.handle(new PosMovementCompletedEvent({ ...BASE_PAYLOAD }));

    // No insertLog call because no GL pair found for UNKNOWN_TYPE
    expect(glRepo.insertLog).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
