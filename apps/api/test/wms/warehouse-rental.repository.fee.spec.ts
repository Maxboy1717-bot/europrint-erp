/**
 * test/wms/warehouse-rental.repository.fee.spec.ts
 *
 * VISION-3340 #56: warehouse-rental fee calculation was never actually computed —
 * total_amount stayed 0 forever (createRecord left it at the DB default and the
 * old closeRecord UPDATE only touched status/closed_by/closed_at, two of which
 * don't even exist in the live table, so the UPDATE always failed at runtime).
 *
 * These tests prove, against the generated SQL (same mock style as
 * drizzle-wms.repo.oversell-guard.spec.ts):
 *   1. closeRecord() computes billable_days = GREATEST(0, (CURRENT_DATE - start)
 *      - free_days) and total_amount = billable_days * daily_rate_per_m2 * area_m2
 *      inside the SAME single UPDATE statement (one round-trip, no SELECT-then-UPDATE),
 *      guards on status = 'active', and no longer references the nonexistent
 *      closed_by / closed_at / managed_by columns.
 *   2. getRecords() overlays the same running-total expression (CURRENT_DATE-based)
 *      over total_days / billable_days / total_amount for 'active' rows while
 *      keeping the frozen stored values for closed/paid rows.
 *   3. getSummary() derives active_value from the live fee expression instead of
 *      summing the (always-0-while-active) stored total_amount.
 */

// NOTE: joined with '' (not ' ' like the sibling spec) — the mock sql tag below
// flattens nested fragments into chunks that already carry their exact text, so a
// '' join reproduces the same SQL string drizzle would send to the server.
function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join('')
    .replace(/\s+/g, ' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args), db: {} }));
// Unlike the sibling oversell-guard mock, this `sql` tag FLATTENS nested sql``
// fragments (the repository composes ELAPSED/BILLABLE/FEE fragments into the
// final statements), so sqlText() sees the fully expanded expression text.
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => {
      const own = [{ value: [s] }];
      if (i >= values.length) return own;
      const v = values[i] as { queryChunks?: { value: string[] }[] } | null;
      if (v && typeof v === 'object' && Array.isArray(v.queryChunks)) return [...own, ...v.queryChunks];
      return [...own, { value: [` ${String(values[i])} `] }];
    }),
  }),
}));

import { WarehouseRentalRepository } from '../../src/modules/wms/infrastructure/repositories/warehouse-rental.repository';

const BILLABLE_EXPR =
  'GREATEST(0, (CURRENT_DATE - COALESCE(wr.start_date, wr.admitted_date::date)) - wr.free_days)';
const FEE_EXPR = `(${BILLABLE_EXPR} * wr.daily_rate_per_m2 * wr.area_m2)::numeric(15,2)`;

