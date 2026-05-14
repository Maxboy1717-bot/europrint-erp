/**
 * @module approval-workflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { ApprovalWorkflowRepo } from './repositories/approval-workflow.repo';

type ApprovalRow = Awaited<ReturnType<ApprovalWorkflowRepo['findAll']>>[number];

@Injectable()
export class ApprovalWorkflowService {
  constructor(private readonly repo: ApprovalWorkflowRepo) {}

  async getDashboard(): Promise<Result<{ total: number; pending: number; approved: number; rejected: number; updatedAt: string }>> {
    const result = await safeCall(() => this.repo.findAll());
    if (!result.ok) return Err(result.error);
    const all = result.data;
    return Ok({
      total:    all.length,
      pending:  (Array.isArray(all) ? all : []).filter((r) => r.status === 'pending').length,
      approved: (Array.isArray(all) ? all : []).filter((r) => r.status === 'approved').length,
      rejected: (Array.isArray(all) ? all : []).filter((r) => r.status === 'rejected').length,
      updatedAt: _time.now().toISOString(),
    });
  }

  getPending(): Promise<Result<ApprovalRow[]>> {
    return safeCall(() => this.repo.findPending());
  }

  getHistory(): Promise<Result<ApprovalRow[]>> {
    return safeCall(() => this.repo.findAll());
  }

  getByType(docType: string): Promise<Result<ApprovalRow[]>> {
    return safeCall(() => this.repo.findByType(docType));
  }

  async getById(id: string): Promise<Result<ApprovalRow | null>> {
    const result = await safeCall(() => this.repo.findById(id));
    if (!result.ok) return Err(result.error);
    if (!result.data) return Err({ code: 'NOT_FOUND', message: `Approval request ${id} not found` });
    return result;
  }

  async approve(id: string, approvedBy: string, notes?: string): Promise<Result<ApprovalRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.approve(id, { approvedBy, approvedAt: _time.now(), notes: notes ?? null, updatedAt: _time.now() }),
    );
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Request ${id} not found or already processed` });
    return Ok(result.data[0]);
  }

  async reject(id: string, rejectedBy: string, rejectionReason: string): Promise<Result<ApprovalRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.reject(id, { rejectedBy, rejectedAt: _time.now(), rejectionReason, updatedAt: _time.now() }),
    );
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Request ${id} not found or already processed` });
    return Ok(result.data[0]);
  }

  async create(body: { documentType: string; documentId: string; documentNumber?: string; amount?: number; currency?: string; requestedBy: string; notes?: string }): Promise<Result<ApprovalRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insert({
        documentType:   body.documentType,
        documentId:     body.documentId,
        documentNumber: body.documentNumber,
        amount:         String(body.amount ?? 0),
        currency:       body.currency ?? 'UZS',
        requestedBy:    body.requestedBy,
        notes:          body.notes,
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  getByDocType(type: string, docId: string): Promise<Result<ApprovalRow[]>> {
    return safeCall(() => this.repo.findByDocType(type, docId));
  }

  async bulkApprove(ids: string[], approvedBy: string): Promise<Result<{ total: number; succeeded: number; failed: number }>> {
    const result = await safeCall(() =>
      Promise.allSettled(
        (Array.isArray(ids) ? ids : []).map((id) => this.repo.approve(id, { approvedBy, approvedAt: _time.now(), notes: null, updatedAt: _time.now() })),
      ),
    );
    if (!result.ok) return Err(result.error);
    const succeeded = (Array.isArray(result.data) ? result.data : []).filter((r) => r.status === 'fulfilled').length;
    return Ok({ total: ids.length, succeeded, failed: ids.length - succeeded });
  }
}
