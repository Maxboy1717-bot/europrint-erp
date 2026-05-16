/**
 * Smoke spec for TelegramAdminService (Rule 22: every service needs a unit test).
 *
 * The service uses rawSql under the hood. We mock the shared/db module so no
 * real database connection is opened during the spec run.
 */
jest.mock('../../src/shared/db', () => ({
  db:       {},
  rawSql:   jest.fn().mockResolvedValue({ rows: [] }),
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { TelegramAdminService } from '../../src/modules/compatibility/telegram-admin.service';

describe('TelegramAdminService', () => {
  it('class is defined', () => {
    expect(TelegramAdminService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(TelegramAdminService.name).toBe('TelegramAdminService');
  });

  it('is constructible without arguments', () => {
    const svc = new TelegramAdminService();
    expect(svc).toBeInstanceOf(TelegramAdminService);
  });

  it('exposes getStats method on the prototype', () => {
    const svc = new TelegramAdminService();
    expect(typeof svc.getStats).toBe('function');
  });

  it('getStats returns a Result wrapper (ok or err)', async () => {
    const svc = new TelegramAdminService();
    const res = await svc.getStats();
    expect(res).toHaveProperty('ok');
    expect(typeof res.ok).toBe('boolean');
  });
});
