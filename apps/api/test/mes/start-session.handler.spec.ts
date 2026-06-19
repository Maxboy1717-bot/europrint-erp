/**
 * test/mes/start-session.handler.spec.ts
 *
 * Unit tests for StartSessionHandler. Mocks the IMesRepository; uses a real
 * ProductionSession aggregate so checklist + start state transitions are exercised.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  StartSessionCommand,
  StartSessionHandler,
} from '../../src/modules/mes/application/commands/start-session.handler';
import { ProductionSession, MesStatus } from '../../src/modules/mes/domain/aggregates/production-session.aggregate';
import { IMesRepository, MES_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';
import { Ok, Err } from '../../src/common/result';

function makeRepo(overrides: Partial<IMesRepository> = {}): jest.Mocked<IMesRepository> {
  return {
    getSession: jest.fn(),
    getSessionByPpId: jest.fn(),
    getAllSessionsByStatus: jest.fn(),
    saveSession: jest.fn().mockResolvedValue(Ok(1)),
    checkOperatorCertification: jest.fn().mockResolvedValue(Ok({ valid: true })),
    // default: a fully-completed required checklist → start allowed
    getChecklistStatus: jest.fn().mockResolvedValue(Ok({ requiredTotal: 2, requiredIncomplete: [] })),
    ...overrides,
  } as jest.Mocked<IMesRepository>;
}

async function buildHandler(repo: IMesRepository): Promise<StartSessionHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      StartSessionHandler,
      { provide: MES_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(StartSessionHandler);
}

describe('StartSessionHandler', () => {
  it('returns Err when repository cannot find session', async () => {
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Err('not found')),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(false);
    expect(repo.saveSession).not.toHaveBeenCalled();
  });

  it('starts session and saves when certification is not required', async () => {
    const session = new ProductionSession(1, 10, 2, 3, false);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(true);
    expect(repo.saveSession).toHaveBeenCalledWith(session);
    expect(repo.checkOperatorCertification).not.toHaveBeenCalled();
  });

  it('checks certification when session requires it', async () => {
    const session = new ProductionSession(1, 10, 2, 3, true);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      checkOperatorCertification: jest.fn().mockResolvedValue(Ok({ valid: true })),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3, 9));

    expect(r.ok).toBe(true);
    expect(repo.checkOperatorCertification).toHaveBeenCalledWith(3, 9);
  });

  it('returns FORBIDDEN Err when certification is missing or invalid', async () => {
    const session = new ProductionSession(1, 10, 2, 3, true);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      checkOperatorCertification: jest.fn().mockResolvedValue(Ok({ valid: false, courseName: 'Press 101' })),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3, 9));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
    expect(repo.saveSession).not.toHaveBeenCalled();
  });

  it('returns Err when saveSession fails', async () => {
    const session = new ProductionSession(1, 10, 2, 3, false);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      saveSession: jest.fn().mockResolvedValue(Err('db down')),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(false);
    expect(repo.saveSession).toHaveBeenCalled();
  });

  // ── TB-safety / smena-readiness gate (Q-40 — real enforcement) ──

  it('BLOCKS start and does NOT save when a required checklist item is incomplete', async () => {
    const session = new ProductionSession(1, 10, 2, 3, false);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      getChecklistStatus: jest.fn().mockResolvedValue(
        Ok({ requiredTotal: 3, requiredIncomplete: ['TB-xavfsizlik', 'Qolib tayyorligi'] }),
      ),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(r.error.message).toMatch(/BLOCKED/);
      expect(r.error.message).toContain('TB-xavfsizlik');
      expect(r.error.message).toContain('Qolib tayyorligi');
    }
    // status NOT advanced, nothing persisted
    expect(session.getStatus()).toBe(MesStatus.READY);
    expect(repo.saveSession).not.toHaveBeenCalled();
  });

  it('BLOCKS start (fail-safe) when no required checklist is configured', async () => {
    const session = new ProductionSession(1, 10, 2, 3, false);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      getChecklistStatus: jest.fn().mockResolvedValue(Ok({ requiredTotal: 0, requiredIncomplete: [] })),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(session.getStatus()).toBe(MesStatus.READY);
    expect(repo.saveSession).not.toHaveBeenCalled();
  });

  it('advances status and saves when all required checklist items are completed', async () => {
    const session = new ProductionSession(1, 10, 2, 3, false);
    const repo = makeRepo({
      getSession: jest.fn().mockResolvedValue(Ok(session)),
      getChecklistStatus: jest.fn().mockResolvedValue(Ok({ requiredTotal: 2, requiredIncomplete: [] })),
    });
    const handler = await buildHandler(repo);

    const r = await handler.execute(new StartSessionCommand(1, 2, 3));

    expect(r.ok).toBe(true);
    expect(repo.getChecklistStatus).toHaveBeenCalledWith(1);
    expect(session.getStatus()).toBe(MesStatus.RUNNING);
    expect(repo.saveSession).toHaveBeenCalledWith(session);
  });
});
