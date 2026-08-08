/**
 * test/pp/production-repository-updateshift.spec.ts
 *
 * Fix-loop item 5: ProductionRepository.updateShiftReport accepted actual_output/reject_qty/
 * downtime_min in its DTO but the UPDATE only ever set worker_notes/status, silently dropping
 * the three quantity fields. They map to real production_sessions columns (actual_quantity,
 * defect_quantity, stopped_time_seconds). This renders the emitted SQL and asserts the SET
 * clause now writes all three — the assertion the mock-repo service test could never make.
 */

import { PgDialect } from 'drizzle-orm/pg-core';

const runQuery = jest.fn().mockResolvedValue({ rows: [{ id: 1 }] });
jest.mock('@shared/db', () => ({ db: {}, runQuery }));

import { ProductionRepository } from '../../src/modules/pp/production/production.repository';

describe('ProductionRepository.updateShiftReport (item 5 — persists actual/reject/downtime)', () => {
  const repo = new ProductionRepository();
  beforeEach(() => runQuery.mockClear());

  it('emits an UPDATE that sets actual_quantity, defect_quantity and stopped_time_seconds', async () => {
    await repo.updateShiftReport(35, { actual_output: 500, reject_qty: 12, downtime_min: 30, notes: 'x' });
    expect(runQuery).toHaveBeenCalledTimes(1);
    const rendered = new PgDialect().sqlToQuery(runQuery.mock.calls[0][0]).sql;
    expect(rendered).toMatch(/update\s+production_sessions/i);
    expect(rendered).toContain('actual_quantity');
    expect(rendered).toContain('defect_quantity');
    expect(rendered).toContain('stopped_time_seconds');
  });

  it('converts downtime_min to seconds (min*60) as a bound param', async () => {
    await repo.updateShiftReport(35, { downtime_min: 30 });
    const { params } = new PgDialect().sqlToQuery(runQuery.mock.calls[0][0]);
    expect(params).toContain(1800); // 30 min * 60
  });
});
