/**
 * Smoke spec for ResourcesCompatService (Rule 22: every service needs a unit test).
 *
 * The service runs raw SQL through @shared/db.rawSql. We mock the shared/db
 * module to avoid hitting Postgres.
 */
const mockRawSql = jest.fn().mockResolvedValue({ rows: [] });

jest.mock('../../src/shared/db', () => ({
  db:       {},
  rawSql:   (...args: unknown[]) => mockRawSql(...args),
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { ResourcesCompatService } from '../../src/modules/compatibility/resources.service';

// Minimal I18nService stub — service only calls `.t(key, opts)`; tests don't assert
// on translated text, so echoing the key back is sufficient and avoids booting I18nModule.
const i18nStub = { t: jest.fn(async (key: string) => key) } as unknown as import('nestjs-i18n').I18nService;

describe('ResourcesCompatService', () => {
  it('class is defined', () => {
    expect(ResourcesCompatService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ResourcesCompatService.name).toBe('ResourcesCompatService');
  });

  it('is constructible with an I18nService', () => {
    const svc = new ResourcesCompatService(i18nStub);
    expect(svc).toBeInstanceOf(ResourcesCompatService);
  });

  it('exposes getWarehouses as an async function', () => {
    const svc = new ResourcesCompatService(i18nStub);
    expect(typeof svc.getWarehouses).toBe('function');
  });

  it('getWarehouses returns a Result wrapper on stubbed rawSql', async () => {
    const svc = new ResourcesCompatService(i18nStub);
    const res = await svc.getWarehouses('1', '50');
    expect(res).toHaveProperty('ok');
    expect(typeof res.ok).toBe('boolean');
  });

  // Ombor tozalash (WMS-POS-FULL-AUDIT-2026-07-05, item 2, 2026-07-06): createWarehouse
  // never checked for an existing active warehouse with the same name -- code has a DB
  // UNIQUE constraint, name does not.
  describe('createWarehouse duplicate-name guard', () => {
    beforeEach(() => mockRawSql.mockReset());

    it('rejects with ConflictException when an active warehouse already has this name', async () => {
      mockRawSql.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // duplicate-check finds a match
      const svc = new ResourcesCompatService(i18nStub);
      const res = await svc.createWarehouse({ name: 'Asosiy ombor' });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('CONFLICT');
      }
      // Only the duplicate-check query ran -- no INSERT was attempted.
      expect(mockRawSql).toHaveBeenCalledTimes(1);
    });

    it('creates the warehouse when no duplicate name exists', async () => {
      mockRawSql
        .mockResolvedValueOnce({ rows: [] }) // duplicate-check: none found
        .mockResolvedValueOnce({ rows: [{ id: 9, name: 'Yangi ombor', code: 'YO-1' }] }); // insert
      const svc = new ResourcesCompatService(i18nStub);
      const res = await svc.createWarehouse({ name: 'Yangi ombor' });

      expect(res.ok).toBe(true);
      expect(mockRawSql).toHaveBeenCalledTimes(2);
    });
  });
});
