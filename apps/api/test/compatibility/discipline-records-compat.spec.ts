/**
 * @module discipline-records-compat.spec
 * @description Unit tests for DisciplineRecordsCompatController.
 */

import { Test } from '@nestjs/testing';
import { DisciplineRecordsCompatController } from '../../src/modules/compatibility/discipline-records-compat.controller';
import { DisciplineRecordsCompatService } from '../../src/modules/compatibility/discipline-records-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('DisciplineRecordsCompatController', () => {
  let ctrl: DisciplineRecordsCompatController;
  let svc: jest.Mocked<Partial<DisciplineRecordsCompatService>>;

  beforeEach(async () => {
    svc = {
      getDisciplineRecords: jest.fn(), createDisciplineRecord: jest.fn(),
      getDisciplineRecord: jest.fn(), updateDisciplineRecord: jest.fn(),
      deleteDisciplineRecord: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [DisciplineRecordsCompatController],
      providers: [{ provide: DisciplineRecordsCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(DisciplineRecordsCompatController);
  });

  it('getDisciplineRecords forwards filters', async () => {
    (svc.getDisciplineRecords as jest.Mock).mockResolvedValue(ok([{ id: 'r1' }]));
    await ctrl.getDisciplineRecords('e1', 'warn', 'open');
    expect(svc.getDisciplineRecords).toHaveBeenCalledWith('e1', 'warn', 'open');
  });

  it('getDisciplineRecords returns records list', async () => {
    (svc.getDisciplineRecords as jest.Mock).mockResolvedValue(ok([{ id: 'r1' }]));
    expect(await ctrl.getDisciplineRecords()).toEqual([{ id: 'r1' }]);
  });

  it('createDisciplineRecord persists and returns id', async () => {
    (svc.createDisciplineRecord as jest.Mock).mockResolvedValue(ok({ id: 'r2' }));
    expect(await ctrl.createDisciplineRecord({ employeeId: 'e1' })).toEqual({ id: 'r2' });
  });

  it('getDisciplineRecord throws when service errs', async () => {
    (svc.getDisciplineRecord as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getDisciplineRecord('r99')).rejects.toThrow(InternalServerErrorException);
  });

  it('updateDisciplineRecord forwards id and body', async () => {
    (svc.updateDisciplineRecord as jest.Mock).mockResolvedValue(ok({ id: 'r1', resolved: true }));
    await ctrl.updateDisciplineRecord('r1', { resolved: true });
    expect(svc.updateDisciplineRecord).toHaveBeenCalledWith('r1', { resolved: true });
  });

  it('deleteDisciplineRecord returns service payload', async () => {
    (svc.deleteDisciplineRecord as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteDisciplineRecord('r1')).toEqual({ deleted: true });
  });
});
