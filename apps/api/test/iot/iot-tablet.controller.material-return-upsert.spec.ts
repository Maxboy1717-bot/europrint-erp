/**
 * test/iot/iot-tablet.controller.material-return-upsert.spec.ts
 *
 * C-CORRECTNESS-5.3 (2026-07-07): IotTabletController.submitMaterialReturn() used to
 * credit warehouse_stock via a SELECT/UPDATE-else-INSERT — a TOCTOU-prone upsert (two
 * concurrent returns for the SAME warehouse+material pair could both miss the UPDATE
 * and both INSERT, producing duplicate rows or a unique-constraint error). The fix
 * collapses this into a single atomic `INSERT ... ON CONFLICT (warehouse_id,
 * material_id) DO UPDATE` (creditReturnedMaterialToStock, private helper).
 *
 * This spec proves the FIX by faithfully replaying the exact parameterised SQL the
 * controller sends (via drizzle-orm's real PgDialect — no hand-rolled string parsing)
 * against an in-memory `warehouse_stock`/`material_cards` fake that implements genuine
 * Postgres upsert semantics (unique on warehouse_id+material_id):
 *   (a) first call for a NEW (warehouseId, materialId) pair inserts exactly one fresh
 *       row with quantity/available_quantity = the returned amount.
 *   (b) a second call for the SAME pair increments that same row in place (no
 *       duplicate row created, no unique-constraint error) — quantity accumulates.
 */

// Mock @shared/db before importing the controller so its module-level `import { db }` is intercepted.
jest.mock('@shared/db', () => ({ db: { execute: jest.fn() } }));

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
const dialect = new PgDialect();

interface StockRow {
  id: number;
  warehouse_id: number;
  material_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

interface FakeState {
  materialCards: Map<number, { warehouse_id: number; current_stock: number }>;
  warehouseStock: StockRow[];
}

/**
 * Replays the real parameterised SQL text (via drizzle-orm's PgDialect — the SAME
 * conversion Drizzle performs before handing the query to the pg driver) against an
 * in-memory fake that enforces the genuine UNIQUE(warehouse_id, material_id) upsert
 * semantics `warehouse_stock_wh_mat_uniq` provides in real Postgres.
 */
function buildFakeExecute(state: FakeState): jest.Mock {
  let nextStockId = 1;
  return jest.fn(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();

    if (/^SELECT warehouse_id FROM material_cards/i.test(norm)) {
      const materialId = params[0] as number;
      const mc = state.materialCards.get(materialId);
      return { rows: mc ? [{ warehouse_id: mc.warehouse_id }] : [] };
    }

    if (/^INSERT INTO warehouse_stock/i.test(norm)) {
      if (!/ON CONFLICT \(warehouse_id, material_id\)/i.test(norm)) {
        throw new Error('REGRESSION: warehouse_stock write is no longer an atomic ON CONFLICT upsert');
      }
      const [warehouseId, materialId, qty] = params as number[];
      const existing = state.warehouseStock.find(
        (r) => r.warehouse_id === warehouseId && r.material_id === materialId,
      );
      if (existing) {
        // Mirrors real Postgres ON CONFLICT DO UPDATE — same row, incremented in place.
        existing.quantity += qty;
        existing.available_quantity += qty;
      } else {
        state.warehouseStock.push({
          id: nextStockId++,
          warehouse_id: warehouseId,
          material_id: materialId,
          quantity: qty,
          reserved_quantity: 0,
          available_quantity: qty,
        });
      }
      return { rows: [] };
    }

    if (/^UPDATE material_cards SET current_stock/i.test(norm)) {
      const [qty, materialId] = params as number[];
      const mc = state.materialCards.get(materialId);
      if (mc) mc.current_stock += qty;
      return { rows: [] };
    }

    if (/^INSERT INTO material_movements/i.test(norm)) {
      return { rows: [{ id: 1, ...Object.fromEntries(params.map((p, i) => [`p${i}`, p])) }] };
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

describe('IotTabletController.submitMaterialReturn() → warehouse_stock atomic upsert (C-CORRECTNESS-5.3)', () => {
  let state: FakeState;
  let controller: IotTabletController;

  beforeEach(() => {
    state = {
      materialCards: new Map([[42, { warehouse_id: 5, current_stock: 0 }]]),
      warehouseStock: [],
    };
    mockExecute.mockImplementation(buildFakeExecute(state));
    controller = buildController();
  });

  it('(a) first return for a NEW warehouse+material pair INSERTs a fresh warehouse_stock row', async () => {
    await controller.submitMaterialReturn('1', {
      materialId: 42,
      materialName: 'Karton',
      quantity: 10,
      unit: 'kg',
      performedBy: 7,
    });

    expect(state.warehouseStock).toHaveLength(1);
    expect(state.warehouseStock[0]).toMatchObject({
      warehouse_id: 5,
      material_id: 42,
      quantity: 10,
      reserved_quantity: 0,
      available_quantity: 10,
    });
    expect(state.materialCards.get(42)?.current_stock).toBe(10);
  });

  it('(b) second return for the SAME pair increments the existing row — no duplicate, no error', async () => {
    await controller.submitMaterialReturn('1', {
      materialId: 42,
      materialName: 'Karton',
      quantity: 10,
      unit: 'kg',
      performedBy: 7,
    });

    await expect(
      controller.submitMaterialReturn('2', {
        materialId: 42,
        materialName: 'Karton',
        quantity: 5,
        unit: 'kg',
        performedBy: 7,
      }),
    ).resolves.toBeDefined();

    // Still exactly ONE warehouse_stock row for this (warehouse_id, material_id) pair —
    // the TOCTOU-prone version could have produced a second row or thrown a unique-violation.
    expect(state.warehouseStock).toHaveLength(1);
    expect(state.warehouseStock[0]).toMatchObject({
      warehouse_id: 5,
      material_id: 42,
      quantity: 15,
      available_quantity: 15,
    });
    expect(state.materialCards.get(42)?.current_stock).toBe(15);
  });

  it('does not touch warehouse_stock when the material has no home warehouse configured', async () => {
    state.materialCards.set(99, { warehouse_id: 0, current_stock: 0 });

    await controller.submitMaterialReturn('3', {
      materialId: 99,
      materialName: 'No-warehouse material',
      quantity: 4,
      unit: 'kg',
      performedBy: 7,
    });

    expect(state.warehouseStock).toHaveLength(0);
  });
});
