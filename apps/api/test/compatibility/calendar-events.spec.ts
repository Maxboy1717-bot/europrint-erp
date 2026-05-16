/**
 * @module calendar-events.spec
 * @description Unit tests for CalendarEventsController.
 */

import { Test } from '@nestjs/testing';
import { CalendarEventsController } from '../../src/modules/compatibility/calendar-events.controller';
import { CalendarEventsService } from '../../src/modules/compatibility/calendar-events.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { NotFoundException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const ISO = '2026-01-01T10:00:00.000Z';

describe('CalendarEventsController', () => {
  let ctrl: CalendarEventsController;
  let svc: jest.Mocked<Partial<CalendarEventsService>>;

  beforeEach(async () => {
    svc = {
      getAll: jest.fn(), getUpcoming: jest.fn(), create: jest.fn(),
      getById: jest.fn(), update: jest.fn(), delete: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [CalendarEventsController],
      providers: [{ provide: CalendarEventsService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(CalendarEventsController);
  });

  it('getAll forwards type filter and returns events', async () => {
    (svc.getAll as jest.Mock).mockResolvedValue(ok([{ id: 'e1' }]));
    expect(await ctrl.getAll('meeting')).toEqual([{ id: 'e1' }]);
    expect(svc.getAll).toHaveBeenCalledWith('meeting');
  });

  it('getUpcoming returns upcoming events', async () => {
    (svc.getUpcoming as jest.Mock).mockResolvedValue(ok([{ id: 'e2', title: 'Soon' }]));
    expect(await ctrl.getUpcoming()).toEqual([{ id: 'e2', title: 'Soon' }]);
  });

  it('create validates title and ISO start date', async () => {
    (svc.create as jest.Mock).mockResolvedValue(ok({ id: 'e3' }));
    expect(await ctrl.create({ title: 'Meeting', startDate: ISO })).toEqual({ id: 'e3' });
  });

  it('create rejects invalid body (missing title)', async () => {
    await expect(ctrl.create({ startDate: ISO })).rejects.toThrow();
  });

  it('create rejects invalid datetime', async () => {
    await expect(ctrl.create({ title: 'x', startDate: 'not-iso' })).rejects.toThrow();
  });

  it('getById throws NotFound on service error', async () => {
    (svc.getById as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.getById('e99')).rejects.toThrow(NotFoundException);
  });

  it('update accepts partial body', async () => {
    (svc.update as jest.Mock).mockResolvedValue(ok({ id: 'e1', title: 'Updated' }));
    expect(await ctrl.update('e1', { title: 'Updated' })).toEqual({ id: 'e1', title: 'Updated' });
  });

  it('delete returns service ok payload', async () => {
    (svc.delete as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.delete('e1')).toEqual({ deleted: true });
  });

  it('patch routes through service.update', async () => {
    (svc.update as jest.Mock).mockResolvedValue(ok({ id: 'e1', allDay: true }));
    await ctrl.patch('e1', { allDay: true });
    expect(svc.update).toHaveBeenCalledWith('e1', { allDay: true });
  });
});
