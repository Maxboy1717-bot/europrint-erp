/**
 * @module mentorships-compat.spec
 * @description Unit tests for MentorshipsCompatController.
 */

import { Test } from '@nestjs/testing';
import { MentorshipsCompatController } from '../../src/modules/compatibility/mentorships-compat.controller';
import { MentorshipsCompatService } from '../../src/modules/compatibility/mentorships-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('MentorshipsCompatController', () => {
  let ctrl: MentorshipsCompatController;
  let svc: jest.Mocked<Partial<MentorshipsCompatService>>;

  beforeEach(async () => {
    svc = {
      getMentorships: jest.fn(), createMentorship: jest.fn(),
      getMentorship: jest.fn(), updateMentorship: jest.fn(), deleteMentorship: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [MentorshipsCompatController],
      providers: [{ provide: MentorshipsCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(MentorshipsCompatController);
  });

  it('getMentorships forwards mentor and status filters', async () => {
    (svc.getMentorships as jest.Mock).mockResolvedValue(ok([{ id: 'm1' }]));
    await ctrl.getMentorships('mentor-1', 'active');
    expect(svc.getMentorships).toHaveBeenCalledWith('mentor-1', 'active');
  });

  it('createMentorship returns service payload', async () => {
    (svc.createMentorship as jest.Mock).mockResolvedValue(ok({ id: 'm2' }));
    expect(await ctrl.createMentorship({ mentorId: 'a', menteeId: 'b' })).toEqual({ id: 'm2' });
  });

  it('getMentorship returns service payload', async () => {
    (svc.getMentorship as jest.Mock).mockResolvedValue(ok({ id: 'm1', status: 'active' }));
    expect(await ctrl.getMentorship('m1')).toEqual({ id: 'm1', status: 'active' });
  });

  it('updateMentorship forwards body', async () => {
    (svc.updateMentorship as jest.Mock).mockResolvedValue(ok({ id: 'm1', status: 'completed' }));
    await ctrl.updateMentorship('m1', { status: 'completed' });
    expect(svc.updateMentorship).toHaveBeenCalledWith('m1', { status: 'completed' });
  });

  it('patchMentorship routes through updateMentorship', async () => {
    (svc.updateMentorship as jest.Mock).mockResolvedValue(ok({ id: 'm1' }));
    await ctrl.patchMentorship('m1', { progress: 50 });
    expect(svc.updateMentorship).toHaveBeenCalledWith('m1', { progress: 50 });
  });

  it('deleteMentorship throws on error', async () => {
    (svc.deleteMentorship as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.deleteMentorship('m1')).rejects.toThrow(InternalServerErrorException);
  });
});
