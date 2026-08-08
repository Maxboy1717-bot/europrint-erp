/**
 * test/iot/drizzle-iot-oee.repo.spec.ts
 *
 * Unit tests for DrizzleIotOeeRepo.findOee() (EP-IOT-014 fix).
 *
 * Availability used to be a sensor-reading proxy (`iot_sensor_readings.value::float > 80`
 * share of readings) — no relationship to real machine uptime. It is now computed from the
 * real GSD timing columns on `production_sessions` (verified live via information_schema):
 *
 *   Availability = (running_time_seconds − stopped_time_seconds − setup_seconds)
 *                  / NULLIF(running_time_seconds − stopped_time_seconds, 0)
 *
 * grouped by work-center (equipment → work_centers chain, since
 * production_sessions.work_center_id is unpopulated).
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { runQuery } from '@shared/db';
import { DrizzleIotOeeRepo } from '../../src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo';

// Recursively flattens a drizzle-orm SQL object into plain text. A conditional
// fragment (e.g. the device_id filter) is interpolated as a NESTED SQL object,
// not a plain string chunk, so a shallow (non-recursive) flatten would silently
// drop it — recursing into any nested `.queryChunks` is required to see it.
function sqlTextOf(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const withParts = node as { value?: string[]; queryChunks?: unknown[] };
  if (Array.isArray(withParts.value)) return withParts.value.join('');
  if (Array.isArray(withParts.queryChunks)) return withParts.queryChunks.map(sqlTextOf).join('');
  return '';
}

describe('DrizzleIotOeeRepo.findOee', () => {
  let repo: DrizzleIotOeeRepo;

  beforeEach(() => {
    repo = new DrizzleIotOeeRepo();
    (runQuery as jest.Mock).mockReset();
  });

  it('returns Ok with an empty devices array when no equipment rows exist', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });

    const result = await repo.findOee(undefined, 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ period_days: 7, devices: [] });
    }
  });

  it('queries production_sessions timing columns grouped by work-center, not the sensor-reading proxy', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });

    await repo.findOee(undefined, 7);

    const sqlText = sqlTextOf((runQuery as jest.Mock).mock.calls[0][0]);
    // Real GSD timing columns drive Availability now.
    expect(sqlText).toMatch(/running_time_seconds/);
    expect(sqlText).toMatch(/stopped_time_seconds/);
    expect(sqlText).toMatch(/setup_seconds/);
    expect(sqlText).toMatch(/production_sessions/);
    // Grouped by the equipment → work_centers chain.
    expect(sqlText).toMatch(/work_centers/);
    expect(sqlText).toMatch(/GROUP BY/);
    // The old sensor-reading proxy must be fully gone from this query.
    expect(sqlText).not.toMatch(/iot_sensor_readings/);
    expect(sqlText).not.toMatch(/value::float\s*>\s*80/);
  });

  it('computes availability_pct with the exact Availability formula (running − stopped − setup) / (running − stopped)', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        {
          work_center_id: 5,
          work_center_name: 'Offset bosma (1-mashina)',
          session_count: '1',
          running_time_seconds: '26208',
          stopped_time_seconds: '2592',
          setup_seconds: '2000',
          // (26208 - 2592 - 2000) / (26208 - 2592) = 21616 / 23616 = 91.5%
          availability_pct: '91.5',
        },
      ],
    });

    const result = await repo.findOee(undefined, 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const devices = (result.data as { devices: Array<Record<string, unknown>> }).devices;
      expect(devices).toHaveLength(1);
      expect(devices[0].availability_pct).toBe(91.5);
    }
  });

  it('guards divide-by-zero: a NULL availability_pct (NULLIF hit) maps to 0, never NaN', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        {
          work_center_id: 9,
          work_center_name: 'Laminatsiya',
          session_count: '1',
          running_time_seconds: '0',
          stopped_time_seconds: '0',
          setup_seconds: '0',
          availability_pct: null,
        },
      ],
    });

    const result = await repo.findOee(undefined, 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const devices = (result.data as { devices: Array<Record<string, unknown>> }).devices;
      expect(devices[0].availability_pct).toBe(0);
      expect(Number.isNaN(devices[0].availability_pct)).toBe(false);
    }
  });

  it('filters to a single machine via the device_id param (equipment.id)', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });

    await repo.findOee('2', 7);

    const sqlText = sqlTextOf((runQuery as jest.Mock).mock.calls[0][0]);
    expect(sqlText).toMatch(/AND e\.id = /);
  });

  it('omits the machine filter when device_id is not a valid number (fail-open, no crash)', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });

    await repo.findOee('not-a-number', 7);

    const sqlText = sqlTextOf((runQuery as jest.Mock).mock.calls[0][0]);
    expect(sqlText).not.toMatch(/AND e\.id = /);
  });

  it('returns Err when the query throws', async () => {
    (runQuery as jest.Mock).mockRejectedValue(new Error('db down'));

    const result = await repo.findOee(undefined, 7);

    expect(result.ok).toBe(false);
  });
});
