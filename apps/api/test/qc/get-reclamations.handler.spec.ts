/**
 * test/qc/get-reclamations.handler.spec.ts
 *
 * Unit tests for GetReclamationsHandler — paginated reclamation lookup.
 */

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { GetReclamationsHandler } from '../../src/modules/qc/application/queries/get-reclamations.handler';
import { GetReclamationsQuery } from '../../src/modules/qc/application/queries/get-reclamations.query';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

interface ReclamationRow { id: string; defect_type: string; is_resolved: boolean }

function setup(count: number, rows: ReclamationRow[]): void {
  mockRun
    .mockResolvedValueOnce({ rows: [{ count }] } as never)
    .mockResolvedValueOnce({ rows } as never);
}

describe('GetReclamationsHandler', () => {
  let handler: GetReclamationsHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetReclamationsHandler],
    }).compile();
    handler = moduleRef.get(GetReclamationsHandler);
  });

  it('returns ok with the unresolved reclamation rows', async () => {
    const rows: ReclamationRow[] = [
      { id: 'r1', defect_type: 'tear', is_resolved: false },
    ];
    setup(1, rows);

    const r = await handler.execute(new GetReclamationsQuery());

    expect(r.ok).toBe(true);
    expect(r.data.data).toEqual(rows);
  });

  it('computes totalPages from total and limit', async () => {
    setup(35, []);

    const r = await handler.execute(new GetReclamationsQuery(undefined, undefined, undefined, undefined, 1, 10));

    expect(r.data.pagination.totalPages).toBe(Math.ceil(35 / 10));
  });

  it('returns empty result when no unresolved reclamations exist', async () => {
    setup(0, []);

    const r = await handler.execute(new GetReclamationsQuery());

    expect(r.data.data).toEqual([]);
    expect(r.data.pagination.totalPages).toBe(0);
  });

  it('applies default page=1 limit=20 when not supplied', async () => {
    setup(0, []);

    const r = await handler.execute(new GetReclamationsQuery());

    expect(r.data.pagination.page).toBe(1);
    expect(r.data.pagination.limit).toBe(20);
  });

  it('executes two queries in parallel for count and items', async () => {
    setup(0, []);

    await handler.execute(new GetReclamationsQuery());

    expect(mockRun).toHaveBeenCalledTimes(2);
  });
});
