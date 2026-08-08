/**
 * test/iot/iot-tablet.controller.setup-checklist.spec.ts
 *
 * VISION-3340 #45 (08-mes#8): the production-session START gate is correctly
 * fail-closed against setup_checklists/checklist_items, but nothing seeded a
 * checklist or let an operator tick items off — so EVERY session was permanently
 * un-startable. This spec proves the new CRUD makes that (unchanged) gate SATISFIABLE:
 *
 *   (1) seedProductionSessionChecklist inserts one setup_checklists row + the fixed
 *       TB-safety item set (idempotent: an existing checklist is returned, not duped).
 *   (2) completeChecklistItem flips is_completed=true / completed_by / completed_at
 *       for a single item by its PK (404 when the item does not exist).
 *   (3) startProductionSession (the gate — UNCHANGED) blocks while a required item is
 *       incomplete or no checklist exists, and proceeds once all required items pass.
 *
 * Same harness as iot-tablet-idempotency.spec.ts: mock @shared/db, replay the exact
 * parameterised SQL through drizzle-orm's real PgDialect against a recording fake.
 */

jest.mock('@shared/db', () => ({ db: { execute: jest.fn(), transaction: jest.fn() } }));

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { db } from '@shared/db';
import { IotTabletController } from '../../src/modules/iot/presentation/iot-tablet.controller';
import { SETUP_CHECKLIST_DEFAULT_ITEMS } from '../../src/modules/iot/presentation/iot-tablet.schemas';
import type { IotTabletService } from '../../src/modules/iot/application/iot-tablet.service';
import type { OeeCalculatorService } from '../../src/modules/iot/oee/oee-calculator.service';
import type { EventBus, CommandBus } from '@nestjs/cqrs';
import type { MesBrakLimitRepository } from '../../src/modules/mes/infrastructure/repositories/mes-brak-limit.repo';
import type { I18nService } from 'nestjs-i18n';

const mockExecute = db.execute as jest.Mock;
const dialect = new PgDialect();

interface Recorded {
  sql: string;
  params: unknown[];
}

interface GateRow {
  title: string;
  is_completed: boolean;
}

interface FakeOptions {
  // seed: an already-persisted checklist for the session (idempotent path)
  existingChecklistId?: number;
  existingItems?: unknown[];
  // toggle: what the UPDATE ... RETURNING yields ([] => 404)
  updateReturns?: unknown[];
  // gate: rows the checklist_items JOIN setup_checklists SELECT yields
  gateRows?: GateRow[];
}

function buildFakeExecute(recorded: Recorded[], opts: FakeOptions): jest.Mock {
  return jest.fn(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();
    recorded.push({ sql: norm, params });

    // -- seed --------------------------------------------------------------
    if (/^SELECT id FROM setup_checklists WHERE session_id/i.test(norm)) {
      return { rows: opts.existingChecklistId ? [{ id: opts.existingChecklistId }] : [] };
    }
    if (/^SELECT \* FROM checklist_items WHERE checklist_id/i.test(norm)) {
      return { rows: opts.existingItems ?? [] };
    }
    if (/^INSERT INTO setup_checklists/i.test(norm)) {
      return { rows: [{ id: 10 }] };
    }
    if (/^INSERT INTO checklist_items/i.test(norm)) {
      return {
        rows: SETUP_CHECKLIST_DEFAULT_ITEMS.map((it, idx) => ({
          id: idx + 1,
          checklist_id: '10',
          title: it.title,
          is_required: true,
          is_completed: false,
        })),
      };
    }
    // -- toggle ------------------------------------------------------------
    if (/^UPDATE checklist_items/i.test(norm)) {
      return { rows: opts.updateReturns ?? [] };
    }
    // -- gate (start) ------------------------------------------------------
    if (/FROM checklist_items ci JOIN setup_checklists sc/i.test(norm)) {
      return { rows: opts.gateRows ?? [] };
    }
    if (/^UPDATE production_sessions/i.test(norm)) {
      return { rows: [{ current_stage: 'setup' }] };
    }
    return { rows: [] };
  });
}

function buildController(): IotTabletController {
  return new IotTabletController(
    {} as IotTabletService,
    {} as OeeCalculatorService,
    { publish: jest.fn() } as unknown as EventBus,
    { execute: jest.fn() } as unknown as CommandBus,
    {} as MesBrakLimitRepository,
    {} as I18nService,
  );
}

function find(recorded: Recorded[], re: RegExp): Recorded | undefined {
  return recorded.find((r) => re.test(r.sql));
}

