/**
 * @module kanban.controller.e2e-spec
 * @description E2E tests for KanbanBoardsController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { KanbanBoardsController } from '../../src/modules/kanban/presentation/kanban-boards.controller';
import { KanbanBoardsService } from '../../src/modules/kanban/application/kanban-boards.service';
import { KanbanExtService } from '../../src/modules/kanban/application/kanban-ext.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

interface BoardsSvcMock {
  getBoards: jest.Mock; getBoardById: jest.Mock; createBoard: jest.Mock;
  addColumn: jest.Mock; addCard: jest.Mock; deleteCard: jest.Mock;
  updateColumn: jest.Mock; deleteColumn: jest.Mock; updateCard: jest.Mock; moveCard: jest.Mock;
}
interface ExtSvcMock { getEmployees: jest.Mock; getUnreadCount: jest.Mock }

describe('KanbanBoardsController (e2e)', () => {
  let app: NestFastifyApplication;
  let boardsSvc: BoardsSvcMock; let extSvc: ExtSvcMock;
  let jwtAllowed = true;

  beforeAll(async () => {
    boardsSvc = {
      getBoards: jest.fn(), getBoardById: jest.fn(), createBoard: jest.fn(),
      addColumn: jest.fn(), addCard: jest.fn(), deleteCard: jest.fn(),
      updateColumn: jest.fn(), deleteColumn: jest.fn(), updateCard: jest.fn(), moveCard: jest.fn(),
    };
    extSvc = { getEmployees: jest.fn(), getUnreadCount: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [KanbanBoardsController],
      providers: [
        { provide: KanbanBoardsService, useValue: boardsSvc },
        { provide: KanbanExtService, useValue: extSvc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 5, role: 'manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); jwtAllowed = true; });

  it('returns 200 with boards list when manager queries kanban boards', async () => {
    boardsSvc.getBoards.mockResolvedValue({ ok: true, data: [{ id: 'b1' }] });
    const res = await app.inject({ method: 'GET', url: '/kanban/boards' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when JWT guard rejects unauthenticated user', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/kanban/boards' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with board detail when valid board id is provided', async () => {
    boardsSvc.getBoardById.mockResolvedValue({ ok: true, data: { id: 'b1', columns: [] } });
    const res = await app.inject({ method: 'GET', url: '/kanban/boards/b1' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when board id does not exist in service', async () => {
    boardsSvc.getBoardById.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({ method: 'GET', url: '/kanban/boards/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when manager creates a new kanban board', async () => {
    boardsSvc.createBoard.mockResolvedValue({ ok: true, data: { id: 'b-new' } });
    const res = await app.inject({
      method: 'POST', url: '/kanban/boards',
      payload: { name: 'Sprint Board', type: 'kanban' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when add card payload sends non-enum priority', async () => {
    const res = await app.inject({
      method: 'POST', url: '/kanban/boards/b1/cards',
      payload: { title: 'Task', priority: 'super-urgent' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 created when adding a column to an existing board', async () => {
    boardsSvc.addColumn.mockResolvedValue({ ok: true, data: { id: 'c-new' } });
    const res = await app.inject({
      method: 'POST', url: '/kanban/boards/b1/columns',
      payload: { name: 'In Progress', color: '#blue', sort_order: 1 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 200 with employees list when kanban requests assignable employees', async () => {
    extSvc.getEmployees.mockResolvedValue({ ok: true, data: [{ id: 1, name: 'Ali' }] });
    const res = await app.inject({ method: 'GET', url: '/kanban/employees' });
    expect(res.statusCode).toBe(200);
  });
});
