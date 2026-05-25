/**
 * test/auth/verify-otp.handler.spec.ts
 *
 * Unit tests for VerifyOtpService. OtpSessionRepository is mocked; the
 * service validates the code against the session and consumes it.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { VerifyOtpService } from '../../src/modules/auth/application/services/verify-otp.service';
import { OtpSessionRepository, OtpSessionRow } from '../../src/modules/auth/infrastructure/repositories/otp-session.repository';
import { Ok, Err } from '../../src/common/result';

const mockI18n = {
  t: jest.fn().mockImplementation(async (key: string) => key),
  translate: jest.fn().mockImplementation(async (key: string) => key),
};

interface RepoMock {
  findBySessionId: jest.Mock;
  markUsed: jest.Mock;
  invalidatePending: jest.Mock; insert: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findBySessionId: jest.fn(),
    markUsed: jest.fn().mockResolvedValue(Ok(undefined)),
    invalidatePending: jest.fn(), insert: jest.fn(),
  };
}

function makeSession(over: Partial<OtpSessionRow> = {}): OtpSessionRow {
  return {
    id: 1, sessionId: 'sess-1', code: '123456',
    expiresAt: new Date(Date.now() + 60_000), used: false, ...over,
  };
}

describe('VerifyOtpService', () => {
  let handler: VerifyOtpService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyOtpService,
        { provide: OtpSessionRepository, useValue: repo },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();
    handler = module.get(VerifyOtpService);
  });

  it('returns Err when findBySessionId fails', async () => {
    repo.findBySessionId.mockResolvedValue(Err('db gone'));

    const r = await handler.execute({ code: '123456', sessionId: 'sess-1' });

    expect(r.ok).toBe(false);
  });

  it('returns NOT_FOUND when no session is found', async () => {
    repo.findBySessionId.mockResolvedValue(Ok(null));

    const r = await handler.execute({ code: '123456', sessionId: 'sess-1' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns BAD_REQUEST when session has expired', async () => {
    repo.findBySessionId.mockResolvedValue(Ok(makeSession({ expiresAt: new Date(Date.now() - 60_000) })));

    const r = await handler.execute({ code: '123456', sessionId: 'sess-1' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
    expect(repo.markUsed).not.toHaveBeenCalled();
  });

  it('returns BAD_REQUEST when code does not match', async () => {
    repo.findBySessionId.mockResolvedValue(Ok(makeSession({ code: '999999' })));

    const r = await handler.execute({ code: '123456', sessionId: 'sess-1' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
    expect(repo.markUsed).not.toHaveBeenCalled();
  });

  it('returns Ok and consumes the session on a matching code', async () => {
    repo.findBySessionId.mockResolvedValue(Ok(makeSession({ id: 77, code: '123456' })));

    const r = await handler.execute({ code: '123456', sessionId: 'sess-1' });

    expect(r.ok).toBe(true);
    expect(repo.markUsed).toHaveBeenCalledWith(77);
  });
});
