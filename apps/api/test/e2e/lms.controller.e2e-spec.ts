/**
 * @module lms.controller.e2e-spec
 * @description E2E tests for LmsCoreController.
 */

import 'reflect-metadata';

jest.mock('@shared/db', () => ({
  __esModule: true,
  db: { insert: () => ({ values: () => ({ returning: jest.fn().mockResolvedValue([{ id: 't1' }]) }) }) },
  lms_support_tickets: {},
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LmsCoreController } from '../../src/modules/lms/presentation/lms-core.controller';
import { LmsCoreService } from '../../src/modules/lms/application/services/lms-core.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface SvcMock {
  getLesson: jest.Mock; listExams: jest.Mock; createExam: jest.Mock; submitExam: jest.Mock;
  getRecentActivity: jest.Mock; getMyProgress: jest.Mock;
}

describe('LmsCoreController (e2e)', () => {
  let app: NestFastifyApplication;
  let svc: SvcMock; let rolesAllowed = true; let jwtAllowed = true;

  beforeAll(async () => {
    svc = {
      getLesson: jest.fn(), listExams: jest.fn(), createExam: jest.fn(), submitExam: jest.fn(),
      getRecentActivity: jest.fn(), getMyProgress: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [LmsCoreController],
      providers: [
        { provide: LmsCoreService, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 11, role: 'EMPLOYEE' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; jwtAllowed = true; });

  it('returns 200 with lesson data when valid lesson id is requested', async () => {
    svc.getLesson.mockResolvedValue({ ok: true, data: { id: 'L1', title: 'Intro' } });
    const res = await app.inject({ method: 'GET', url: '/lms/lessons/L1' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when lesson id is missing from service result', async () => {
    svc.getLesson.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({ method: 'GET', url: '/lms/lessons/X' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 forbidden when JWT guard rejects the request', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/lms/exams' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 forbidden when role guard rejects non-permitted role', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/lms/exams' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with exams list when EMPLOYEE queries the endpoint', async () => {
    svc.listExams.mockResolvedValue({ ok: true, data: [{ id: 'e1' }] });
    const res = await app.inject({ method: 'GET', url: '/lms/exams' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 201 created when TRAINING_OFFICER creates a new exam', async () => {
    svc.createExam.mockResolvedValue({ ok: true, data: { id: 'e-new' } });
    const res = await app.inject({
      method: 'POST', url: '/lms/exams',
      payload: { title: 'Final Exam', durationMinutes: 60, passingScore: 70 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when exam create payload has invalid passingScore', async () => {
    const res = await app.inject({
      method: 'POST', url: '/lms/exams',
      payload: { title: 'A', passingScore: 200 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 when EMPLOYEE submits exam answers successfully', async () => {
    svc.submitExam.mockResolvedValue({ ok: true, data: { score: 80, passed: true } });
    const res = await app.inject({
      method: 'POST', url: '/lms/exams/e1/submit',
      payload: { answers: [{ q: 1, a: 'A' }] },
    });
    expect(res.statusCode).toBe(201);
  });
});
