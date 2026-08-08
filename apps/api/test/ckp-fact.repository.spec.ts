/**
 * ckp-fact.repository.spec.ts — CkpFactRepository GAP #10 / GAP #14 write-path
 * (ckp_card_products / ckp_personal_targets — previously read-only, 0 rows in prod).
 *
 * `runQuery` (the only DB touchpoint — this repository is raw-SQL, not the Drizzle
 * query builder) is mocked, matching the precedent in `test/hr/ckp-gate.spec.ts`.
 * These tests prove the Result<T> wiring (Ok/Err, null-on-no-row) for every new
 * method; the actual SQL — including the two ON CONFLICT targets, one on a plain
 * column pair (card_id, product_id) and one on the ckp_personal_targets expression
 * unique index (employee_id, card_id, COALESCE(product_id,0), COALESCE(period,''))
 * — was separately verified to compile and upsert correctly against the live DB
 * inside a ROLLBACK-wrapped transaction (0 persisted rows; DB-proof, not asserted
 * here since jest never touches the real database per repo test convention).
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runQuery } = require('@shared/db') as { runQuery: jest.Mock };

import { CkpFactRepository } from '../src/modules/org-structure/ckp-fact.repository';

describe('CkpFactRepository — GAP #10 write-path (ckp_card_products)', () => {
  let repo: CkpFactRepository;
  beforeEach(() => {
    repo = new CkpFactRepository();
    jest.clearAllMocks();
  });

  describe('listCardProducts', () => {
    it('returns Ok with rows when slots exist for the card', async () => {
      runQuery.mockResolvedValueOnce({ rows: [{ id: 1, card_id: 7, product_id: 9, is_active: true }] });
      const r = await repo.listCardProducts(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no slots exist', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.listCardProducts(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      runQuery.mockRejectedValueOnce(new Error('connection refused'));
      const r = await repo.listCardProducts(7);
      expect(r.ok).toBe(false);
    });
  });

  describe('upsertCardProduct', () => {
    it('returns Ok with the upserted row (create path)', async () => {
      runQuery.mockResolvedValueOnce({
        rows: [{ id: 5, card_id: 7, product_id: 9, target_value: 100, formula_type: 'quantity_pct', is_active: true }],
      });
      const r = await repo.upsertCardProduct({ cardId: 7, productId: 9, targetValue: 100, formulaType: 'quantity_pct' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data).toEqual(expect.objectContaining({ id: 5, card_id: 7, product_id: 9, target_value: 100 }));
    });

    it('returns Ok with null when RETURNING yields nothing (defensive)', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.upsertCardProduct({ cardId: 7, productId: 9 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err (DB_ERROR) when the INSERT throws (e.g. FK violation on card_id)', async () => {
      runQuery.mockRejectedValueOnce(new Error('insert or update on table violates foreign key constraint'));
      const r = await repo.upsertCardProduct({ cardId: 999, productId: 9 });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('DB_ERROR');
    });
  });

  describe('deactivateCardProduct', () => {
    it('returns Ok with the deactivated row when found', async () => {
      runQuery.mockResolvedValueOnce({ rows: [{ id: 5, is_active: false }] });
      const r = await repo.deactivateCardProduct(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, is_active: false });
    });

    it('returns Ok with null when no row matches the id (caller maps to NOT_FOUND)', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.deactivateCardProduct(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQuery.mockRejectedValueOnce(new Error('timeout'));
      const r = await repo.deactivateCardProduct(5);
      expect(r.ok).toBe(false);
    });
  });
});

describe('CkpFactRepository — GAP #14 write-path (ckp_personal_targets)', () => {
  let repo: CkpFactRepository;
  beforeEach(() => {
    repo = new CkpFactRepository();
    jest.clearAllMocks();
  });

  describe('listPersonalTargets', () => {
    it('returns Ok with rows when overrides exist for the card', async () => {
      runQuery.mockResolvedValueOnce({ rows: [{ id: 2, employee_id: 55, card_id: 7 }] });
      const r = await repo.listPersonalTargets(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no overrides exist', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.listPersonalTargets(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      runQuery.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.listPersonalTargets(7);
      expect(r.ok).toBe(false);
    });
  });

  describe('upsertPersonalTarget', () => {
    it('returns Ok with the upserted row (create path, product/period NULL = joker)', async () => {
      runQuery.mockResolvedValueOnce({
        rows: [{ id: 2, employee_id: 55, card_id: 7, product_id: null, period: null, target_value: 10, formula_type: 'boolean' }],
      });
      const r = await repo.upsertPersonalTarget({ employeeId: 55, cardId: 7, targetValue: 10, formulaType: 'boolean' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data).toEqual(expect.objectContaining({ id: 2, employee_id: 55, card_id: 7, target_value: 10 }));
    });

    it('returns Ok with null when RETURNING yields nothing (defensive)', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.upsertPersonalTarget({ employeeId: 55, cardId: 7 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err (DB_ERROR) when the INSERT throws', async () => {
      runQuery.mockRejectedValueOnce(new Error('foreign key violation'));
      const r = await repo.upsertPersonalTarget({ employeeId: 999, cardId: 999 });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('DB_ERROR');
    });
  });

  describe('deletePersonalTarget', () => {
    it('returns Ok with the deleted row when found', async () => {
      runQuery.mockResolvedValueOnce({ rows: [{ id: 2, employee_id: 55 }] });
      const r = await repo.deletePersonalTarget(2);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 2, employee_id: 55 });
    });

    it('returns Ok with null when no row matches the id (caller maps to NOT_FOUND)', async () => {
      runQuery.mockResolvedValueOnce({ rows: [] });
      const r = await repo.deletePersonalTarget(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQuery.mockRejectedValueOnce(new Error('timeout'));
      const r = await repo.deletePersonalTarget(2);
      expect(r.ok).toBe(false);
    });
  });
});
