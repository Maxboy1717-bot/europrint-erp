/**
 * org-razryad-min-months-migration.spec.ts — VISION-3340 #13 (EP-ORG-011).
 *
 * razryad_levels.min_months=0 silently disables the 3-month interval guard
 * already coded in RazryadHistoryService.checkInterval() (razryad-history.service.ts,
 * ~lines 90-103: "if (minMonths <= 0) return Ok(true)"). This spec covers two things:
 *
 *  1. Unit-level: the exact SQL registered in SCHEMA_MIGRATIONS under the
 *     "razryad_levels.min_months activate 3-month guard" entry is the literal
 *     `UPDATE ... SET min_months = 3 WHERE min_months = 0` statement (guards
 *     against the array entry silently drifting from the on-disk .sql mirror).
 *  2. Integration (opt-in, real Postgres): applies that exact SQL statement to a
 *     razryad_levels table seeded with all 6 rows at min_months=0 (the live
 *     pre-migration state) and asserts all 6 end up at min_months=3, while an
 *     already-corrected row (min_months=3) and an intentionally-different owner
 *     override (min_months=6) are left untouched — proving the migration is a
 *     safe, idempotent backfill and not a blanket overwrite.
 *
 * Opt in with:
 *   RUN_INTEGRATION_TESTS=1
 *   TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test
 */

import { SCHEMA_MIGRATIONS } from '../src/shared/db/invariants/migrations-schema';
import { setupTestDb, type TestDbContext } from './_helpers/setup-test-db';

const MIGRATION_NAME = 'razryad_levels.min_months activate 3-month guard (VISION-3340 #13, EP-ORG-011)';

describe('razryad_levels.min_months migration entry (SCHEMA_MIGRATIONS)', () => {
  it('is registered exactly once with the literal backfill SQL', () => {
    const matches = SCHEMA_MIGRATIONS.filter((m) => m.name === MIGRATION_NAME);
    expect(matches).toHaveLength(1);
    expect(matches[0].sql.replace(/\s+/g, ' ').trim()).toBe(
      'UPDATE public.razryad_levels SET min_months = 3 WHERE min_months = 0',
    );
  });
});

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === '1';
const maybeDescribe = RUN_INTEGRATION ? describe : describe.skip;

maybeDescribe('razryad_levels.min_months migration — real Postgres integration', () => {
  let ctx: TestDbContext;
  let migrationSql: string;

  beforeAll(async () => {
    ctx = await setupTestDb({ connectionString: TEST_DB_URL });
    const entry = SCHEMA_MIGRATIONS.find((m) => m.name === MIGRATION_NAME);
    if (!entry) throw new Error(`Migration entry "${MIGRATION_NAME}" not found in SCHEMA_MIGRATIONS`);
    migrationSql = entry.sql;
  }, 15_000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  beforeEach(async () => {
    await ctx.truncate(['razryad_levels']);
    // Live pre-migration state: all 6 rows at the column DEFAULT (0).
    for (let level = 1; level <= 6; level++) {
      await ctx.query(
        `INSERT INTO razryad_levels (level, name, min_months) VALUES ($1, $2, $3)`,
        [level, `${level}-razryad`, 0],
      );
    }
  });

  it('backfills all 6 pre-existing rows from min_months=0 to min_months=3', async () => {
    await ctx.query(migrationSql);

    const rows = await ctx.query<{ level: number; min_months: number }>(
      `SELECT level, min_months FROM razryad_levels ORDER BY level`,
    );

    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.min_months).toBe(3);
    }

    const stillZero = await ctx.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM razryad_levels WHERE min_months = 0`,
    );
    expect(stillZero[0].count).toBe('0');
  });

  it('is idempotent — running it twice leaves all rows at min_months=3', async () => {
    await ctx.query(migrationSql);
    await ctx.query(migrationSql);

    const rows = await ctx.query<{ min_months: number }>(`SELECT min_months FROM razryad_levels`);
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.min_months === 3)).toBe(true);
  });

  it('does not touch rows the owner already configured differently (only backfills the 0 default)', async () => {
    // Row already fixed by a prior manual/owner UPDATE, and a row where the
    // owner deliberately chose a longer interval than the 3-month default.
    await ctx.query(`UPDATE razryad_levels SET min_months = 3 WHERE level = 1`);
    await ctx.query(`UPDATE razryad_levels SET min_months = 6 WHERE level = 6`);

    await ctx.query(migrationSql);

    const rows = await ctx.query<{ level: number; min_months: number }>(
      `SELECT level, min_months FROM razryad_levels ORDER BY level`,
    );
    const byLevel = new Map(rows.map((r) => [r.level, r.min_months]));
    expect(byLevel.get(1)).toBe(3); // already-3, untouched
    expect(byLevel.get(6)).toBe(6); // owner override, untouched by the WHERE min_months = 0 clause
    // Levels 2-5 were still at the 0 default and must now be 3.
    for (const level of [2, 3, 4, 5]) {
      expect(byLevel.get(level)).toBe(3);
    }
  });
});
