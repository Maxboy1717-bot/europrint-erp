/**
 * employees.integration.spec.ts — Phase 8, Task 8.2
 *
 * Real-DB integration test that demonstrates the `setupTestDb` helper. It
 * exercises the *contract* of the `employees`, `departments`, and `positions`
 * tables — not domain logic — so it stays useful even while Phase 1-7 work
 * is in flight.
 *
 * Run:
 *   docker compose -f docker-compose.test.yml up -d
 *   # Apply schema once:
 *   #   TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test \
 *   #     pnpm --filter @workspace/db run db:push
 *   TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test \
 *     pnpm --filter @europrint/api exec jest --config test/jest.config.js \
 *       test/hr/employees.integration.spec.ts
 *
 * Skips itself if TEST_DATABASE_URL is unreachable — so it doesn't break
 * developer machines that don't have the test Postgres running.
 */

import { setupTestDb, type TestDbContext } from '../_helpers/setup-test-db';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === '1';

// By default skip — opt in with RUN_INTEGRATION_TESTS=1 to avoid breaking CI
// machines that don't have Postgres on :55432.
const maybeDescribe = RUN_INTEGRATION ? describe : describe.skip;

maybeDescribe('HR employees — real Postgres integration', () => {
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

  // ── Happy path ─────────────────────────────────────────────────────────
  it('insert va select: yangi xodim qaytariladi', async () => {
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3)`,
      [1, 'ENG', 'Muhandislik'],
    );
    await ctx.query(
      `INSERT INTO positions (id, code, name_uz, department_id) VALUES ($1, $2, $3, $4)`,
      [1, 'DEV', 'Dasturchi', 1],
    );

    await ctx.query(
      `INSERT INTO employees (employee_code, first_name, last_name, hire_date, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['EMP-001', 'Ali', 'Valiyev', '2024-01-15', 1, 1],
    );

    const rows = await ctx.query<{
      id: number;
      employee_code: string;
      first_name: string;
      status: string;
    }>(
      `SELECT id, employee_code, first_name, status FROM employees WHERE employee_code = $1`,
      ['EMP-001'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].employee_code).toBe('EMP-001');
    expect(rows[0].first_name).toBe('Ali');
    // status default = 'active'
    expect(rows[0].status).toBe('active');
  });

  // ── Edge: unique constraint ────────────────────────────────────────────
  it('takroriy employee_code → unique violation', async () => {
    await ctx.query(
      `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3)`,
      [1, 'ENG', 'Muhandislik'],
    );
    await ctx.query(
      `INSERT INTO employees (employee_code, first_name, last_name, hire_date, department_id)
       VALUES ($1, $2, $3, $4, $5)`,
      ['EMP-002', 'Olim', 'Olimov', '2024-02-01', 1],
    );

    await expect(
      ctx.query(
        `INSERT INTO employees (employee_code, first_name, last_name, hire_date, department_id)
         VALUES ($1, $2, $3, $4, $5)`,
        ['EMP-002', 'Boshqa', 'Olimov', '2024-03-01', 1],
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  // ── Error: FK violation ────────────────────────────────────────────────
  it('mavjud bo\'lmagan department_id → FK violation', async () => {
    await expect(
      ctx.query(
        `INSERT INTO employees (employee_code, first_name, last_name, hire_date, department_id)
         VALUES ($1, $2, $3, $4, $5)`,
        ['EMP-FK', 'Test', 'Test', '2024-04-01', 99999],
      ),
    ).rejects.toThrow(/foreign key|violates/i);
  });

  // ── Edge: reset() really truncates ─────────────────────────────────────
  it('reset() avvalgi testdan keyin jadval bo\'sh bo\'lishini ta\'minlaydi', async () => {
    const before = await ctx.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM employees`,
    );
    expect(before[0].count).toBe('0');
  });
});
