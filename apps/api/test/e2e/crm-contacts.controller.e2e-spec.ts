/**
 * @module crm-contacts.controller.e2e-spec
 * @description E2E tests for CrmContactsController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CrmContactsController } from '../../src/modules/crm/presentation/crm-contacts.controller';
import { CrmContactsService } from '../../src/modules/crm/application/crm-contacts.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface SvcMock {
  listContacts: jest.Mock; getContact: jest.Mock; checkDuplicates: jest.Mock;
  createContact: jest.Mock; updateContact: jest.Mock; deleteContact: jest.Mock;
}

describe('CrmContactsController (e2e)', () => {
  let app: NestFastifyApplication;
  let svc: SvcMock; let rolesAllowed = true; let jwtAllowed = true;

  beforeAll(async () => {
    svc = {
      listContacts: jest.fn(), getContact: jest.fn(), checkDuplicates: jest.fn(),
      createContact: jest.fn(), updateContact: jest.fn(), deleteContact: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [CrmContactsController],
      providers: [
        { provide: CrmContactsService, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'sales_manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; jwtAllowed = true; });

  it('returns 200 with contacts list when authenticated user fetches contacts', async () => {
    svc.listContacts.mockResolvedValue({ ok: true, data: [{ id: 1 }] });
    const res = await app.inject({ method: 'GET', url: '/crm/contacts' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when JWT guard rejects unauthenticated user', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/crm/contacts' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with contact when valid id is provided', async () => {
    svc.getContact.mockResolvedValue({ ok: true, data: { id: 7, first_name: 'A' } });
    const res = await app.inject({ method: 'GET', url: '/crm/contacts/7' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when contact does not exist for given id', async () => {
    svc.getContact.mockResolvedValue({ ok: true, data: null });
    const res = await app.inject({ method: 'GET', url: '/crm/contacts/999' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with new contact when create succeeds for sales role', async () => {
    svc.createContact.mockResolvedValue({ ok: true, data: { id: 3 } });
    const res = await app.inject({
      method: 'POST', url: '/crm/contacts',
      payload: { first_name: 'Ali', last_name: 'V', email: 'a@b.uz', phone: '+998901112233' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 403 forbidden when non-sales role attempts contact creation', async () => {
    rolesAllowed = false;
    const res = await app.inject({
      method: 'POST', url: '/crm/contacts',
      payload: { first_name: 'X' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 bad request when duplicate-check payload omits both email and phone', async () => {
    const res = await app.inject({ method: 'POST', url: '/crm/contacts/check-duplicates', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 with duplicates list when valid email is provided', async () => {
    svc.checkDuplicates.mockResolvedValue([]);
    const res = await app.inject({ method: 'POST', url: '/crm/contacts/check-duplicates', payload: { email: 'a@b.uz' } });
    expect(res.statusCode).toBe(201);
  });

  it('returns 200 with deleted flag when contact is removed', async () => {
    svc.deleteContact.mockResolvedValue({ ok: true });
    const res = await app.inject({ method: 'DELETE', url: '/crm/contacts/5' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).deleted).toBe(true);
  });
});
