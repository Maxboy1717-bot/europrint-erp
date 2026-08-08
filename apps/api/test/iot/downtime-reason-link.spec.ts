/**
 * test/iot/downtime-reason-link.spec.ts
 *
 * VISION-3340 #44 (08-mes#10): the shop-floor tablet path
 * POST /api/iot/downtime-events (IotTabletController.reportDowntimeEvent) used to write
 * only a free-text `reason_code` and NEVER populated `downtime_events.reason_code_id`
 * (the FK to the LIVE mes_downtime_reasons catalog), so root-cause stats could not group
 * by reason. The fix adds an OPTIONAL `reasonId`: when the operator picks a reason from
 * the live list the tablet sends its mes_downtime_reasons.id, and the endpoint resolves
 * that row to persist reason_code_id (and align reason_code with the catalog code). When
 * reasonId is absent the endpoint behaves exactly as before (free-text reason_code,
 * reason_code_id NULL).
 *
 * This spec replays the exact parameterised SQL the controller sends (via drizzle-orm's
 * real PgDialect) against a recording fake and proves:
 *   (a) reasonId supplied + a matching catalog row -> INSERT carries reason_code_id (the
 *       numeric id) and reason_code overridden to the catalog code.
 *   (b) reasonId absent -> no catalog SELECT, INSERT persists reason_code_id NULL and the
 *       original free-text reason_code (pre-existing behaviour, unchanged).
 *   (c) reasonId supplied but NO matching row -> catalog SELECT runs, INSERT falls back to
 *       reason_code_id NULL + the free-text reason_code.
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
const dialect = new PgDialect();

interface Recorded {
  sql: string;
  params: unknown[];
}

/** A single mes_downtime_reasons row to answer the catalog SELECT with, or null for "no match". */
type CatalogRow = { id: number; code: string } | null;

function buildFakeExecute(recorded: Recorded[], catalogRow: CatalogRow): jest.Mock {
  return jest.fn(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();
    recorded.push({ sql: norm, params });

    if (/^SELECT id, code FROM mes_downtime_reasons WHERE id/i.test(norm)) {
      return { rows: catalogRow ? [catalogRow] : [] };
    }
    if (/^INSERT INTO downtime_events/i.test(norm)) {
      return { rows: [{ id: 1 }] };
    }
    return { rows: [] };
  });
}

function buildController(): IotTabletController {
  return new IotTabletController(
    {} as IotTabletService,
    {} as OeeCalculatorService,
    {} as unknown as EventBus,
    {} as unknown as CommandBus,
    {} as unknown as MesBrakLimitRepository,
    {} as I18nService,
  );
}

function findInsert(recorded: Recorded[]): Recorded | undefined {
  return recorded.find((r) => /^INSERT INTO downtime_events\b/i.test(r.sql));
}

function catalogSelectRan(recorded: Recorded[]): boolean {
  return recorded.some((r) => /^SELECT id, code FROM mes_downtime_reasons/i.test(r.sql));
}

// Column order in the INSERT template => positional params.
// [session_id, event_type, durationMinutes(started_at), duration_seconds,
//  duration_minutes, reason_code, reason_code_id, notes]
const REASON_CODE_PARAM = 5;
const REASON_CODE_ID_PARAM = 6;

describe('IotTabletController.reportDowntimeEvent — live reason link (VISION-3340 #44)', () => {
  let recorded: Recorded[];

  function setup(catalogRow: CatalogRow): IotTabletController {
    mockExecute.mockReset();
    recorded = [];
    mockExecute.mockImplementation(buildFakeExecute(recorded, catalogRow));
    return buildController();
  }

  it('(a) reasonId + matching catalog row: INSERT carries reason_code_id and the catalog code', async () => {
    const controller = setup({ id: 5, code: 'DT-HYDR' });

    const res = await controller.reportDowntimeEvent({
      sessionId: 55,
      eventType: 'manual_entry',
      durationMinutes: 12,
      reasonCode: 'material_shortage', // free text the tablet still sends
      reasonId: 5,
      notes: 'gidravlika',
    });

    // Response shape unchanged: { data: row }.
    expect(res).toMatchObject({ data: { id: 1 } });
    expect(catalogSelectRan(recorded)).toBe(true);

    const insert = findInsert(recorded);
    expect(insert).toBeDefined();
    expect(insert!.sql).toMatch(/reason_code_id/);
    // reason_code overridden to the catalog code; reason_code_id = resolved numeric id.
    expect(insert!.params[REASON_CODE_PARAM]).toBe('DT-HYDR');
    expect(insert!.params[REASON_CODE_ID_PARAM]).toBe(5);
  });

  it('(b) reasonId absent: no catalog SELECT, reason_code_id NULL, free-text reason_code unchanged', async () => {
    const controller = setup(null);

    await controller.reportDowntimeEvent({
      sessionId: 55,
      eventType: 'manual_entry',
      durationMinutes: 8,
      reasonCode: 'material_shortage',
      notes: 'no reason id',
    });

    expect(catalogSelectRan(recorded)).toBe(false);

    const insert = findInsert(recorded);
    expect(insert).toBeDefined();
    expect(insert!.sql).toMatch(/reason_code_id/);
    expect(insert!.params[REASON_CODE_PARAM]).toBe('material_shortage');
    expect(insert!.params[REASON_CODE_ID_PARAM]).toBeNull();
  });

  it('(c) reasonId supplied but no matching row: catalog SELECT runs, falls back to NULL + free-text', async () => {
    const controller = setup(null); // catalog SELECT returns []

    await controller.reportDowntimeEvent({
      sessionId: 55,
      eventType: 'manual_entry',
      durationMinutes: 5,
      reasonCode: 'material_shortage',
      reasonId: 999,
      notes: 'stale id',
    });

    expect(catalogSelectRan(recorded)).toBe(true);

    const insert = findInsert(recorded);
    expect(insert).toBeDefined();
    expect(insert!.params[REASON_CODE_PARAM]).toBe('material_shortage');
    expect(insert!.params[REASON_CODE_ID_PARAM]).toBeNull();
  });
});
