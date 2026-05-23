/**
 * test/auth/resend-otp.handler.spec.ts
 *
 * Unit tests for ResendOtpService. OtpSessionRepository is mocked; the
 * service invalidates older pending OTPs and inserts a fresh code.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ResendOtpService } from '../../src/modules/auth/application/services/resend-otp.service';
import { OtpSessionRepository } from '../../src/modules/auth/infrastructure/repositories/otp-session.repository';
import { Ok, Err } from '../../src/common/result';

const mockI18n = {
  t: jest.fn().mockImplementation(async (key: string) => key),
  translate: jest.fn().mockImplementation(async (key: string) => key),
};

interface RepoMock {
  invalidatePending: jest.Mock;
  insert: jest.Mock;
  findBySessionId: jest.Mock; markUsed: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    invalidatePending: jest.fn().mockResolvedValue(Ok(undefined)),
    insert: jest.fn().mockResolvedValue(Ok('new-session-uuid')),
    findBySessionId: jest.fn(), markUsed: jest.fn(),
  };
}

describe('ResendOtpService', () => {
  let handler: ResendOtpService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendOtpService,
        { provide: OtpSessionRepository, useValue: repo },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();
    handler = module.get(ResendOtpService);
  });

  it('returns Err when invalidatePending fails', async () => {
    repo.invalidatePending.mockResolvedValue(Err('db gone'));

    const r = await handler.execute({ ipAddress: '127.0.0.1' });

    expect(r.ok).toBe(false);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('returns Err when insert fails', async () => {
    repo.insert.mockResolvedValue(Err('db gone'));

    const r = await handler.execute({ ipAddress: '127.0.0.1' });

    expect(r.ok).toBe(false);
  });

  it('returns Ok with the sessionId from insert on success', async () => {
    repo.insert.mockResolvedValue(Ok('abc-123'));

    const r = await handler.execute({ ipAddress: '127.0.0.1' });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.sessionId).toBe('abc-123');
      expect(r.data.success).toBe(true);
      expect(r.data.expiresIn).toBe(300); // OTP_TTL_MINUTES=5 → 300 seconds
    }
  });

  it('invalidates pending OTPs for the same ipAddress before inserting', async () => {
    await handler.execute({ ipAddress: '10.0.0.1' });

    expect(repo.invalidatePending).toHaveBeenCalledWith('10.0.0.1');
    const invalidateOrder = repo.invalidatePending.mock.invocationCallOrder[0];
    const insertOrder = repo.insert.mock.invocationCallOrder[0];
    expect(invalidateOrder).toBeLessThan(insertOrder);
  });

  it('persists a numeric OTP code and a future expiresAt', async () => {
    await handler.execute({ ipAddress: '10.0.0.1' });

    expect(repo.insert).toHaveBeenCalledTimes(1);
    const [ip, code, expiresAt] = repo.insert.mock.calls[0];
    expect(ip).toBe('10.0.0.1');
    expect(code).toMatch(/^\d+$/);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
