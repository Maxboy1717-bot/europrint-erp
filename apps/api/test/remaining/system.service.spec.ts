/**
 * Behavioural spec for SystemService (Rule 22: every service needs a unit test).
 *
 * SystemService is constructed directly with stubbed SystemRepository /
 * CronStatusService collaborators — no live DB needed. The tests cover the
 * genuinely-testable branching logic: env-var-driven integration status,
 * cron-registry delegation, the (buggy-but-real) not-null checks in
 * getSettings/updateSettings, and the db-ping error handling in getHealth.
 */
import { SystemService } from '../../src/modules/remaining/system.service';

describe('SystemService', () => {
  const ORIGINAL_ENV = process.env;

  const makeRepoStub = () => ({
    ping: jest.fn().mockResolvedValue({ ok: true, data: 5 }),
    getDbStats: jest.fn().mockResolvedValue({ ok: true, data: { userCount: 1, dbSize: '1 MB', tables: [] } }),
    getSettings: jest.fn().mockResolvedValue({ id: 1, companyName: 'EuroPrint' }),
    getSettingsId: jest.fn().mockResolvedValue(1),
    updateSettings: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    createSettings: jest.fn().mockResolvedValue({ ok: true, data: { id: 2 } }),
  });

  const makeCronStatusStub = (statuses: object[] = []) => ({
    getAllStatuses: jest.fn().mockReturnValue(statuses),
  });

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('class is defined', () => {
    expect(SystemService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(SystemService.name).toBe('SystemService');
  });

  it('is constructible with repo + cron-status stubs', () => {
    const svc = new SystemService(makeRepoStub() as never, makeCronStatusStub() as never);
    expect(svc).toBeInstanceOf(SystemService);
  });

  describe('getIntegrations', () => {
    it('reports disconnected/default when no env vars are set', () => {
      delete process.env['TELEGRAM_BOT_TOKEN'];
      delete process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
      delete process.env['JWT_SECRET'];
      delete process.env['ADMIN_USERNAME'];
      delete process.env['ADMIN_PASSWORD'];
      delete process.env['REDIS_URL'];

      const svc = new SystemService(makeRepoStub() as never, makeCronStatusStub() as never);
      const res = svc.getIntegrations();
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const byKey = Object.fromEntries((res.data as { key: string; status: string }[]).map(i => [i.key, i.status]));
      expect(byKey['telegram']).toBe('disconnected');
      expect(byKey['openai']).toBe('disconnected');
      expect(byKey['postgres']).toBe('connected'); // always connected, no env gate
      expect(byKey['redis']).toBe('in_memory');
      expect(byKey['jwt']).toBe('default_key');
      expect(byKey['admin_auth']).toBe('default');
    });

    it('reports connected once the matching env var is present', () => {
      process.env['TELEGRAM_BOT_TOKEN'] = 'tok123';
      process.env['JWT_SECRET'] = 'super-secret';
      process.env['ADMIN_USERNAME'] = 'admin';
      process.env['ADMIN_PASSWORD'] = 'pw';
      process.env['REDIS_URL'] = 'redis://localhost:6379';

      const svc = new SystemService(makeRepoStub() as never, makeCronStatusStub() as never);
      const res = svc.getIntegrations();
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const byKey = Object.fromEntries((res.data as { key: string; status: string }[]).map(i => [i.key, i.status]));
      expect(byKey['telegram']).toBe('connected');
      expect(byKey['jwt']).toBe('connected');
      expect(byKey['admin_auth']).toBe('connected');
      expect(byKey['redis']).toBe('connected');
    });

    it('admin_auth stays default when only one of USERNAME/PASSWORD is set', () => {
      process.env['ADMIN_USERNAME'] = 'admin';
      delete process.env['ADMIN_PASSWORD'];

      const svc = new SystemService(makeRepoStub() as never, makeCronStatusStub() as never);
      const res = svc.getIntegrations();
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const admin = (res.data as { key: string; status: string }[]).find(i => i.key === 'admin_auth');
      expect(admin?.status).toBe('default');
    });
  });

  describe('getCronJobs', () => {
    it('wraps CronStatusService.getAllStatuses() output in a Result', () => {
      const statuses = [{ name: 'FooCron', schedule: '0 9 * * *' }];
      const cronStatus = makeCronStatusStub(statuses);
      const svc = new SystemService(makeRepoStub() as never, cronStatus as never);
      const res = svc.getCronJobs();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toBe(statuses);
      expect(cronStatus.getAllStatuses).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDbStats', () => {
    it('delegates directly to repo.getDbStats', async () => {
      const repo = makeRepoStub();
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const res = await svc.getDbStats();
      expect(repo.getDbStats).toHaveBeenCalledTimes(1);
      expect(res).toEqual({ ok: true, data: { userCount: 1, dbSize: '1 MB', tables: [] } });
    });
  });

  describe('getSettings', () => {
    it('returns Ok wrapping whatever repo.getSettings resolves to, when truthy', async () => {
      const repo = makeRepoStub();
      repo.getSettings.mockResolvedValue({ id: 7, companyName: 'EuroPrint' });
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const res = await svc.getSettings();
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({ id: 7, companyName: 'EuroPrint' });
    });

    it('maps a falsy repo.getSettings() result to a NOT_FOUND error', async () => {
      const repo = makeRepoStub();
      repo.getSettings.mockResolvedValue(null);
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const res = await svc.getSettings();
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });
  });

  describe('updateSettings', () => {
    it('calls repo.updateSettings when getSettingsId resolves a non-null id', async () => {
      const repo = makeRepoStub();
      repo.getSettingsId.mockResolvedValue(9);
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const body = { companyName: 'Acme' };
      await svc.updateSettings(body);
      expect(repo.updateSettings).toHaveBeenCalledWith(9, body);
      expect(repo.createSettings).not.toHaveBeenCalled();
    });

    it('calls repo.createSettings when getSettingsId resolves null', async () => {
      const repo = makeRepoStub();
      repo.getSettingsId.mockResolvedValue(null);
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const body = { companyName: 'Acme' };
      await svc.updateSettings(body);
      expect(repo.createSettings).toHaveBeenCalledWith(body);
      expect(repo.updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('reports dbStatus "ok" and a real latency when repo.ping resolves', async () => {
      const repo = makeRepoStub();
      repo.ping.mockResolvedValue({ ok: true, data: 42 });
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const res = await svc.getHealth();
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const data = res.data as { database: { status: string; latencyMs: number }; status: string };
      expect(data.database.status).toBe('ok');
      expect(data.database.latencyMs).toBe(42);
      expect(data.status).toBe('running');
    });

    it('reports dbStatus "error" when repo.ping rejects', async () => {
      const repo = makeRepoStub();
      repo.ping.mockRejectedValue(new Error('connection refused'));
      const svc = new SystemService(repo as never, makeCronStatusStub() as never);
      const res = await svc.getHealth();
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const data = res.data as { database: { status: string; latencyMs: number } };
      expect(data.database.status).toBe('error');
      expect(data.database.latencyMs).toBe(0);
    });
  });
});
