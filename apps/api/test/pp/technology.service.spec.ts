/**
 * test/pp/technology.service.spec.ts
 *
 * TechnologyService is a thin orchestration layer: every method delegates
 * either to TechnologyRepository (CRUD on technology_cards + child tables:
 * BOM/routes/versions/approval) or to TechnologyGrammageService.computeForCard
 * (the gofra grammage read-model). It has no arithmetic of its own, so the
 * useful contract to lock in is the delegation itself — which repo/service
 * method gets called, with which arguments, and that the Result it returns
 * is passed straight through untouched.
 */

import { TechnologyService } from '../../src/modules/pp/technology/technology.service';
import type { TechnologyRepository } from '../../src/modules/pp/technology/technology.repository';
import type { TechnologyGrammageService } from '../../src/modules/pp/technology/technology-grammage.service';

function buildRepo(overrides: Partial<jest.Mocked<TechnologyRepository>> = {}): jest.Mocked<TechnologyRepository> {
  return {
    findOrders: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findApprovalLog: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    findMaterialAlternatives: jest.fn().mockResolvedValue({ ok: true, data: { material: '', alternatives: [], note: '' } }),
    findDashboardStats: jest.fn().mockResolvedValue({ ok: true, data: { pendingCount: 0, approvedToday: 0, rejectedToday: 0, avgProcessingHours: 4 } }),
    findTechCards: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findTechnologyCards: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findTechnologyCardById: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    findOrderTechCard: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    runAiCheck: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    approveOrder: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    rejectOrder: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    createCard: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    updateCard: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    softDeleteCard: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    setLabApproved: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    setMaketApproved: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getBom: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    addBomItem: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getRoutes: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    addRoute: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getVersions: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    ...overrides,
  } as unknown as jest.Mocked<TechnologyRepository>;
}

function buildGrammage(overrides: Partial<jest.Mocked<TechnologyGrammageService>> = {}): jest.Mocked<TechnologyGrammageService> {
  return {
    setMaterialLayers: jest.fn().mockResolvedValue({ ok: true, data: { materialCardId: 1, layerCount: 0 } }),
    computeForCard: jest.fn().mockResolvedValue({ ok: true, data: { technologyCardId: 1, complete: true } }),
    ...overrides,
  } as unknown as jest.Mocked<TechnologyGrammageService>;
}

describe('TechnologyService', () => {
  it('getCardGrammage delegates to grammage.computeForCard with cardId + optional materialCardId', async () => {
    const grammage = buildGrammage({
      computeForCard: jest.fn().mockResolvedValue({ ok: true, data: { technologyCardId: 5, complete: false, reasons: ['x'] } }),
    });
    const svc = new TechnologyService(buildRepo(), grammage);

    const r = await svc.getCardGrammage(5, 12);

    expect(grammage.computeForCard).toHaveBeenCalledWith(5, 12);
    expect(r).toEqual({ ok: true, data: { technologyCardId: 5, complete: false, reasons: ['x'] } });
  });

  it('getCardGrammage forwards undefined materialCardId when omitted', async () => {
    const grammage = buildGrammage();
    const svc = new TechnologyService(buildRepo(), grammage);

    await svc.getCardGrammage(9);

    expect(grammage.computeForCard).toHaveBeenCalledWith(9, undefined);
  });

  it('getOrders forwards status filter to repo.findOrders and returns its Result untouched', async () => {
    const repo = buildRepo({
      findOrders: jest.fn().mockResolvedValue({ ok: true, data: [{ id: '1' }] }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const r = await svc.getOrders('pending');

    expect(repo.findOrders).toHaveBeenCalledWith('pending');
    expect(r).toEqual({ ok: true, data: [{ id: '1' }] });
  });

  it('getCardById delegates to repo.findTechnologyCardById', async () => {
    const repo = buildRepo({
      findTechnologyCardById: jest.fn().mockResolvedValue({ ok: false, error: 'NOT_FOUND' }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const r = await svc.getCardById('42');

    expect(repo.findTechnologyCardById).toHaveBeenCalledWith('42');
    expect(r).toEqual({ ok: false, error: 'NOT_FOUND' });
  });

  it('createCard forwards the input straight to repo.createCard', async () => {
    const repo = buildRepo({
      createCard: jest.fn().mockResolvedValue({ ok: true, data: { id: 7, code: 'C-1' } }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const input = { code: 'C-1', name: 'Karta 1' };
    const r = await svc.createCard(input);

    expect(repo.createCard).toHaveBeenCalledWith(input);
    expect(r).toEqual({ ok: true, data: { id: 7, code: 'C-1' } });
  });

  it('updateCard forwards id, patch and changedBy to repo.updateCard', async () => {
    const repo = buildRepo({
      updateCard: jest.fn().mockResolvedValue({ ok: true, data: { id: 3, status: 'draft' } }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const patch = { status: 'draft' };
    await svc.updateCard('3', patch, 99);

    expect(repo.updateCard).toHaveBeenCalledWith('3', patch, 99);
  });

  it('deleteCard delegates to repo.softDeleteCard with id and actor', async () => {
    const repo = buildRepo();
    const svc = new TechnologyService(repo, buildGrammage());

    await svc.deleteCard('11', 5);

    expect(repo.softDeleteCard).toHaveBeenCalledWith('11', 5);
  });

  it('labApprove delegates to repo.setLabApproved with id and actor', async () => {
    const repo = buildRepo();
    const svc = new TechnologyService(repo, buildGrammage());

    await svc.labApprove('11', 5);

    expect(repo.setLabApproved).toHaveBeenCalledWith('11', 5);
  });

  it('addBomItem forwards cardId and item to repo.addBomItem', async () => {
    const repo = buildRepo({
      addBomItem: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const item = { materialCode: 'MAT-1', quantity: 2.5, unit: 'kg' };
    await svc.addBomItem('11', item);

    expect(repo.addBomItem).toHaveBeenCalledWith('11', item);
  });

  it('addRoute forwards cardId and route to repo.addRoute', async () => {
    const repo = buildRepo({
      addRoute: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    });
    const svc = new TechnologyService(repo, buildGrammage());

    const route = { opSeq: 1, operation: 'print' };
    await svc.addRoute('11', route);

    expect(repo.addRoute).toHaveBeenCalledWith('11', route);
  });

  it('approveOrder forwards orderId and payload to repo.approveOrder', async () => {
    const repo = buildRepo();
    const svc = new TechnologyService(repo, buildGrammage());

    const data = { bomApproved: true, routingApproved: true, techCardApproved: true, approvedById: 'u1' };
    await svc.approveOrder('ord-1', data);

    expect(repo.approveOrder).toHaveBeenCalledWith('ord-1', data);
  });

  it('rejectOrder forwards orderId and payload to repo.rejectOrder', async () => {
    const repo = buildRepo();
    const svc = new TechnologyService(repo, buildGrammage());

    const data = { reason: 'bad format', returnTo: 'sd', rejectedById: 'u2' };
    await svc.rejectOrder('ord-2', data);

    expect(repo.rejectOrder).toHaveBeenCalledWith('ord-2', data);
  });
});
