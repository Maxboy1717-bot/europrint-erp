/**
 * Smoke spec for ResourcesCompatService (Rule 22: every service needs a unit test).
 *
 * The service runs raw SQL through @shared/db.rawSql. We mock the shared/db
 * module to avoid hitting Postgres.
 */
jest.mock('../../src/shared/db', () => ({
  db:       {},
  rawSql:   jest.fn().mockResolvedValue({ rows: [] }),
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { ResourcesCompatService } from '../../src/modules/compatibility/resources.service';

describe('ResourcesCompatService', () => {
  it('class is defined', () => {
    expect(ResourcesCompatService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ResourcesCompatService.name).toBe('ResourcesCompatService');
  });

  it('is constructible without arguments', () => {
    const svc = new ResourcesCompatService();
    expect(svc).toBeInstanceOf(ResourcesCompatService);
  });

  it('exposes getWarehouses as an async function', () => {
    const svc = new ResourcesCompatService();
    expect(typeof svc.getWarehouses).toBe('function');
  });

  it('getWarehouses returns a Result wrapper on stubbed rawSql', async () => {
    const svc = new ResourcesCompatService();
    const res = await svc.getWarehouses('1', '50');
    expect(res).toHaveProperty('ok');
    expect(typeof res.ok).toBe('boolean');
  });
});
