/**
 * @module document-workflow-v2.spec
 * @description Unit tests for DocumentWorkflowV2Controller.
 */

import { Test } from '@nestjs/testing';
import { DocumentWorkflowV2Controller } from '../../src/modules/compatibility/document-workflow-v2.controller';
import { DocumentWorkflowV2Service } from '../../src/modules/compatibility/document-workflow-v2.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 7 };

describe('DocumentWorkflowV2Controller', () => {
  let ctrl: DocumentWorkflowV2Controller;
  let svc: jest.Mocked<Partial<DocumentWorkflowV2Service>>;

  beforeEach(async () => {
    svc = {
      listRoutes: jest.fn(), initiateDocument: jest.fn(),
      approveStep: jest.fn(), rejectStep: jest.fn(),
      getEmployeeDocuments: jest.fn(), getPendingApprovals: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [DocumentWorkflowV2Controller],
      providers: [{ provide: DocumentWorkflowV2Service, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(DocumentWorkflowV2Controller);
  });

  it('listRoutes returns templates', async () => {
    (svc.listRoutes as jest.Mock).mockResolvedValue(ok([{ key: 'leave_request' }]));
    expect(await ctrl.listRoutes()).toEqual([{ key: 'leave_request' }]);
  });

  it('initiate rejects when employeeId missing', async () => {
    await expect(ctrl.initiate({}, USER)).rejects.toThrow(BadRequestException);
  });

  it('initiate rejects when documentType missing', async () => {
    await expect(ctrl.initiate({ employeeId: 5 }, USER)).rejects.toThrow(BadRequestException);
  });

  it('initiate rejects when title missing', async () => {
    await expect(ctrl.initiate({ employeeId: 5, documentType: 'leave' }, USER)).rejects.toThrow(BadRequestException);
  });

  it('initiate forwards full payload to service', async () => {
    (svc.initiateDocument as jest.Mock).mockResolvedValue(ok({ id: 1 }));
    await ctrl.initiate({ employeeId: 5, documentType: 'leave', title: 'Ta\'til' }, USER);
    expect(svc.initiateDocument).toHaveBeenCalledWith(expect.objectContaining({
      employeeId: 5, documentType: 'leave', title: 'Ta\'til', initiatorId: 7,
    }));
  });

  it('approve forwards comment to service', async () => {
    (svc.approveStep as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.approve(42, { comment: 'good' }, USER);
    expect(svc.approveStep).toHaveBeenCalledWith(42, 7, 'good');
  });

  it('reject requires a reason', async () => {
    await expect(ctrl.reject(42, {}, USER)).rejects.toThrow(BadRequestException);
  });

  it('reject forwards reason to service', async () => {
    (svc.rejectStep as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.reject(42, { reason: 'incomplete' }, USER);
    expect(svc.rejectStep).toHaveBeenCalledWith(42, 7, 'incomplete');
  });

  it('getEmployeeDocuments returns list', async () => {
    (svc.getEmployeeDocuments as jest.Mock).mockResolvedValue(ok([{ id: 10 }]));
    expect(await ctrl.getEmployeeDocuments(5)).toEqual([{ id: 10 }]);
  });

  it('getPending uses current user when no userId param', async () => {
    (svc.getPendingApprovals as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getPending(USER);
    expect(svc.getPendingApprovals).toHaveBeenCalledWith(7);
  });

  it('getPending parses query userId', async () => {
    (svc.getPendingApprovals as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getPending(USER, '99');
    expect(svc.getPendingApprovals).toHaveBeenCalledWith(99);
  });

  it('listRoutes throws on service error', async () => {
    (svc.listRoutes as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.listRoutes()).rejects.toThrow(InternalServerErrorException);
  });
});
