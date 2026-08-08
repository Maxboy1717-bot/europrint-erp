/**
 * test/iot/iot-tablet-idempotency.spec.ts
 *
 * VISION-3340 #38: the three offline-tablet mutations (defect → downtime_events,
 * inline-QC → inline_qc_checks, material-return → material_movements) had no dedup
 * key, so an offline tablet re-submitting after a network retry double-applied the
 * mutation (double defect count / duplicate QC row / duplicate stock credit). The fix
 * adds an OPTIONAL (tablet_id, local_seq_no) idempotency key: when BOTH are supplied
 * the endpoint probes `SELECT 1 ... WHERE tablet_id=? AND local_seq_no=?` before
 * inserting and, on a hit, returns an idempotent success WITHOUT re-inserting or
 * re-running any downstream side effect.
 *
 * This spec replays the exact parameterised SQL the controller sends (via drizzle-orm's
 * real PgDialect — same conversion Drizzle performs before handing the query to the pg
 * driver, no hand-rolled string parsing) against a recording fake and proves, for each
 * endpoint:
 *   (a) with tabletId+localSeqNo AND an already-persisted row, the INSERT / transaction
 *       is NOT run again and no downstream command / stock credit fires (idempotent skip).
 *   (b) WITHOUT the idempotency fields, the normal INSERT path still runs unchanged.
 *   (c) when inserting, the INSERT statement now carries tablet_id / local_seq_no columns.
 */

// Mock @shared/db before importing the controller so its module-level `import { db }` is intercepted.
jest.mock('@shared/db', () => ({ db: { execute: jest.fn(), transaction: jest.fn() } }));

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { db } from '@shared/db';
import { IotTabletController } from '../../src/modules/iot/presentation/iot-tablet.controller';
import type { IotTabletService } from '../../src/modules/iot/application/iot-tablet.service';
import type { OeeCalculatorService } from '../../src/modules/iot/oee/oee-calculator.service';
import type { EventBus, CommandBus } from '@nestjs/cqrs';
import type { MesBrakLimitRepository } from '../../src/modules/mes/infrastructure/repositories/mes-brak-limit.repo';
import type { I18nService } from 'nestjs-i18n';

const mockExecute = db.execute as jest.Mock;
const mockTransaction = db.transaction as jest.Mock;
const dialect = new PgDialect();

interface Recorded {
  sql: string;
  params: unknown[];
}

interface FakeOptions {
  existingDowntime?: boolean;
  existingInlineQc?: boolean;
  existingMaterialMovement?: boolean;
}

/**
 * Records every parameterised statement the controller emits (probe, INSERT, UPDATE,
 * lookup) and answers the probe SELECTs according to `opts` so a test can simulate an
 * already-persisted (tablet_id, local_seq_no) row.
 */
function buildFakeExecute(recorded: Recorded[], opts: FakeOptions): jest.Mock {
  return jest.fn(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();
    recorded.push({ sql: norm, params });

    if (/^SELECT 1 FROM downtime_events WHERE tablet_id/i.test(norm)) {
      return { rows: opts.existingDowntime ? [{ '?column?': 1 }] : [] };
    }
    if (/^SELECT 1 FROM inline_qc_checks WHERE tablet_id/i.test(norm)) {
      return { rows: opts.existingInlineQc ? [{ '?column?': 1 }] : [] };
    }
    if (/^SELECT 1 FROM material_movements WHERE tablet_id/i.test(norm)) {
      return { rows: opts.existingMaterialMovement ? [{ '?column?': 1 }] : [] };
    }
    if (/^SELECT worker_id FROM production_sessions/i.test(norm)) {
      return { rows: [{ worker_id: 7 }] };
    }
    if (/^SELECT warehouse_id FROM material_cards/i.test(norm)) {
      return { rows: [{ warehouse_id: 5 }] };
    }
    if (/^INSERT INTO material_movements/i.test(norm)) {
      return { rows: [{ id: 1 }] };
    }
    if (/^INSERT INTO inline_qc_checks/i.test(norm)) {
      return { rows: [{ id: 1 }] };
    }
    return { rows: [] };
  });
}

