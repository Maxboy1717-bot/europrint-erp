/**
 * @module ai-interview-v2.controller.e2e-spec
 * @description E2E tests for AiInterviewV2Controller covering Task 1.1
 *   (JwtAuthGuard + RolesGuard wiring) plus regression coverage for the
 *   @Public() candidate-facing endpoints (validate / camera-rejected /
 *   public submit) which must continue to work without authentication.
 *
 *   Both JwtAuthGuard and RolesGuard are overridden so we can simulate
 *   auth states (no token / wrong role / right role) without needing a
 *   real JwtService or DB. The Public-decorator behaviour is exercised
 *   by routing requests at the @Public() endpoints with auth disabled
 *   and expecting them to pass.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AiInterviewV2Controller } from '../../src/modules/hr/ai-interview-v2/ai-interview-v2.controller';
import { AiInterviewV2Service } from '../../src/modules/hr/ai-interview-v2/ai-interview-v2.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { AuditInterceptor } from '../../src/common/interceptors/audit.interceptor';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator';

interface SvcMock {
  listSessions:   jest.Mock;
  getPipelineStats: jest.Mock;
  createSession:  jest.Mock;
  getSession:     jest.Mock;
  validateToken:  jest.Mock;
  reportCameraRejection: jest.Mock;
  completeSession: jest.Mock;
  listQuestions:  jest.Mock;
  getQuestionsForJob: jest.Mock;
  createQuestion: jest.Mock;
  deleteQuestion: jest.Mock;
}

describe('AiInterviewV2Controller (e2e — Task 1.1 security)', () => {
  let app: NestFastifyApplication;
  let svc: SvcMock;
  let jwtAllowed = true;
  let rolesAllowed = true;

  beforeAll(async () => {
    svc = {
      listSessions:          jest.fn(),
      getPipelineStats:      jest.fn(),
      createSession:         jest.fn(),
      getSession:            jest.fn(),
      validateToken:         jest.fn(),
      reportCameraRejection: jest.fn(),
      completeSession:       jest.fn(),
      listQuestions:         jest.fn(),
      getQuestionsForJob:    jest.fn(),
      createQuestion:        jest.fn(),
      deleteQuestion:        jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AiInterviewV2Controller],
      providers: [
        { provide: AiInterviewV2Service, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
        { provide: AuditInterceptor, useValue: { intercept: (_: unknown, next: { handle: () => unknown }) => next.handle() } },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({
        // Mirror the real guard: bypass when @Public() metadata is set.
        canActivate: (ctx: { getHandler: () => unknown; getClass: () => unknown }): boolean => {
          const reflector = new Reflector();
          const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
          ]);
          if (isPublic) return true;
          return jwtAllowed;
        },
      })
      .overrideGuard(RolesGuard).useValue({
        canActivate: (ctx: { getHandler: () => unknown; getClass: () => unknown }): boolean => {
          // @Public() routes also bypass RolesGuard in the real stack —
          // mirror that so the candidate flow tests pass.
          const reflector = new Reflector();
          const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
          ]);
          if (isPublic) return true;
          return rolesAllowed;
        },
      })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .overrideInterceptor(AuditInterceptor).useValue({ intercept: (_: unknown, next: { handle: () => unknown }) => next.handle() })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    jest.clearAllMocks();
    jwtAllowed = true;
    rolesAllowed = true;
  });

  it('returns 200 with sessions list when an HR manager queries the endpoint', async () => {
    svc.listSessions.mockResolvedValue({ ok: true, data: [{ id: 1, candidate_name: 'A' }] });
    const res = await app.inject({ method: 'GET', url: '/hr-v2/ai-interview/sessions' });
    expect(res.statusCode).toBe(200);
    expect(svc.listSessions).toHaveBeenCalledTimes(1);
  });

  it('returns 401 unauthorized when the JWT guard rejects an unauthenticated caller', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/hr-v2/ai-interview/sessions' });
    expect(res.statusCode).toBe(401);
    expect(svc.listSessions).not.toHaveBeenCalled();
  });

  it('returns 403 forbidden when the roles guard rejects a non-HR user', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/hr-v2/ai-interview/stats' });
    expect(res.statusCode).toBe(403);
    expect(svc.getPipelineStats).not.toHaveBeenCalled();
  });

  it('allows the @Public() token-validation endpoint when no auth context is present', async () => {
    jwtAllowed = false;
    rolesAllowed = false;
    svc.validateToken.mockResolvedValue({ ok: true, data: { valid: true, session_id: 42 } });
    const res = await app.inject({ method: 'GET', url: '/hr-v2/ai-interview/session/abc123/validate' });
    expect(res.statusCode).toBe(200);
    expect(svc.validateToken).toHaveBeenCalledWith('abc123');
  });

  it('allows the @Public() camera-rejected endpoint when no auth context is present', async () => {
    jwtAllowed = false;
    rolesAllowed = false;
    svc.reportCameraRejection.mockResolvedValue({ ok: true, data: undefined });
    const res = await app.inject({
      method: 'POST', url: '/hr-v2/ai-interview/session/abc123/camera-rejected',
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    expect(svc.reportCameraRejection).toHaveBeenCalledWith('abc123');
  });

  it('allows the @Public() candidate submit endpoint when no auth context is present', async () => {
    jwtAllowed = false;
    rolesAllowed = false;
    svc.validateToken.mockResolvedValue({ ok: true, data: { valid: true, session_id: 99 } });
    svc.completeSession.mockResolvedValue({ ok: true, data: undefined });
    const res = await app.inject({
      method: 'POST', url: '/hr-v2/ai-interview/session/abc123/submit',
      payload: { answers: ['answer one', 'answer two'] },
    });
    expect(res.statusCode).toBe(201);
    expect(svc.validateToken).toHaveBeenCalledWith('abc123');
    expect(svc.completeSession).toHaveBeenCalledWith(99, expect.objectContaining({
      transcript: expect.stringContaining('Q1: answer one'),
      recommendation: 'CONSIDER',
    }));
  });
});
