/**
 * test/iot/iot-main.controller.downtime-reason-codes.spec.ts
 *
 * VISION-3340 16.60/16.61: the shop-floor tablet downtime dialog reads its reason
 * picker from GET /api/iot/downtime-reason-codes (IotMainController.getDowntimeReasonCodes).
 * That reader used to `SELECT * FROM downtime_reason_codes` — a table with 0 rows and the
 * wrong columns (name/name_ru, not labelUz/labelRu) — so the dropdown was ALWAYS empty and
 * the (disabled-until-a-reason-is-picked) submit button made downtime un-submittable from the
 * tablet. The fix repoints the reader to the LIVE mes_downtime_reasons catalog (16 rows),
 * mirroring legacy-iot.service.ts getIotTabletDefectReasons, and returns a BARE ARRAY the FE
 * maps over directly.
 *
 * This spec renders the exact SQL the controller sends (via drizzle-orm's real PgDialect)
 * against a recording fake and proves:
 *   (a) the query targets mes_downtime_reasons (NOT downtime_reason_codes as the primary FROM).
 *   (b) it projects the FE-shaped columns: id, labelUz, labelRu, stage.
 *   (c) the response is the bare rows array (not a { items, total } object).
 *   (d) a missing/undefined rows field degrades to [] (Rule 2 array safety).
 */

// Mock @shared/db before importing the controller so its module-level `import { db }` is intercepted.
jest.mock('@shared/db', () => ({ db: { execute: jest.fn(), transaction: jest.fn() } }));

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { db } from '@shared/db';
import { IotMainController } from '../../src/modules/iot/presentation/iot-main.controller';
import type { IotMainService } from '../../src/modules/iot/application/iot-main.service';
import type { IotSensorsExtendedService } from '../../src/modules/iot/application/iot-sensors-extended.service';

const mockExecute = db.execute as jest.Mock;
const dialect = new PgDialect();

interface Recorded {
  sql: string;
  params: unknown[];
}

/** The 16 live catalog rows come back in the FE-facing shape. */
const FAKE_ROWS = [
  { id: 17, code: 'DT-HYDR', labelUz: 'Gidravlika nosozligi', labelRu: 'Gidravlika nosozligi', stage: 'breakdown' },
  { id: 3, code: 'DT-MAT', labelUz: 'Material tugashi', labelRu: 'Material tugashi', stage: 'material' },
];

function buildFakeExecute(recorded: Recorded[], rowsField: unknown): jest.Mock {
  return jest.fn(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();
    recorded.push({ sql: norm, params });
    return { rows: rowsField };
  });
}

function buildController(): IotMainController {
  return new IotMainController(
    {} as IotMainService,
    {} as IotSensorsExtendedService,
  );
}

describe('IotMainController.getDowntimeReasonCodes — live catalog repoint (VISION-3340 16.60/16.61)', () => {
  let recorded: Recorded[];

  function setup(rowsField: unknown): IotMainController {
    mockExecute.mockReset();
    recorded = [];
    mockExecute.mockImplementation(buildFakeExecute(recorded, rowsField));
    return buildController();
  }

  it('(a) queries mes_downtime_reasons, NOT the empty downtime_reason_codes as primary FROM', async () => {
    const controller = setup(FAKE_ROWS);
    await controller.getDowntimeReasonCodes();

    expect(recorded).toHaveLength(1);
    const { sql } = recorded[0];
    // Repoint proof: FROM the live catalog.
    expect(sql).toMatch(/FROM mes_downtime_reasons/i);
    // The old, broken target must NOT be the primary FROM (a LEFT JOIN to it for the
    // RU fallback is allowed, but never `FROM downtime_reason_codes`).
    expect(sql).not.toMatch(/FROM downtime_reason_codes/i);
    // Mirrors the legacy-iot defect-reasons RU fallback join.
    expect(sql).toMatch(/LEFT JOIN downtime_reason_codes/i);
  });

  it('(b) projects the FE-shaped columns id / labelUz / labelRu / stage', async () => {
    const controller = setup(FAKE_ROWS);
    await controller.getDowntimeReasonCodes();

    const { sql } = recorded[0];
    expect(sql).toMatch(/"labelUz"/);
    expect(sql).toMatch(/"labelRu"/);
    expect(sql).toMatch(/as stage/i);
    // id is carried so the FE Select value can map to a mes_downtime_reasons id.
    expect(sql).toMatch(/dr\.id\s+AS id/i);
  });

  it('(c) returns the BARE ROWS ARRAY (not a { items, total } object) so the FE can map over it', async () => {
    const controller = setup(FAKE_ROWS);
    const res = await controller.getDowntimeReasonCodes();

    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(2);
    expect(res[0]).toMatchObject({ id: 17, code: 'DT-HYDR', labelUz: expect.any(String) });
  });

  it('(d) degrades to [] when the driver returns no rows field (Rule 2 array safety)', async () => {
    const controller = setup(undefined);
    const res = await controller.getDowntimeReasonCodes();

    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(0);
  });
});
