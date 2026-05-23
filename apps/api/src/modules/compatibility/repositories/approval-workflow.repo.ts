/**
 * @module approval-workflow.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { approval_requests } from '@shared/db/schema-finance';
import { eq, desc, and } from 'drizzle-orm';
import { Ok, Err, safeCall, AppErr } from '@common/result';

type ApprovalInsert = {
  documentType: string;
  documentId: string;
  documentNumber?: string;
  amount?: string;
  currency?: string;
  requestedBy: string;
  notes?: string;
};

type ApproveUpdate = { approvedBy: string; approvedAt: Date; notes: string | null; updatedAt: Date };
type RejectUpdate  = { rejectedBy: string; rejectedAt: Date; rejectionReason: string; updatedAt: Date };

@Injectable()
export class ApprovalWorkflowRepo {
  findAll() {
    return safeCall(() => db.select().from(approval_requests).orderBy(desc(approval_requests.createdAt)), 'DB_ERROR');
  }

  findPending() {
    return safeCall(() => db.select().from(approval_requests)
      .where(eq(approval_requests.status, 'pending'))
      .orderBy(desc(approval_requests.createdAt)), 'DB_ERROR');
  }

  findByType(documentType: string) {
    return safeCall(() => db.select().from(approval_requests)
      .where(eq(approval_requests.documentType, documentType))
      .orderBy(desc(approval_requests.createdAt)), 'DB_ERROR');
  }

  async findById(id: string) {
    const r = await safeCall(() => db.select().from(approval_requests).where(eq(approval_requests.id, Number(id))), 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Err(AppErr('NOT_FOUND', `Approval request ${id} not found`));
    return Ok(row);
  }

  findByDocType(type: string, docId: string) {
    return safeCall(() => db.select().from(approval_requests)
      .where(and(eq(approval_requests.documentType, type), eq(approval_requests.documentId, docId)))
      .orderBy(desc(approval_requests.createdAt)), 'DB_ERROR');
  }

  insert(data: ApprovalInsert) {
    return safeCall(() => db.insert(approval_requests).values({
      documentType:   data.documentType,
      documentId:     data.documentId,
      documentNumber: data.documentNumber ?? null,
      amount:         data.amount ?? '0',
      currency:       data.currency ?? 'UZS',
      requestedBy:    data.requestedBy,
      notes:          data.notes ?? null,
    }).returning(), 'DB_ERROR');
  }

  approve(id: string, update: ApproveUpdate) {
    return safeCall(() => db.update(approval_requests).set({
      status:     'approved',
      approvedBy: update.approvedBy,
      approvedAt: update.approvedAt,
      notes:      update.notes,
      updatedAt:  update.updatedAt,
    }).where(and(eq(approval_requests.id, Number(id)), eq(approval_requests.status, 'pending'))).returning(), 'DB_ERROR');
  }

  reject(id: string, update: RejectUpdate) {
    return safeCall(() => db.update(approval_requests).set({
      status:          'rejected',
      rejectedBy:      update.rejectedBy,
      rejectedAt:      update.rejectedAt,
      rejectionReason: update.rejectionReason,
      updatedAt:       update.updatedAt,
    }).where(and(eq(approval_requests.id, Number(id)), eq(approval_requests.status, 'pending'))).returning(), 'DB_ERROR');
  }
}