describe('IotTabletController — setup-checklist CRUD (VISION-3340 #45 / 08-mes#8)', () => {
  let recorded: Recorded[];

  function setup(opts: FakeOptions): IotTabletController {
    mockExecute.mockReset();
    recorded = [];
    mockExecute.mockImplementation(buildFakeExecute(recorded, opts));
    return buildController();
  }

  // ---- (1) SEED ---------------------------------------------------------------

  describe('seedProductionSessionChecklist (POST production-sessions/:id/checklist)', () => {
    it('creates one setup_checklists row + the full fixed TB-safety item set', async () => {
      const controller = setup({});

      const res = await controller.seedProductionSessionChecklist('55', {});

      // setup_checklists row inserted, keyed on the varchar session_id
      const sc = find(recorded, /^INSERT INTO setup_checklists/i);
      expect(sc).toBeDefined();
      expect(sc!.params).toContain('55');

      // checklist_items inserted in ONE statement carrying every default title
      const ci = find(recorded, /^INSERT INTO checklist_items/i);
      expect(ci).toBeDefined();
      for (const it of SETUP_CHECKLIST_DEFAULT_ITEMS) {
        expect(ci!.params).toContain(it.title);
      }
      // checklist_id written as text so it works for a varchar OR integer column
      expect(ci!.params).toContain('10');

      expect(res.seeded).toBe(true);
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items).toHaveLength(SETUP_CHECKLIST_DEFAULT_ITEMS.length);
      expect(res.data.checklistId).toBe(10);
    });

    it('is idempotent — an existing checklist is returned WITHOUT inserting again', async () => {
      const existingItems = [{ id: 1, title: 'Mashina tozaligi tekshirildi', is_completed: false }];
      const controller = setup({ existingChecklistId: 77, existingItems });

      const res = await controller.seedProductionSessionChecklist('55', {});

      expect(find(recorded, /^INSERT INTO setup_checklists/i)).toBeUndefined();
      expect(find(recorded, /^INSERT INTO checklist_items/i)).toBeUndefined();
      // existing items re-read via the varchar checklist_id (varchar = varchar, type-safe)
      expect(find(recorded, /^SELECT \* FROM checklist_items WHERE checklist_id/i)).toBeDefined();
      expect(res.seeded).toBe(false);
      expect(res.data.checklistId).toBe(77);
      expect(res.data.items).toEqual(existingItems);
    });

    it('rejects a non-numeric / non-positive session id', async () => {
      const controller = setup({});
      await expect(controller.seedProductionSessionChecklist('0', {})).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  // ---- (2) TOGGLE -------------------------------------------------------------

  describe('completeChecklistItem (PATCH checklist-items/:id/complete)', () => {
    it('flips is_completed=true + completed_by + completed_at by item PK', async () => {
      const controller = setup({
        updateReturns: [{ id: 3, is_completed: true, completed_by: 7 }],
      });

      const res = await controller.completeChecklistItem('3', { completedBy: 7 });

      const upd = find(recorded, /^UPDATE checklist_items/i);
      expect(upd).toBeDefined();
      expect(upd!.sql).toMatch(/is_completed = true/i);
      expect(upd!.sql).toMatch(/completed_at = NOW\(\)/i);
      expect(upd!.sql).toMatch(/WHERE id =/i);
      // params carry the operator id and the target PK — no int↔varchar comparison
      expect(upd!.params).toEqual(expect.arrayContaining([7, 3]));
      expect(res.data).toMatchObject({ id: 3, is_completed: true, completed_by: 7 });
    });

    it('stores NULL completed_by when the operator id is omitted', async () => {
      const controller = setup({ updateReturns: [{ id: 3, is_completed: true }] });

      await controller.completeChecklistItem('3', {});

      const upd = find(recorded, /^UPDATE checklist_items/i);
      expect(upd!.params).toEqual(expect.arrayContaining([null, 3]));
    });

    it('404s when the item does not exist', async () => {
      const controller = setup({ updateReturns: [] });
      await expect(controller.completeChecklistItem('999', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ---- (3) GATE satisfiability (start endpoint is UNCHANGED) -------------------

  describe('startProductionSession gate (unchanged) is now satisfiable', () => {
    it('BLOCKS (422) while a required item is incomplete', async () => {
      const controller = setup({
        gateRows: [
          { title: 'Mashina tozaligi tekshirildi', is_completed: true },
          { title: 'Himoya vositalari (PPE) kiyilgan', is_completed: false },
        ],
      });
      await expect(controller.startProductionSession('55', {})).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      // gate blocked before it could flip the session to running
      expect(find(recorded, /^UPDATE production_sessions/i)).toBeUndefined();
    });

    it('BLOCKS (422, fail-safe) when no checklist is configured', async () => {
      const controller = setup({ gateRows: [] });
      await expect(controller.startProductionSession('55', {})).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('PASSES and flips the session to running once every required item is complete', async () => {
      const controller = setup({
        gateRows: SETUP_CHECKLIST_DEFAULT_ITEMS.map((it) => ({ title: it.title, is_completed: true })),
      });

      const res = await controller.startProductionSession('55', {});

      expect(res).toMatchObject({ id: 55, status: 'running' });
      expect(find(recorded, /^UPDATE production_sessions/i)).toBeDefined();
    });
  });
});
