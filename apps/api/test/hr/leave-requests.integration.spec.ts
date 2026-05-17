/**
 * leave-requests.integration.spec.ts — Phase 8, Task 8.2
 *
 * Real-DB integration test against `leave_requests`. Opt in with
 *   RUN_INTEGRATION_TESTS=1
 *   TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test
 */

import { setupTestDb, type TestDbContext } from '../_helpers/setup-test-db';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === '1';
const maybeDescribe = RUN_INTEGRATION ? describe : describe.skip;

async function seedEmployee(ctx: TestDbContext, code = 'EMP-LEAVE-001'): Promise<number> {
  await ctx.query(
    `INSERT INTO departments (id, code, name_uz) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [1, 'HR', 'Kadrlar'],
  );
  const rows = await ctx.query<{ id: number }>(
    `INSERT INTO employees (employee_code, first_name, last_name, hire_date, department_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [code, 'Ali', 'Valiyev', '2024-01-01', 1],
  );
  if (rows.length === 0) throw new Error('Failed to seed employee');
  return rows[0].id;
}

maybeDescribe('leave_requests — real Postgres integration', () => {
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

  it('happy: yangi leave_request status=draft bilan saqlanadi', async () => {
    const empId = await seedEmployee(ctx);

    await ctx.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, duration_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [empId, 'vacation', '2026-06-01', '2026-06-07', 7, "Yillik ta'til"],
    );

    const rows = await ctx.query<{
      id: number;
      employee_id: number;
      status: string;
      duration_days: number;
    }>(
      `SELECT id, employee_id, status, duration_days FROM leave_requests
       WHERE employee_id = $1`,
      [empId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('draft');
    expect(rows[0].duration_days).toBe(7);
  });

  it('error: mavjud bo\'lmagan employee_id → FK violation', async () => {
    await expect(
      ctx.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date)
         VALUES ($1, $2, $3, $4)`,
        [99_999, 'sick', '2026-06-01', '2026-06-02'],
      ),
    ).rejects.toThrow(/foreign key|violates/i);
  });

  it('edge: birgina xodim 2 ta leave_request egasi bo\'la oladi', async () => {
    const empId = await seedEmployee(ctx);
    await ctx.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date)
       VALUES ($1, $2, $3, $4), ($1, $2, $5, $6)`,
      [empId, 'vacation', '2026-06-01', '2026-06-07', '2026-09-01', '2026-09-03'],
    );
    const rows = await ctx.query<{ cnt: string }>(
      `SELECT count(*)::text AS cnt FROM leave_requests WHERE employee_id = $1`,
      [empId],
    );
    expect(rows[0].cnt).toBe('2');
  });
});
