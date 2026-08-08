/**
 * test/iot/iot-tablet.controller.defect-report-tx.spec.ts
 *
 * 5.2 (CRITICAL-CORRECTNESS-AUDIT): reportProductionDefect() previously ran the
 * production_sessions UPDATE and the downtime_events INSERT as two independent,
 * non-transactional statements — if the INSERT failed, the UPDATE's effect
 * (defect_quantity already bumped) stayed committed, leaving a partial write.
 *
 * Fix: both statements are now wrapped in a single db.transaction(async (tx) => {...})
 * (same convention as procurement-request.service.ts). The QC-bridge command call
 * stays OUTSIDE the transaction on purpose (own try/catch, writes to a different
 * module's table) — these tests also pin that it is unaffected by the tx wrap.
 *
 * Pure unit tests — db.transaction/tx.execute are mocked (no real DB connection),
 * same style as test/pos-movement-transaction.spec.ts. The mock proves the CODE
 * PATTERN: both statements go through the SAME transaction callback, so if the
 * callback throws (2nd statement fails), Postgres/Drizzle rolls back everything
 * the callback already did — including the 1st statement's effect.
 *
 * drizzle-orm's real `sql` tag is used (NOT mocked) — mocking the whole
 * 'drizzle-orm' module breaks unrelated code the controller transitively
 * imports (IotTabletService → drizzle-iot-tablet.repo.ts → typed-execute.ts
 * → schema.ts, which needs the real `isTable`/`pgTable` etc. at import time;
 * a `{ sql: ... }`-only drizzle-orm mock crashes that chain with
 * "drizzleOrm.isTable is not a function"). The real `SQL` class has no
 * `toString()` override (`String(sqlObj)` yields "[object Object]"), so
 * query text is recovered via a `sqlText()` helper that reads the real
 * `queryChunks` array instead — `StringChunk.value` is a string array,
 * `Param.value` (bound `${...}` values) is a scalar, so both shapes are
 * handled explicitly rather than assuming an array (cf.
 * test/pos/warehouse-config.service.receive-stock-transaction.spec.ts, C-5.4,
 * which CAN assume array-only because it fully mocks 'drizzle-orm' itself).
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => {
      const v = (c as { value?: unknown } | undefined)?.value;
      if (Array.isArray(v)) return v.join('');
      if (v !== undefined) return String(v);
      return '';
    })
    .join(' ');
}

const mockTxExecute = jest.fn();
const mockDbTransaction = jest.fn(
  async (fn: (tx: { execute: jest.Mock }) => Promise<unknown>) => fn({ execute: mockTxExecute }),
);
const mockDbExecute = jest.fn().mockResolvedValue({ rows: [] });

jest.mock('@shared/db', () => ({
  db: {
    transaction: mockDbTransaction,
    execute: mockDbExecute,
  },
}));

import { IotTabletController } from '../../src/modules/iot/presentation/iot-tablet.controller';
import type { IotTabletService } from '../../src/modules/iot/application/iot-tablet.service';
import type { OeeCalculatorService } from '../../src/modules/iot/oee/oee-calculator.service';
import type { EventBus, CommandBus } from '@nestjs/cqrs';
import type { MesBrakLimitRepository } from '../../src/modules/mes/infrastructure/repositories/mes-brak-limit.repo';
import type { I18nService } from 'nestjs-i18n';

function makeController(
  overrides: {
    commandBus?: { execute: jest.Mock };
    brakLimitRepo?: { checkBrakLimit: jest.Mock };
  } = {},
) {
  const commandBus = overrides.commandBus ?? {
    execute: jest.fn().mockResolvedValue({ ok: true, data: { id: 'qc-1' } }),
  };
  const brakLimitRepo = overrides.brakLimitRepo ?? {
    checkBrakLimit: jest.fn().mockResolvedValue({ checked: false, limitPct: null, actualBrakPct: null, exceeded: false, notificationCreated: false, disciplineRecordId: null, fineRuleUsed: null }),
  };

  const controller = new IotTabletController(
    {} as IotTabletService,
    {} as OeeCalculatorService,
    { publish: jest.fn() } as unknown as EventBus,
    commandBus as unknown as CommandBus,
    brakLimitRepo as unknown as MesBrakLimitRepository,
    {} as I18nService,
  );
  return { controller, commandBus, brakLimitRepo };
}

describe('IotTabletController.reportProductionDefect() — 5.2 transaction wrap', () => {
  beforeEach(() => {
    mockDbTransaction.mockClear();
    mockTxExecute.mockReset();
    mockDbExecute.mockReset().mockResolvedValue({ rows: [] });
  });

  it('wraps the session UPDATE and downtime_events INSERT in a single db.transaction call', async () => {
    mockTxExecute.mockResolvedValue({ rows: [] });
    const { controller, brakLimitRepo } = makeController();

    await controller.reportProductionDefect('42', { defectCount: 3 });

    expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    expect(mockTxExecute).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = mockTxExecute.mock.calls;
    expect(sqlText(firstCall[0])).toMatch(/UPDATE production_sessions/);
    expect(sqlText(secondCall[0])).toMatch(/INSERT INTO downtime_events/);
    // Downstream steps still run once the transaction has committed.
    expect(brakLimitRepo.checkBrakLimit).toHaveBeenCalledWith(42);
  });

  it('rolls back the session UPDATE when the downtime_events INSERT fails (atomicity)', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] }) // UPDATE production_sessions "succeeds"
      .mockRejectedValueOnce(new Error('downtime_events insert failed')); // INSERT fails
    const { controller, brakLimitRepo, commandBus } = makeController();

    await expect(
      controller.reportProductionDefect('42', { defectCount: 3 }),
    ).rejects.toThrow('downtime_events insert failed');

    // Both statements were attempted inside the SAME transaction callback — since
    // the callback threw before returning, db.transaction's real (Postgres) ROLLBACK
    // semantics undo everything the callback already did, including the UPDATE that
    // "succeeded" moments earlier. Not a partial write.
    expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    expect(mockTxExecute).toHaveBeenCalledTimes(2);

    // Downstream steps (brak-limit check, QC bridge) never run — the failed
    // transaction aborts the request before reaching them.
    expect(brakLimitRepo.checkBrakLimit).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('keeps the QC-bridge call OUTSIDE the transaction — its own failure is swallowed, not rolled back', async () => {
    mockTxExecute.mockResolvedValue({ rows: [] });
    const { controller, commandBus } = makeController({
      commandBus: { execute: jest.fn().mockRejectedValue(new Error('qc bridge down')) },
    });

    const result = await controller.reportProductionDefect('42', { defectCount: 3 });

    // QC-bridge failure is caught by its own try/catch (SB0357) — it does NOT
    // reject the request and does NOT touch the already-committed transaction.
    expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    expect(result.reported).toBe(true);
    expect(result.qcDefectId).toBeNull();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
