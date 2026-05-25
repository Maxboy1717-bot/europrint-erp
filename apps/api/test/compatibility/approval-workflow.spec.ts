/**
 * @module approval-workflow.spec
 * @description Unit tests for ApprovalWorkflowController.
 */

import { Test } from '@nestjs/testing';
import { ApprovalWorkflowController } from '../../src/modules/compatibility/approval-workflow.controller';
import { ApprovalWorkflowService } from '../../src/modules/compatibility/approval-workflow.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 'u1', sub: 'u1' };

describe('ApprovalWorkflowController', () => {
  let ctrl: ApprovalWorkflowController;
  let svc: jest.Mocked<Partial<ApprovalWorkflowService>>;

  beforeEach(async () => {
    svc = {
      getPending: jest.fn(),
      getDashboard: jest.fn(),
      getByDocType: jest.fn(),
      create: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      getHistory: jest.fn(),
      getByType: jest.fn(),
      bulkApprove: jest.fn(),
      getById: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ApprovalWorkflowController],
      providers: [{ provide: ApprovalWorkflowService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = moduleRef.get(ApprovalWorkflowController);
  });

  it('getAll returns pending list', async () => {
    (svc.getPending as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }]));
    expect(await ctrl.getAll()).toEqual([{ id: 'a1' }]);
  });

  it('getDashboard returns dashboard data', async () => {
    (svc.getDashboard as jest.Mock).mockResolvedValue(ok({ pending: 3 }));
    expect(await ctrl.getDashboard()).toEqual({ pending: 3 });
  });

  it('submit validates input via Zod and creates approval', async () => {
    const body = { documentType: 'invoice', documentId: 'i1', requestedBy: 'u1' };
    (svc.create as jest.Mock).mockResolvedValue(ok({ id: 'a2' }));
    expect(await ctrl.submit(body)).toEqual({ id: 'a2' });
  });

  it('submit rejects invalid payload (missing documentId)', async () => {
    await expect(ctrl.submit({ documentType: 'invoice' })).rejects.toThrow();
  });

  it('approveById passes user id and notes to service', async () => {
    (svc.approve as jest.Mock).mockResolvedValue(ok({ id: 'a1', status: 'approved' }));
    const res = await ctrl.approveById('a1', { notes: 'ok' }, USER);
    expect(svc.approve).toHaveBeenCalledWith('a1', 'u1', 'ok');
    expect(res).toEqual({ id: 'a1', status: 'approved' });
  });

  it('rejectById requires rejectionReason', async () => {
    await expect(ctrl.rejectById('a1', {}, USER)).rejects.toThrow();
  });

  it('rejectById propagates NOT_FOUND as 404', async () => {
    (svc.reject as jest.Mock).mockResolvedValue(err('NOT_FOUND', 'missing'));
    await expect(ctrl.rejectById('a1', { rejectionReason: 'no' }, USER)).rejects.toThrow(NotFoundException);
  });

  it('bulkApprove validates non-empty id list', async () => {
    await expect(ctrl.bulkApprove({ ids: [] }, USER)).rejects.toThrow();
  });

  it('bulkApprove forwards ids and approver id', async () => {
    (svc.bulkApprove as jest.Mock).mockResolvedValue(ok({ approved: 2 }));
    const res = await ctrl.bulkApprove({ ids: ['a1', 'a2'] }, USER);
    expect(svc.bulkApprove).toHaveBeenCalledWith(['a1', 'a2'], 'u1');
    expect(res).toEqual({ approved: 2 });
  });

  it('getById throws NotFound when error', async () => {
    (svc.getById as jest.Mock).mockResolvedValue(err('NOT_FOUND', 'no'));
    await expect(ctrl.getById('a99')).rejects.toThrow(NotFoundException);
  });

  it('getOrder falls back to pending when query missing', async () => {
    (svc.getPending as jest.Mock).mockResolvedValue(ok([]));
    expect(await ctrl.getOrder()).toEqual([]);
  });
});
