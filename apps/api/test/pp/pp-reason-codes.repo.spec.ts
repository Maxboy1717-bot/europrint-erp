/**
 * test/pp/pp-reason-codes.repo.spec.ts
 *
 * VISION-3340 #23 — DrizzlePpReasonCodesRepository is the read/write side of the PP
 * reason-code catalog (pp_reason_codes) that backs production_orders.reason_code_id.
 *
 * The repo issues parameterised runQuery SQL. This spec replays the exact SQL through
 * drizzle-orm's real PgDialect (same idiom as test/iot/downtime-reason-link.spec.ts) and
 * proves:
 *   - findActive() renders `WHERE is_active = true` + `ORDER BY sort_order, id` and maps
 *     rows to the camelCase API view (empty state → []).
 *   - create() passes the DTO through the INSERT (code/name/category as positional params)
 *     and returns the RETURNING row.
 *   - update() renders an UPDATE by id and returns the row, or Ok(null) when nothing matched
 *     (so the controller can 404).
 *   - a thrown runQuery becomes Err (Result pattern).
 *
 * A second block proves PpReasonCodesService delegates to the repo (no db.* in the service).
 */

// runQuery is the single DB seam the repo uses — mock it, render via a real PgDialect.
jest.mock('@shared/db', () => ({ runQuery: jest.fn(), rawSql: jest.fn(), db: {} }));

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { DrizzlePpReasonCodesRepository } from '../../src/modules/pp/reason-codes/drizzle-pp-reason-codes.repo';
import { PpReasonCodesService } from '../../src/modules/pp/reason-codes/pp-reason-codes.service';
import type { IPpReasonCodesRepo } from '../../src/modules/pp/reason-codes/i-pp-reason-codes.repo';
import { Ok } from '../../src/common/result';

const mockRunQuery = runQuery as jest.Mock;
const dialect = new PgDialect();

interface Recorded {
  sql: string;
  params: unknown[];
}

/**
 * Install a recording fake for runQuery: renders each query to text+params via the real
 * PgDialect, records it, and answers with the queued rows (as the { rows } shape runQuery
 * returns). `rowsFor` is called with the 0-based call index.
 */
function installRunQuery(recorded: Recorded[], rowsFor: (i: number) => unknown[]): void {
  mockRunQuery.mockReset();
  mockRunQuery.mockImplementation(async (query: SQL) => {
    const { sql: sqlText, params } = dialect.sqlToQuery(query);
    const norm = sqlText.replace(/\s+/g, ' ').trim();
    const rows = rowsFor(recorded.length) ?? [];
    recorded.push({ sql: norm, params });
    return { rows };
  });
}

const ROW_A = {
  id: 1,
  code: 'URGENT_CLIENT',
  name: 'Shoshilinch mijoz',
  name_ru: 'Срочный клиент',
  category: 'urgent',
  color: '#ff0000',
  is_active: true,
  sort_order: 10,
};

