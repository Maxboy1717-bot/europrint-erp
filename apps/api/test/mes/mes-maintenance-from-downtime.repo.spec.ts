/**
 * test/mes/mes-maintenance-from-downtime.repo.spec.ts
 *
 * VISION 08-mes#37 (Avariya remont): MesMaintenanceRepository.createFromDowntime.
 *
 * Proves the CLEAN CORE:
 *   - an EMERGENCY (category='breakdown') downtime auto-opens ONE maintenance task,
 *     linked to an auto-created maintenance request carrying the machine (equipment_id);
 *   - a NON-emergency downtime (any other category) opens NOTHING;
 *   - a duplicate open breakdown task for the same machine is NOT opened twice.
 *
 * @shared/db is mocked per the sibling mes repo tests (runQuery stub). Each runQuery
 * call is stubbed IN ORDER via mockResolvedValueOnce, and we assert on the returned
 * Result plus the number of runQuery calls (inserts only run on the create path).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
  rawSql: jest.fn(),
}));

import { runQuery } from '@shared/db';
import { MesMaintenanceRepository } from '../../src/modules/mes/infrastructure/repositories/mes-maintenance.repo';

const mockRunQuery = runQuery as unknown as jest.Mock;

function makeRepo(): MesMaintenanceRepository {
  return new MesMaintenanceRepository();
}

beforeEach(() => {
  mockRunQuery.mockReset();
});

describe('MesMaintenanceRepository.createFromDowntime', () => {
  it('auto-opens ONE maintenance task for an emergency breakdown downtime', async () => {
    // 1) category lookup → 'breakdown'; 2) dedup → none; 3) insert request; 4) insert task
    mockRunQuery
      .mockResolvedValueOnce({ rows: [{ category: 'breakdown' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 100 }] })
      .mockResolvedValueOnce({ rows: [{ id: 200 }] });

    const repo = makeRepo();
    const res = await repo.createFromDowntime({
      sessionId: 5,
      workCenterId: 7,
      reasonCode: 'DT-HYDR',
      reasonText: 'Gidravlika nosozligi',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toBe(true);
    expect(res.data.outcome).toBe('created');
    expect(res.data.taskId).toBe(200);
    // category + dedup + request insert + task insert = 4 queries
    expect(mockRunQuery).toHaveBeenCalledTimes(4);
  });

  it('also treats the legacy BREAK reason code as an emergency', async () => {
    mockRunQuery
      .mockResolvedValueOnce({ rows: [] }) // code not in live catalog → falls back to BREAK
      .mockResolvedValueOnce({ rows: [] }) // dedup → none
      .mockResolvedValueOnce({ rows: [{ id: 101 }] })
      .mockResolvedValueOnce({ rows: [{ id: 201 }] });

    const repo = makeRepo();
    const res = await repo.createFromDowntime({
      sessionId: 5,
      workCenterId: 7,
      reasonCode: 'BREAK',
      reasonText: null,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toBe(true);
    expect(res.data.taskId).toBe(201);
  });

  it('does NOT open a task for a non-emergency downtime', async () => {
    // category lookup returns a non-breakdown category → gate closes, no inserts
    mockRunQuery.mockResolvedValueOnce({ rows: [{ category: 'material' }] });

    const repo = makeRepo();
    const res = await repo.createFromDowntime({
      sessionId: 5,
      workCenterId: 7,
      reasonCode: 'DT-MAT-WAIT',
      reasonText: 'Materialni kutish',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toBe(false);
    expect(res.data.outcome).toBe('not_emergency');
    expect(res.data.taskId).toBeNull();
    // ONLY the category lookup ran — no dedup, no inserts
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it('does NOT open a second task when one is already open for the same machine', async () => {
    // 1) category → 'breakdown'; 2) dedup → an existing open task (id 55)
    mockRunQuery
      .mockResolvedValueOnce({ rows: [{ category: 'breakdown' }] })
      .mockResolvedValueOnce({ rows: [{ id: 55 }] });

    const repo = makeRepo();
    const res = await repo.createFromDowntime({
      sessionId: 5,
      workCenterId: 7,
      reasonCode: 'DT-SENSOR',
      reasonText: 'Datchik nosozligi',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.created).toBe(false);
    expect(res.data.outcome).toBe('duplicate');
    expect(res.data.taskId).toBe(55);
    // category + dedup only — NO insert queries ran
    expect(mockRunQuery).toHaveBeenCalledTimes(2);
  });

  it('returns Err (never throws) when the DB call fails', async () => {
    mockRunQuery.mockRejectedValueOnce(new Error('db down'));

    const repo = makeRepo();
    const res = await repo.createFromDowntime({
      sessionId: 5,
      workCenterId: 7,
      reasonCode: 'DT-HYDR',
      reasonText: null,
    });

    expect(res.ok).toBe(false);
  });
});
