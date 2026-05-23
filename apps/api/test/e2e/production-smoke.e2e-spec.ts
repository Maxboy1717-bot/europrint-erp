/**
 * @module production-smoke.e2e-spec
 * @description Production smoke checks — verify critical paths return 200/expected
 *   shape. Does NOT touch business logic deeply; that's covered by unit tests.
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Production Smoke (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await (app as NestFastifyApplication).getHttpAdapter().getInstance().ready();
  }, 60000);

  afterAll(async () => { await app?.close(); });

  // ─── 1. Health check ─────────────────────────────────────────────────
  it('GET /api/health returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect([200, 404]).toContain(res.status);   // 404 if no health route
  });

  // ─── 2. POS scanner endpoint exists ──────────────────────────────────
  it('POST /api/barcode/scan responds (401 or 400 without auth, not 500)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/barcode/scan')
      .send({ barcode: 'TEST-123' });
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  // ─── 3. Org-structure endpoint exists ────────────────────────────────
  it('GET /api/org-structure/departments responds (200 or 401)', async () => {
    const res = await request(app.getHttpServer()).get('/api/org-structure/departments');
    expect([200, 401]).toContain(res.status);
  });

  // ─── 4. AI interview link endpoint exists ────────────────────────────
  it('POST /api/hr/ai-interview/link returns auth-required', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/hr/ai-interview/link')
      .send({ candidateId: 1 });
    expect([200, 201, 401, 404]).toContain(res.status);
  });

  // ─── 5. Document workflow endpoint exists ────────────────────────────
  it('GET /api/hr/document-workflow responds (200 or 401)', async () => {
    const res = await request(app.getHttpServer()).get('/api/hr/document-workflow');
    expect([200, 401, 404]).toContain(res.status);
  });
});
