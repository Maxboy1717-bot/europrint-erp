/**
 * test/pp/approve-bom.handler.spec.ts
 *
 * Unit tests for ApproveBomHandler. Only IPpRepository is mocked.
 * The Bom aggregate is constructed real so approval rules are exercised.
 */

import {
  ApproveBomHandler,
  ApproveBomCommand,
} from '../../src/modules/pp/application/commands/approve-bom.handler';
import { Bom, BomItem, BomStatus } from '../../src/modules/pp/domain/aggregates/bom.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { IPpRepository } from '../../src/modules/pp/domain/repositories/pp.repository';
import { bomFactory } from '../_fixtures/factories';

type Repo = jest.Mocked<IPpRepository>;

function makeRepo(): Repo {
  return {
    savePo: jest.fn(),
    getPo: jest.fn(),
    getAllPoByStatus: jest.fn(),
    saveBom: jest.fn().mockResolvedValue(Ok(1)),
    getBom: jest.fn(),
    getBomByProductId: jest.fn(),
    saveRouting: jest.fn(),
    getRouting: jest.fn(),
    getRoutingByProductId: jest.fn(),
    unlockPlanning: jest.fn(),
    getProductionPlan: jest.fn(),
    getMachineLoad: jest.fn(),
  } as Repo;
}

function makeDraftBom(): Bom {
  const f = bomFactory();
  const bom = new Bom(f.id, f.productId, f.version);
  bom.addItem(new BomItem(101, 10, 5));
  return bom;
}

describe('ApproveBomHandler', () => {
  it('returns NOT_FOUND error when bom does not exist', async () => {
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Err(AppErr('NOT_FOUND', 'bom missing')));
    const handler = new ApproveBomHandler(repo);

    const r = await handler.execute(new ApproveBomCommand(1, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.saveBom).not.toHaveBeenCalled();
  });

  it('returns Err when bom approval rule rejects empty bom', async () => {
    const f = bomFactory();
    const empty = new Bom(f.id, f.productId, f.version);
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(empty));
    const handler = new ApproveBomHandler(repo);

    const r = await handler.execute(new ApproveBomCommand(f.id, 7));

    expect(r.ok).toBe(false);
    expect(repo.saveBom).not.toHaveBeenCalled();
  });

  it('returns Err when repo.saveBom fails after approval', async () => {
    const bom = makeDraftBom();
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(bom));
    repo.saveBom.mockResolvedValue(Err(AppErr('DB_ERROR', 'persist failed')));
    const handler = new ApproveBomHandler(repo);

    const r = await handler.execute(new ApproveBomCommand(bom.getId(), 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('approves bom and persists when valid draft bom found', async () => {
    const bom = makeDraftBom();
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(bom));
    const handler = new ApproveBomHandler(repo);

    const r = await handler.execute(new ApproveBomCommand(bom.getId(), 42));

    expect(r.ok).toBe(true);
    expect(bom.getStatus()).toBe(BomStatus.APPROVED);
    expect(repo.saveBom).toHaveBeenCalledWith(bom);
  });

  it('rejects re-approval of already approved bom', async () => {
    const bom = makeDraftBom();
    bom.approve(11); // already approved
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(bom));
    const handler = new ApproveBomHandler(repo);

    const r = await handler.execute(new ApproveBomCommand(bom.getId(), 22));

    expect(r.ok).toBe(false);
    expect(repo.saveBom).not.toHaveBeenCalled();
  });
});