interface ControllerDeps {
  commandBus: { execute: jest.Mock };
  brakLimitRepo: { checkBrakLimit: jest.Mock };
  eventBus: { publish: jest.Mock };
}

function buildController(deps: ControllerDeps): IotTabletController {
  return new IotTabletController(
    {} as IotTabletService,
    {} as OeeCalculatorService,
    deps.eventBus as unknown as EventBus,
    deps.commandBus as unknown as CommandBus,
    deps.brakLimitRepo as unknown as MesBrakLimitRepository,
    {} as I18nService,
  );
}

function findInsert(recorded: Recorded[], table: string): Recorded | undefined {
  return recorded.find((r) => new RegExp(`^INSERT INTO ${table}\\b`, 'i').test(r.sql));
}

describe('IotTabletController — offline-tablet idempotency (VISION-3340 #38)', () => {
  let recorded: Recorded[];
  let deps: ControllerDeps;

  function setup(opts: FakeOptions): IotTabletController {
    // Reset shared module-level mocks so call counts don't bleed across tests.
    mockExecute.mockReset();
    mockTransaction.mockReset();
    recorded = [];
    deps = {
      commandBus: { execute: jest.fn().mockResolvedValue({ ok: true, data: { id: 'qc-1' } }) },
      brakLimitRepo: { checkBrakLimit: jest.fn().mockResolvedValue({ exceeded: false }) },
      eventBus: { publish: jest.fn() },
    };
    const fake = buildFakeExecute(recorded, opts);
    mockExecute.mockImplementation(fake);
    // db.transaction(cb) runs the callback with a tx whose .execute records via the same fake.
    mockTransaction.mockImplementation(async (cb: (tx: { execute: jest.Mock }) => Promise<void>) => {
      await cb({ execute: fake });
    });
    return buildController(deps);
  }

  // ---- reportProductionDefect → downtime_events (transaction path) -------------

  describe('reportProductionDefect (POST production-sessions/:id/defect)', () => {
    it('(a) idempotent skip: an existing (tablet_id, local_seq_no) row does NOT re-run the transaction / QC bridge', async () => {
      const controller = setup({ existingDowntime: true });

      const res = await controller.reportProductionDefect('55', {
        defectCount: 3,
        eventType: 'defect',
        tabletId: 'TAB-01',
        localSeqNo: 9,
      });

      expect(res).toMatchObject({ sessionId: 55, defectCount: 3, reported: true, idempotent: true });
      // No re-insert: the transaction was never opened.
      expect(mockTransaction).not.toHaveBeenCalled();
      // No double side effects: brak-limit check + QC command never fired.
      expect(deps.brakLimitRepo.checkBrakLimit).not.toHaveBeenCalled();
      expect(deps.commandBus.execute).not.toHaveBeenCalled();
      // Only the probe SELECT ran.
      expect(findInsert(recorded, 'downtime_events')).toBeUndefined();
    });

    it('(b)+(c) normal path runs the transaction and the downtime_events INSERT carries tablet_id / local_seq_no', async () => {
      const controller = setup({ existingDowntime: false });

      await controller.reportProductionDefect('55', {
        defectCount: 2,
        eventType: 'defect',
        tabletId: 'TAB-01',
        localSeqNo: 9,
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      const insert = findInsert(recorded, 'downtime_events');
      expect(insert).toBeDefined();
      expect(insert!.sql).toMatch(/tablet_id/);
      expect(insert!.sql).toMatch(/local_seq_no/);
      expect(insert!.params).toEqual(expect.arrayContaining(['TAB-01', 9]));
    });

    it('(b) without idempotency fields the transaction still runs and INSERT persists NULLs for the key', async () => {
      const controller = setup({ existingDowntime: false });

      await controller.reportProductionDefect('55', {
        defectCount: 1,
        eventType: 'defect',
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      const insert = findInsert(recorded, 'downtime_events');
      expect(insert).toBeDefined();
      expect(insert!.sql).toMatch(/tablet_id/);
      // No SELECT 1 probe should have run when the fields are absent.
      expect(recorded.some((r) => /^SELECT 1 FROM downtime_events/i.test(r.sql))).toBe(false);
    });
  });

  // ---- submitInlineQc → inline_qc_checks --------------------------------------

  describe('submitInlineQc (POST production-sessions/:id/inline-qc)', () => {
    it('(a) idempotent skip: existing row does NOT re-insert or re-dispatch the QC command', async () => {
      const controller = setup({ existingInlineQc: true });

      const res = await controller.submitInlineQc('55', {
        sampleSize: 10,
        defectCount: 4,
        tabletId: 'TAB-02',
        localSeqNo: 3,
      });

      expect(res).toMatchObject({ idempotent: true, qcDefectId: null });
      expect(findInsert(recorded, 'inline_qc_checks')).toBeUndefined();
      expect(deps.commandBus.execute).not.toHaveBeenCalled();
    });

    it('(b)+(c) normal path INSERTs into inline_qc_checks carrying tablet_id / local_seq_no', async () => {
      const controller = setup({ existingInlineQc: false });

      await controller.submitInlineQc('55', {
        sampleSize: 10,
        defectCount: 0,
        tabletId: 'TAB-02',
        localSeqNo: 3,
      });

      const insert = findInsert(recorded, 'inline_qc_checks');
      expect(insert).toBeDefined();
      expect(insert!.sql).toMatch(/tablet_id/);
      expect(insert!.sql).toMatch(/local_seq_no/);
      expect(insert!.params).toEqual(expect.arrayContaining(['TAB-02', 3]));
    });
  });

  // ---- submitMaterialReturn → material_movements ------------------------------

  describe('submitMaterialReturn (POST production-sessions/:id/material-return)', () => {
    it('(a) idempotent skip: existing row does NOT re-insert or re-credit warehouse stock', async () => {
      const controller = setup({ existingMaterialMovement: true });

      const res = await controller.submitMaterialReturn('55', {
        materialId: 42,
        materialName: 'Karton',
        quantity: 10,
        unit: 'kg',
        performedBy: 7,
        tabletId: 'TAB-03',
        localSeqNo: 1,
      });

      expect(res).toMatchObject({ idempotent: true });
      expect(findInsert(recorded, 'material_movements')).toBeUndefined();
      // The stock-credit path must not have fired either — no warehouse_stock write.
      expect(findInsert(recorded, 'warehouse_stock')).toBeUndefined();
      expect(recorded.some((r) => /^SELECT warehouse_id FROM material_cards/i.test(r.sql))).toBe(false);
    });

    it('(b) without idempotency fields the normal INSERT path still runs (no probe)', async () => {
      const controller = setup({ existingMaterialMovement: false });

      await controller.submitMaterialReturn('55', {
        materialId: 42,
        materialName: 'Karton',
        quantity: 10,
        unit: 'kg',
        performedBy: 7,
      });

      expect(findInsert(recorded, 'material_movements')).toBeDefined();
      expect(recorded.some((r) => /^SELECT 1 FROM material_movements/i.test(r.sql))).toBe(false);
    });

    it('(c) INSERT INTO material_movements carries tablet_id / local_seq_no columns and values', async () => {
      const controller = setup({ existingMaterialMovement: false });

      await controller.submitMaterialReturn('55', {
        materialId: 42,
        materialName: 'Karton',
        quantity: 10,
        unit: 'kg',
        performedBy: 7,
        tabletId: 'TAB-03',
        localSeqNo: 1,
      });

      const insert = findInsert(recorded, 'material_movements');
      expect(insert).toBeDefined();
      expect(insert!.sql).toMatch(/tablet_id/);
      expect(insert!.sql).toMatch(/local_seq_no/);
      expect(insert!.params).toEqual(expect.arrayContaining(['TAB-03', 1]));
    });
  });
});
