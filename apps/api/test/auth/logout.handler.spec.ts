/**
 * test/auth/logout.handler.spec.ts
 *
 * Unit tests for LogoutService. IAuthRepo + JwtService are mocked; the
 * service decodes the token to find expiry and blacklists it.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { LogoutService } from '../../src/modules/auth/application/services/logout.service';
import { AUTH_REPO } from '../../src/modules/auth/auth.tokens';

const mockI18n = {
  t: jest.fn().mockImplementation(async (key: string) => key),
  translate: jest.fn().mockImplementation(async (key: string) => key),
};

interface RepoMock {
  blacklistToken: jest.Mock<Promise<void>, [string, Date]>;
  findByUsername: jest.Mock; findById: jest.Mock; save: jest.Mock;
  updateLastLogin: jest.Mock; isTokenBlacklisted: jest.Mock;
  incrementFailedAttempts: jest.Mock; lockUserAccount: jest.Mock; resetFailedAttempts: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    blacklistToken: jest.fn().mockResolvedValue(undefined),
    findByUsername: jest.fn(), findById: jest.fn(), save: jest.fn(),
    updateLastLogin: jest.fn(), isTokenBlacklisted: jest.fn(),
    incrementFailedAttempts: jest.fn(), lockUserAccount: jest.fn(), resetFailedAttempts: jest.fn(),
  };
}

interface JwtMock {
  decode: jest.Mock;
  sign: jest.Mock; verify: jest.Mock;
}

function makeJwt(): JwtMock {
  return { decode: jest.fn(), sign: jest.fn(), verify: jest.fn() };
}

describe('LogoutService', () => {
  let handler: LogoutService;
  let repo: RepoMock;
  let jwt: JwtMock;

  beforeEach(async () => {
    repo = makeRepo();
    jwt = makeJwt();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        { provide: AUTH_REPO, useValue: repo },
        { provide: JwtService, useValue: jwt },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();
    handler = module.get(LogoutService);
  });

  it('returns VALIDATION when token decode yields a string (invalid format)', async () => {
    jwt.decode.mockReturnValue('not-an-object');

    const r = await handler.execute({ token: 'bad', userId: 1 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    expect(repo.blacklistToken).not.toHaveBeenCalled();
  });

  it('returns VALIDATION when decode returns null', async () => {
    jwt.decode.mockReturnValue(null);

    const r = await handler.execute({ token: 'bad', userId: 1 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns Err when decoded payload has no exp claim', async () => {
    jwt.decode.mockReturnValue({ sub: 1 });

    const r = await handler.execute({ token: 'no-exp', userId: 1 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/tokenInvalid|expiration/i);
    expect(repo.blacklistToken).not.toHaveBeenCalled();
  });

  it('returns Ok and blacklists the token when decode yields a valid exp', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    jwt.decode.mockReturnValue({ sub: 1, exp });

    const r = await handler.execute({ token: 'good-token', userId: 42 });

    expect(r.ok).toBe(true);
    expect(repo.blacklistToken).toHaveBeenCalledTimes(1);
    const [token, expiresAt] = repo.blacklistToken.mock.calls[0];
    expect(token).toBe('good-token');
    expect(expiresAt).toBeInstanceOf(Date);
    expect(Math.round(expiresAt.getTime() / 1000)).toBe(exp);
  });
});
