/**
 * test/mes/mes-production-sessions.service.spec.ts
 *
 * MesProductionSessionsService is a thin `safeCall(...)` wrapper over
 * MesProductionSessionsRepository — every public method forwards its
 * arguments unchanged and adapts the repo's plain return value into a
 * Result<T> (see @common/result). The behaviour worth locking down here is
 * exactly that adaptation:
 *   - success  → Result.ok with the repo's data preserved verbatim
 *   - throw    → Result.err with the thrown message, defaulting to the
 *                EXTERNAL_SERVICE error code (safeCall's default)
 * plus that each method passes its arguments through to the repo unchanged.
 */

import { MesProductionSessionsService } from '../../src/modules/mes/application/mes-production-sessions.service';
import { MesProductionSessionsRepository } from '../../src/modules/mes/infrastructure/repositories/mes-production-sessions.repo';

function buildRepo(
  overrides: Partial<jest.Mocked<MesProductionSessionsRepository>> = {},
): jest.Mocked<MesProductionSessionsRepository> {
  return {
    listSessions: jest.fn().mockResolvedValue([]),
    createSession: jest.fn().mockResolvedValue({ id: 1 }),
    getSession: jest.fn().mockResolvedValue({ id: 1 }),
    advanceSessionStage: jest.fn().mockResolvedValue({ id: 1, current_stage: 'main' }),
    recordDowntimeForSession: jest.fn().mockResolvedValue({ id: 1 }),
    listDowntimeEvents: jest.fn().mockResolvedValue([]),
    getStageBasedAvailability: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as jest.Mocked<MesProductionSessionsRepository>;
}

describe('MesProductionSessionsService — Result adaptation', () => {
  it('listSessions returns Result.ok wrapping the repo rows on success', async () => {
    const rows = [{ id: 1, status: 'running' }];
    const repo = buildRepo({ listSessions: jest.fn().mockResolvedValue(rows) });
    const svc = new MesProductionSessionsService(repo);

    const result = await svc.listSessions(1, 20, 'running');

    expect(repo.listSessions).toHaveBeenCalledWith(1, 20, 'running');
    expect(result).toEqual({ ok: true, data: rows });
  });

  it('listSessions returns Result.err with EXTERNAL_SERVICE code when the repo throws', async () => {
    const repo = buildRepo({
      listSessions: jest.fn().mockRejectedValue(new Error('connection lost')),
    });
    const svc = new MesProductionSessionsService(repo);

    const result = await svc.listSessions(1, 20);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EXTERNAL_SERVICE');
      expect(result.error.message).toBe('connection lost');
    }
  });

  it('createSession forwards the body and wraps the created row', async () => {
    const created = { id: 42, status: 'pending' };
    const repo = buildRepo({ createSession: jest.fn().mockResolvedValue(created) });
    const svc = new MesProductionSessionsService(repo);
    const body = { production_order_id: 7, target_quantity: 100 };

    const result = await svc.createSession(body);

    expect(repo.createSession).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true, data: created });
  });

  it('getSession forwards the numeric id', async () => {
    const repo = buildRepo({ getSession: jest.fn().mockResolvedValue({ id: 5 }) });
    const svc = new MesProductionSessionsService(repo);

    await svc.getSession(5);

    expect(repo.getSession).toHaveBeenCalledWith(5);
  });

  it('getSession returns Result.ok(null) when the repo finds nothing (no fabricated data)', async () => {
    const repo = buildRepo({ getSession: jest.fn().mockResolvedValue(null) });
    const svc = new MesProductionSessionsService(repo);

    const result = await svc.getSession(999);

    expect(result).toEqual({ ok: true, data: null });
  });

  it('advanceSessionStage forwards the sessionId (GSD setup→main→teardown→done)', async () => {
    const repo = buildRepo({
      advanceSessionStage: jest.fn().mockResolvedValue({ id: 3, current_stage: 'teardown' }),
    });
    const svc = new MesProductionSessionsService(repo);

    const result = await svc.advanceSessionStage(3);

    expect(repo.advanceSessionStage).toHaveBeenCalledWith(3);
    expect(result).toEqual({ ok: true, data: { id: 3, current_stage: 'teardown' } });
  });

  it('recordDowntimeForSession forwards sessionId and body together', async () => {
    const repo = buildRepo({ recordDowntimeForSession: jest.fn().mockResolvedValue({ id: 9 }) });
    const svc = new MesProductionSessionsService(repo);
    const body = { reason: 'machine jam', durationMinutes: 15 };

    await svc.recordDowntimeForSession(3, body);

    expect(repo.recordDowntimeForSession).toHaveBeenCalledWith(3, body);
  });

  it('listDowntimeEvents forwards the sessionId', async () => {
    const events = [{ id: 1, reason_description: 'jam' }];
    const repo = buildRepo({ listDowntimeEvents: jest.fn().mockResolvedValue(events) });
    const svc = new MesProductionSessionsService(repo);

    const result = await svc.listDowntimeEvents(3);

    expect(repo.listDowntimeEvents).toHaveBeenCalledWith(3);
    expect(result).toEqual({ ok: true, data: events });
  });

  it('getStageBasedAvailability forwards an explicit sessionId', async () => {
    const repo = buildRepo({
      getStageBasedAvailability: jest.fn().mockResolvedValue([{ session_id: 3, availability_pct: 80 }]),
    });
    const svc = new MesProductionSessionsService(repo);

    await svc.getStageBasedAvailability(3);

    expect(repo.getStageBasedAvailability).toHaveBeenCalledWith(3);
  });

  it('getStageBasedAvailability forwards undefined for the fleet-wide (no sessionId) call', async () => {
    const repo = buildRepo();
    const svc = new MesProductionSessionsService(repo);

    await svc.getStageBasedAvailability();

    expect(repo.getStageBasedAvailability).toHaveBeenCalledWith(undefined);
  });
});
