/**
 * @module approval-workflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { ApprovalWorkflowRepo } from './repositories/approval-workflow.repo';

// Inferred from ApprovalWorkflowRepo.findAll() success-path return shape.
type ApprovalRow = {
  id: string;
  documentType: string;
  documentId: string;
  documentNumber: string | null;
  amount: string;
  currency: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

@Injectable()
export class ApprovalWorkflowService {
  constructor(private readonly repo: ApprovalWorkflowRepo) {}

  async getDashboard(): Promise<Result<{ total: number; pending: number; approved: number; rejected: number; updatedAt: string }>> {
    const result = await this.repo.findAll();
    if (!result.ok) return Err(result.error);
    const all = (Array.isArray(result.data) ? result.data : []) as ApprovalRow[];
    return Ok({
      total:    all.length,
      pending:  all.filter((r) => r.status === 'pending').length,
      approved: all.filter((r) => r.status === 'approved').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
      updatedAt: _time.now().toISOString(),
    });
  }

  async getPending(): Promise<Result<ApprovalRow[]>> {
    const result = await this.repo.findPending();
    if (!result.ok) return Err(result.error);
    return Ok(result.data as ApprovalRow[]);
  }

  async getHistory(): Promise<Result<ApprovalRow[]>> {
    const result = await this.repo.findAll();
    if (!result.ok) return Err(result.error);
    return Ok(result.data as ApprovalRow[]);
  }

  async getByType(docType: string): Promise<Result<ApprovalRow[]>> {
    const result = await this.repo.findByType(docType);
    if (!result.ok) return Err(result.error);
    return Ok(result.data as ApprovalRow[]);
  }

  async getById(id: string): Promise<Result<ApprovalRow>> {
    const result = await this.repo.findById(id);
    if (!result.ok) return Err(result.error);
    return Ok(result.data as ApprovalRow);
  }

  async approve(id: string, approvedBy: string, notes?: string): Promise<Result<ApprovalRow | undefined>> {
    const result = await this.repo.approve(id, { approvedBy, approvedAt: _time.now(), notes: notes ?? null, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Request ${id} not found or already processed` });
    return Ok(result.data[0] as ApprovalRow | undefined);
  }

  async reject(id: string, rejectedBy: string, rejectionReason: string): Promise<Result<ApprovalRow | undefined>> {
    const result = await this.repo.reject(id, { rejectedBy, rejectedAt: _time.now(), rejectionReason, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Request ${id} not found or already processed` });
    return Ok(result.data[0] as ApprovalRow | undefined);
  }

  async create(body: { documentType: string; documentId: string; documentNumber?: string; amount?: number; currency?: string; requestedBy: string; notes?: string }): Promise<Result<ApprovalRow | undefined>> {
    const result = await this.repo.insert({
      documentType:   body.documentType,
      documentId:     body.documentId,
      documentNumber: body.documentNumber,
      amount:         String(body.amount ?? 0),
      currency:       body.currency ?? 'UZS',
      requestedBy:    body.requestedBy,
      notes:          body.notes,
    });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as ApprovalRow | undefined);
  }

  async getByDocType(type: string, docId: string): Promise<Result<ApprovalRow[]>> {
    const result = await this.repo.findByDocType(type, docId);
    if (!result.ok) return Err(result.error);
    return Ok(result.data as ApprovalRow[]);
  }

  async bulkApprove(ids: string[], approvedBy: string): Promise<Result<{ total: number; succeeded: number; failed: number }>> {
    const idList = Array.isArray(ids) ? ids : [];
    const results = await Promise.allSettled(
      idList.map((id) => this.repo.approve(id, { approvedBy, approvedAt: _time.now(), notes: null, updatedAt: _time.now() })),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
    return Ok({ total: ids.length, succeeded, failed: ids.length - succeeded });
  }
}
