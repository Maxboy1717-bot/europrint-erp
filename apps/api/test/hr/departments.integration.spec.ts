/**
 * departments.integration.spec.ts — Phase 8, Task 8.2
 *
 * Real-DB integration test covering the `departments` hierarchy. Demonstrates
 * the self-referential FK and the unique `code` constraint. Opt in with
 *   RUN_INTEGRATION_TESTS=1
 *   TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test
 */

import { setupTestDb, type TestDbContext } from '../_helpers/setup-test-db';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === '1';
const maybeDescribe = RUN_INTEGRATION ? describe : describe.skip;

maybeDescribe('departments — real Postgres integration', () => {
  let ctx: TestDbContext;

  beforeAll(async () => {
    ctx = await setupTestDb({ connectionString: TEST_DB_URL });
  }, 15_000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
  });

  it('happy: root + child departmentlar to\'g\'ri saqlanadi', async () => {
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz, level) VALUES ($1, $2, $3, $4)`,
      [1, 'ROOT', 'Bosh idora', 1],
    );
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz, parent_id, level) VALUES ($1, $2, $3, $4, $5)`,
      [2, 'ENG', 'Muhandislik', 1, 2],
    );

    const rows = await ctx.query<{
      id: number;
      code: string;
      parent_id: number | null;
      level: number;
    }>(`SELECT id, code, parent_id, level FROM departments ORDER BY id`);

    expect(rows).toHaveLength(2);
    expect(rows[0].parent_id).toBeNull();
    expect(rows[1].parent_id).toBe(1);
    expect(rows[1].level).toBe(2);
  });

  it('error: takroriy code → unique violation', async () => {
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3)`,
      [1, 'DUP', "Birinchi bo'lim"],
    );

    await expect(
      ctx.query(
        `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3)`,
        [2, 'DUP', "Ikkinchi bo'lim"],
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it('edge: is_active defaulti true bo\'lib qoladi', async () => {
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3)`,
      [10, 'NEW', "Yangi bo'lim"],
    );
    const rows = await ctx.query<{ is_active: boolean }>(
      `SELECT is_active FROM departments WHERE id = $1`,
      [10],
    );
    expect(rows[0].is_active).toBe(true);
  });
});