describe('DrizzlePpReasonCodesRepository', () => {
  let repo: DrizzlePpReasonCodesRepository;
  let recorded: Recorded[];

  beforeEach(() => {
    repo = new DrizzlePpReasonCodesRepository();
    recorded = [];
  });

  describe('findActive', () => {
    it('renders WHERE is_active + ORDER BY sort_order, id and maps rows to camelCase', async () => {
      installRunQuery(recorded, () => [ROW_A]);
      const r = await repo.findActive();

      expect(r.ok).toBe(true);
      // SQL shape proof.
      expect(recorded[0].sql).toMatch(/FROM pp_reason_codes/i);
      expect(recorded[0].sql).toMatch(/WHERE is_active = true/i);
      expect(recorded[0].sql).toMatch(/ORDER BY sort_order, id/i);
      // Mapping proof (snake_case DB → camelCase API view).
      if (r.ok) {
        expect(r.data).toHaveLength(1);
        expect(r.data[0]).toEqual({
          id: 1,
          code: 'URGENT_CLIENT',
          name: 'Shoshilinch mijoz',
          nameRu: 'Срочный клиент',
          category: 'urgent',
          color: '#ff0000',
          isActive: true,
          sortOrder: 10,
        });
      }
    });

    it('returns Ok([]) when the catalog is empty (honest empty state, no fabrication)', async () => {
      installRunQuery(recorded, () => []);
      const r = await repo.findActive();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      mockRunQuery.mockReset();
      mockRunQuery.mockRejectedValueOnce(new Error('db down'));
      const r = await repo.findActive();
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('threads the DTO into an INSERT INTO pp_reason_codes and returns the created row', async () => {
      installRunQuery(recorded, () => [{ ...ROW_A, id: 7, code: 'QUALITY_HOLD', category: 'quality' }]);
      const r = await repo.create({ code: 'QUALITY_HOLD', name: 'Sifat ushlab turildi', category: 'quality' });

      expect(r.ok).toBe(true);
      expect(recorded[0].sql).toMatch(/INSERT INTO pp_reason_codes/i);
      expect(recorded[0].sql).toMatch(/RETURNING/i);
      // code/name/category are bound as positional params (parameterised, not inlined).
      expect(recorded[0].params).toEqual(
        expect.arrayContaining(['QUALITY_HOLD', 'Sifat ushlab turildi', 'quality']),
      );
      if (r.ok) expect(r.data.id).toBe(7);
    });

    it('returns Err when the insert throws', async () => {
      mockRunQuery.mockReset();
      mockRunQuery.mockRejectedValueOnce(new Error('duplicate key'));
      const r = await repo.create({ code: 'DUP', name: 'dup', category: 'urgent' });
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('renders an UPDATE by id, binds the id, and returns the patched row', async () => {
      installRunQuery(recorded, () => [{ ...ROW_A, name: 'Yangilangan nom' }]);
      const r = await repo.update(1, { name: 'Yangilangan nom' });

      expect(r.ok).toBe(true);
      expect(recorded[0].sql).toMatch(/UPDATE pp_reason_codes SET/i);
      expect(recorded[0].sql).toMatch(/WHERE id =/i);
      expect(recorded[0].params).toEqual(expect.arrayContaining([1, 'Yangilangan nom']));
      if (r.ok && r.data) expect(r.data.name).toBe('Yangilangan nom');
    });

    it('deactivates via is_active=false (COALESCE keeps false, not the existing value)', async () => {
      installRunQuery(recorded, () => [{ ...ROW_A, is_active: false }]);
      const r = await repo.update(1, { is_active: false });
      expect(r.ok).toBe(true);
      // false was bound (deactivate), not dropped as if it were undefined.
      expect(recorded[0].params).toContain(false);
      if (r.ok && r.data) expect(r.data.isActive).toBe(false);
    });

    it('returns Ok(null) when no row matched the id (→ controller 404)', async () => {
      installRunQuery(recorded, () => []);
      const r = await repo.update(999, { name: 'x' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when the update throws', async () => {
      mockRunQuery.mockReset();
      mockRunQuery.mockRejectedValueOnce(new Error('lock'));
      const r = await repo.update(1, { name: 'x' });
      expect(r.ok).toBe(false);
    });
  });
});

describe('PpReasonCodesService (delegation — no db.* in the service)', () => {
  const repo: jest.Mocked<IPpReasonCodesRepo> = {
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const service = new PpReasonCodesService(repo);

  beforeEach(() => jest.clearAllMocks());

  it('findActive delegates to repo.findActive', async () => {
    repo.findActive.mockResolvedValue(Ok([]));
    await service.findActive();
    expect(repo.findActive).toHaveBeenCalledTimes(1);
  });

  it('create passes the DTO straight through to repo.create', async () => {
    const dto = { code: 'C', name: 'n', category: 'urgent' };
    repo.create.mockResolvedValue(
      Ok({ id: 1, code: 'C', name: 'n', nameRu: null, category: 'urgent', color: null, isActive: true, sortOrder: 0 }),
    );
    await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('update passes id + patch through to repo.update', async () => {
    repo.update.mockResolvedValue(Ok(null));
    await service.update(5, { is_active: false });
    expect(repo.update).toHaveBeenCalledWith(5, { is_active: false });
  });
});
