/**
 * test/mes/mes-shift-handover-status.spec.ts
 *
 * Owner-decisions batch item 5 (accepted-status set): shift_handovers has two writers of
 * the same base table — the IoT tablet accept-path writes status='completed', but the MES
 * confirmShiftHandover wrote status='confirmed', splitting the terminal vocabulary. Unified
 * to the canonical 'completed'. This renders the emitted UPDATE and asserts it now sets
 * 'completed' (and no longer 'confirmed'). (The shift-id wiring half of item 5 is blocked
 * on an empty shifts master table — flagged separately, not built here.)
 */

import { PgDialect } from 'drizzle-orm/pg-core';

const runQuery = jest.fn().mockResolvedValue({ rows: [{ id: 1, status: 'completed' }] });
jest.mock('@shared/db', () => ({ db: {}, runQuery }));

import { MesShiftsStatsRepository } from '../../src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo';

describe('MesShiftsStatsRepository.confirmShiftHandover — canonical accepted-status (item 5)', () => {
  const repo = new MesShiftsStatsRepository();
  beforeEach(() => runQuery.mockClear());

  it("sets status='completed' (not 'confirmed') on accept", async () => {
    await repo.confirmShiftHandover(1, 20, 'sig-data');
    expect(runQuery).toHaveBeenCalledTimes(1);
    const rendered = new PgDialect().sqlToQuery(runQuery.mock.calls[0][0]).sql;
    expect(rendered).toMatch(/update\s+shift_handovers/i);
    expect(rendered).toMatch(/status\s*=\s*'completed'/i);
    expect(rendered).not.toMatch(/status\s*=\s*'confirmed'/i);
    // guard preserved: only flips a pending row
    expect(rendered).toMatch(/status\s*=\s*'pending'/i);
  });
});
