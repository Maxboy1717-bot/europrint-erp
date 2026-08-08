/**
 * test/director/dashboard-query-plan-fact.repo.spec.ts
 *
 * Vision 05: the director plan-fact + order-progress widgets joined
 * production_orders on `department_id` -- a column that does NOT exist -> the SQL
 * threw "столбец po.department_id не существует", safeCall swallowed it to []
 * (green-lie). The real column is org_department_id. These render tests pin both
 * queries to org_department_id so the nonexistent-column read can't come back.
 */

jest.mock('@shared/db', () => ({ db: {}, runQuery: jest.fn() }));

import { runQuery } from '@shared/db';
import { PgDialect } from 'drizzle-orm/pg-core';
import { DashboardQueryRepository } from '../../src/modules/director/infrastructure/repositories/dashboard-query.repository';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

function renderLastSql(): string {
  const arg = mockRunQuery.mock.calls[mockRunQuery.mock.calls.length - 1][0];
  return new PgDialect().sqlToQuery(arg).sql;
}

describe('DashboardQueryRepository — org_department_id column fix', () => {
  let repo: DashboardQueryRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    mockRunQuery.mockResolvedValue({ rows: [] } as never);
    repo = new DashboardQueryRepository();
  });

  it('getPlanFact joins production_orders on org_department_id, not the nonexistent department_id', async () => {
    await repo.getPlanFact();
    const sqlText = renderLastSql();
    expect(sqlText).toContain('org_department_id');
    expect(sqlText).not.toMatch(/po\.department_id/); // bare (nonexistent) column must be gone
  });

  it('getOrderProgress joins on org_department_id, not the nonexistent department_id', async () => {
    await repo.getOrderProgress();
    const sqlText = renderLastSql();
    expect(sqlText).toContain('org_department_id');
    expect(sqlText).not.toMatch(/pp\.department_id/);
  });
});
