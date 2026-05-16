/**
 * @module candidates-compat.spec
 * @description Unit tests for CandidatesCompatController.
 */

import { Test } from '@nestjs/testing';
import { CandidatesCompatController } from '../../src/modules/compatibility/candidates-compat.controller';
import { CandidatesCompatService } from '../../src/modules/compatibility/candidates-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('CandidatesCompatController', () => {
  let ctrl: CandidatesCompatController;
  let svc: jest.Mocked<Partial<CandidatesCompatService>>;

  beforeEach(async () => {
    svc = {
      getCandidates: jest.fn(), createCandidate: jest.fn(),
      getCandidate: jest.fn(), updateCandidate: jest.fn(), deleteCandidate: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [CandidatesCompatController],
      providers: [{ provide: CandidatesCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(CandidatesCompatController);
  });

  it('getCandidates forwards vacancy/status/limit filters', async () => {
    (svc.getCandidates as jest.Mock).mockResolvedValue(ok([{ id: 'c1' }]));
    await ctrl.getCandidates('v1', 'new', '50');
    expect(svc.getCandidates).toHaveBeenCalledWith('v1', 'new', '50');
  });

  it('getCandidates returns list payload', async () => {
    (svc.getCandidates as jest.Mock).mockResolvedValue(ok([{ id: 'c1', fullName: 'A' }]));
    expect(await ctrl.getCandidates()).toEqual([{ id: 'c1', fullName: 'A' }]);
  });

  it('createCandidate persists and returns new candidate', async () => {
    (svc.createCandidate as jest.Mock).mockResolvedValue(ok({ id: 'c2' }));
    expect(await ctrl.createCandidate({ name: 'Ali' })).toEqual({ id: 'c2' });
  });

  it('getCandidate throws 500 when service errs (no NOT_FOUND mapping for unwrapOrInternal)', async () => {
    (svc.getCandidate as jest.Mock).mockResolvedValue(err('DB_ERROR'));
    await expect(ctrl.getCandidate('missing')).rejects.toThrow(InternalServerErrorException);
  });

  it('updateCandidate forwards body to service', async () => {
    (svc.updateCandidate as jest.Mock).mockResolvedValue(ok({ id: 'c1', stage: 'interview' }));
    await ctrl.updateCandidate('c1', { stage: 'interview' });
    expect(svc.updateCandidate).toHaveBeenCalledWith('c1', { stage: 'interview' });
  });

  it('deleteCandidate returns service ok payload', async () => {
    (svc.deleteCandidate as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteCandidate('c1')).toEqual({ deleted: true });
  });
});
