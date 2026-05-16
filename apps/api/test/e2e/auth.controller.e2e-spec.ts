/**
 * @module auth.controller.e2e-spec
 * @description E2E tests for AuthController via Fastify inject.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../../src/modules/auth/presentation/auth.controller';
import { LoginService } from '../../src/modules/auth/application/services/login.service';
import { LogoutService } from '../../src/modules/auth/application/services/logout.service';
import { ChangePasswordService } from '../../src/modules/auth/application/services/change-password.service';
import { VerifyOtpService } from '../../src/modules/auth/application/services/verify-otp.service';
import { ResendOtpService } from '../../src/modules/auth/application/services/resend-otp.service';
import { AUTH_REPO } from '../../src/modules/auth/auth.tokens';

interface HandlerMock { execute: jest.Mock }
interface JwtMock { verify: jest.Mock; sign: jest.Mock }
interface ConfigMock { get: jest.Mock; getOrThrow: jest.Mock }
interface AuthRepoMock { isTokenBlacklisted: jest.Mock }

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let loginHandler: HandlerMock;
  let logoutHandler: HandlerMock;
  let changePasswordHandler: HandlerMock;
  let verifyOtpHandler: HandlerMock;
  let resendOtpHandler: HandlerMock;
  let jwtService: JwtMock;
  let configService: ConfigMock;
  let authRepo: AuthRepoMock;

  beforeAll(async () => {
    loginHandler = { execute: jest.fn() };
    logoutHandler = { execute: jest.fn() };
    changePasswordHandler = { execute: jest.fn() };
    verifyOtpHandler = { execute: jest.fn() };
    resendOtpHandler = { execute: jest.fn() };
    jwtService = { verify: jest.fn(), sign: jest.fn() };
    configService = { get: jest.fn(), getOrThrow: jest.fn() };
    authRepo = { isTokenBlacklisted: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginService, useValue: loginHandler },
        { provide: LogoutService, useValue: logoutHandler },
        { provide: ChangePasswordService, useValue: changePasswordHandler },
        { provide: VerifyOtpService, useValue: verifyOtpHandler },
        { provide: ResendOtpService, useValue: resendOtpHandler },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AUTH_REPO, useValue: authRepo },
        { provide: Reflector, useValue: new Reflector() },
        { provide: ThrottlerGuard, useValue: { canActivate: (): boolean => true } },
      ],
    })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'admin' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns 200 with tokens when valid credentials are submitted', async () => {
    loginHandler.execute.mockResolvedValue({ ok: true, data: { accessToken: 'a', refreshToken: 'r', user: { id: 1 } } });
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { username: 'admin', password: 'pass' } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).accessToken).toBe('a');
  });

  it('returns non-2xx error when login payload missing username field', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { password: 'x' } });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('returns 401 unauthorized when login handler reports bad credentials', async () => {
    loginHandler.execute.mockResolvedValue({ ok: false, error: { code: 'UNAUTHORIZED', message: 'bad' } });
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { username: 'admin', password: 'wrong' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with logout message when user is authenticated', async () => {
    logoutHandler.execute.mockResolvedValue({ ok: true, data: { revoked: true } });
    const res = await app.inject({ method: 'POST', url: '/auth/logout', headers: { authorization: 'Bearer token' } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).message).toBe('Successfully logged out');
  });

  it('returns 200 with new access token when refresh token is valid', async () => {
    configService.getOrThrow.mockReturnValue('refresh-secret');
    configService.get.mockReturnValue('24h');
    jwtService.verify.mockReturnValue({ sub: 1, username: 'admin', role: 'admin' });
    jwtService.sign.mockReturnValue('new-access');
    authRepo.isTokenBlacklisted.mockResolvedValue(false);
    const res = await app.inject({ method: 'POST', url: '/auth/refresh', headers: { authorization: 'Bearer refresh' } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).accessToken).toBe('new-access');
  });

  it('returns 401 unauthorized when refresh token is missing entirely', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/refresh' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 unauthorized when refresh token has been blacklisted', async () => {
    configService.getOrThrow.mockReturnValue('refresh-secret');
    jwtService.verify.mockReturnValue({ sub: 1 });
    authRepo.isTokenBlacklisted.mockResolvedValue(true);
    const res = await app.inject({ method: 'POST', url: '/auth/refresh', headers: { authorization: 'Bearer rev' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with current user data when calling me endpoint', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).id).toBe(1);
  });

  it('returns 200 with health status when health endpoint is hit', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).status).toBe('ok');
  });

  it('returns 200 when change-password succeeds for authenticated user', async () => {
    changePasswordHandler.execute.mockResolvedValue({ ok: true, data: { changed: true } });
    const res = await app.inject({
      method: 'PATCH', url: '/auth/change-password',
      payload: { oldPassword: 'OldPass1!', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' },
    });
    expect(res.statusCode).toBe(200);
  });
});
