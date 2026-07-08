/**
 * test/marketing/leads.service.spec.ts
 *
 * marketing_leads.id is varchar (slug ids like "demo-lead-010"). The controller
 * used to Number(id) -> NaN, so real leads were never found and PUT/PATCH
 * silently updated 0 rows (fake-save). The service now takes the id as a string
 * and its findOne properly unwraps the repo Result -> real 404 on a missing lead
 * (the old `if (!row)` tested the always-truthy Result wrapper, so 404 never fired).
 */

import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { LeadsService } from '../../src/modules/marketing/leads/leads.service';
import { Ok, Err } from '../../src/common/result';

function build() {
  const repo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(Ok({ id: 'demo-lead-010', status: 'warm' })),
    softDelete: jest.fn().mockResolvedValue(Ok(undefined)),
  };
  const i18n = { t: jest.fn().mockResolvedValue('Lid topilmadi') };
  const svc = new LeadsService(repo as never, i18n as never);
  return { svc, repo };
}

describe('LeadsService — varchar id + real 404', () => {
  it('findOne passes the slug id straight through and returns the raw row', async () => {
    const { svc, repo } = build();
    repo.findOne.mockResolvedValue(Ok({ id: 'demo-lead-010', name: 'Ravshan' }));

    const row = await svc.findOne('demo-lead-010');

    expect(repo.findOne).toHaveBeenCalledWith('demo-lead-010'); // string, NOT Number()->NaN
    expect(row).toEqual({ id: 'demo-lead-010', name: 'Ravshan' });
  });

  it('findOne throws NotFound (404) when the lead is missing (was a silent 200 null)', async () => {
    const { svc, repo } = build();
    // repo returns Ok(null) — the OLD code tested the Result wrapper (truthy) so 404 never fired.
    repo.findOne.mockResolvedValue(Ok(null));
    await expect(svc.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne throws Internal when the repo errors', async () => {
    const { svc, repo } = build();
    repo.findOne.mockResolvedValue(Err('db gone'));
    await expect(svc.findOne('demo-lead-010')).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('update checks existence then writes with the slug id (fake-save fixed)', async () => {
    const { svc, repo } = build();
    repo.findOne.mockResolvedValue(Ok({ id: 'demo-lead-010', status: 'hot' }));

    const r = await svc.update('demo-lead-010', { status: 'warm' });

    expect(r.ok).toBe(true);
    expect(repo.update).toHaveBeenCalledWith('demo-lead-010', { status: 'warm' });
  });

  it('update does NOT write (and fails) when the lead is missing', async () => {
    const { svc, repo } = build();
    repo.findOne.mockResolvedValue(Ok(null)); // missing -> findOne throws 404 (caught by safeCall)

    const r = await svc.update('missing-id', { status: 'warm' });

    expect(r.ok).toBe(false);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