describe('WarehouseRentalRepository — VISION-3340 #56 fee calculation', () => {
  let repo: WarehouseRentalRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new WarehouseRentalRepository();
  });

  describe('closeRecord()', () => {
    it('computes billable_days and total_amount in ONE UPDATE statement (single round-trip)', async () => {
      const closedRow = { id: 7, status: 'closed', billable_days: 4, total_amount: '6000.00' };
      mockRunQuery.mockResolvedValue({ rows: [closedRow] });

      const result = await repo.closeRecord(7, 42);

      // Single round-trip: exactly one query, and it is an UPDATE (no prior SELECT).
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).toContain('UPDATE warehouse_rental_records wr SET');
      expect(text).not.toMatch(/^\s*SELECT/);

      // Fee math lives inside the UPDATE itself.
      expect(text).toContain(`billable_days = (${BILLABLE_EXPR})::int`);
      expect(text).toContain(`total_amount = ${FEE_EXPR}`);
      expect(text).toContain(
        'total_days = (GREATEST(0, CURRENT_DATE - COALESCE(wr.start_date, wr.admitted_date::date)))::int',
      );

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(closedRow);
    });

    it('only closes ACTIVE records (frozen fee of an already-closed record is never recomputed)', async () => {
      mockRunQuery.mockResolvedValue({ rows: [{ id: 7 }] });

      await repo.closeRecord(7, 42);

      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).toContain("AND wr.status = 'active'");
      expect(text).toContain("SET status = 'closed'");
      expect(text).toContain('RETURNING *');
    });

    it('does NOT reference columns missing from the live table (closed_by / closed_at / managed_by)', async () => {
      // Live-DB verified 2026-07-08: warehouse_rental_records has no closed_by,
      // closed_at, or managed_by columns — the previous UPDATE referenced
      // closed_by/closed_at and therefore always failed at runtime.
      mockRunQuery.mockResolvedValue({ rows: [{ id: 7 }] });

      await repo.closeRecord(7, 42);

      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).not.toContain('closed_by');
      expect(text).not.toContain('closed_at');
      expect(text).not.toContain('managed_by');
      // Close metadata that DOES exist in the live table:
      expect(text).toContain("closed_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')");
      expect(text).toContain('end_date = CURRENT_DATE');
      expect(text).toContain('last_calculated_at = NOW()');
    });

    it('returns NOT_FOUND when no active record matches the id', async () => {
      mockRunQuery.mockResolvedValue({ rows: [] });

      const result = await repo.closeRecord(999, 42);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('returns Err (not throw) when the DB call fails', async () => {
      mockRunQuery.mockRejectedValue(new Error('connection refused'));

      const result = await repo.closeRecord(7, 42);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain('connection refused');
    });
  });

  describe('getRecords()', () => {
    it('overlays a LIVE running total for active rows and keeps frozen values for closed rows', async () => {
      mockRunQuery.mockResolvedValue({ rows: [{ id: 1, status: 'active' }] });

      const result = await repo.getRecords();

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).toContain('SELECT wr.*,');
      // Same running-total expression as closeRecord, CURRENT_DATE-based.
      expect(text).toContain(
        `CASE WHEN wr.status = 'active' THEN (${BILLABLE_EXPR})::int ELSE wr.billable_days END AS billable_days`,
      );
      expect(text).toContain(
        `CASE WHEN wr.status = 'active' THEN ${FEE_EXPR} ELSE wr.total_amount END AS total_amount`,
      );
      expect(text).toContain('ELSE wr.total_days END AS total_days');
      expect(result.ok).toBe(true);
      if (result.ok) expect(Array.isArray(result.data)).toBe(true);
    });

    it('keeps the status filter AND the running-total projection together', async () => {
      mockRunQuery.mockResolvedValue({ rows: [] });

      await repo.getRecords('active');

      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).toContain('WHERE wr.status =');
      expect(text).toContain('AS total_amount');
      expect(text).toContain('ORDER BY wr.created_at DESC');
    });
  });

  describe('getSummary()', () => {
    it('derives active_value from the live fee expression, not the stored (0-while-active) total_amount', async () => {
      mockRunQuery.mockResolvedValue({
        rows: [{ active_rentals: 2, closed_rentals: 1, active_value: '9000.00', collected: '500.00', outstanding: '0.00' }],
      });

      const result = await repo.getSummary();

      const text = sqlText(mockRunQuery.mock.calls[0][0]);
      expect(text).toContain(
        `COALESCE(SUM(${FEE_EXPR}) FILTER (WHERE wr.status = 'active'), 0)::numeric(15,2) AS active_value`,
      );
      // The old bug: SUM of the stored column for active rows (always 0).
      expect(text).not.toContain("SUM(total_amount) FILTER (WHERE status = 'active')");
      // Collected still comes from the frozen values written at close time.
      expect(text).toContain("COALESCE(SUM(wr.total_amount) FILTER (WHERE wr.status = 'closed'), 0)");
      expect(result.ok).toBe(true);
      if (result.ok) expect((result.data as Record<string, unknown>).active_value).toBe('9000.00');
    });
  });
});
