import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { approval_requests } from '@shared/db/schema-finance';
import { eq, desc, and } from 'drizzle-orm';

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
  async findAll() {
    return db.select().from(approval_requests).orderBy(desc(approval_requests.createdAt));
  }

  async findPending() {
    return db.select().from(approval_requests)
      .where(eq(approval_requests.status, 'pending'))
      .orderBy(desc(approval_requests.createdAt));
  }

  async findByType(documentType: string) {
    return db.select().from(approval_requests)
      .where(eq(approval_requests.documentType, documentType))
      .orderBy(desc(approval_requests.createdAt));
  }

  async findById(id: string) {
    const rows = await db.select().from(approval_requests).where(eq(approval_requests.id, id));
    return rows[0] ?? null;
  }

  async findByDocType(type: string, docId: string) {
    return db.select().from(approval_requests)
      .where(and(eq(approval_requests.documentType, type), eq(approval_requests.documentId, docId)))
      .orderBy(desc(approval_requests.createdAt));
  }

  async insert(data: ApprovalInsert) {
    return db.insert(approval_requests).values({
      documentType:   data.documentType,
      documentId:     data.documentId,
      documentNumber: data.documentNumber ?? null,
      amount:         data.amount ?? '0',
      currency:       data.currency ?? 'UZS',
      requestedBy:    data.requestedBy,
      notes:          data.notes ?? null,
    }).returning();
  }

  async approve(id: string, update: ApproveUpdate) {
    return db.update(approval_requests).set({
      status:     'approved',
      approvedBy: update.approvedBy,
      approvedAt: update.approvedAt,
      notes:      update.notes,
      updatedAt:  update.updatedAt,
    }).where(and(eq(approval_requests.id, id), eq(approval_requests.status, 'pending'))).returning();
  }

  async reject(id: string, update: RejectUpdate) {
    return db.update(approval_requests).set({
      status:          'rejected',
      rejectedBy:      update.rejectedBy,
      rejectedAt:      update.rejectedAt,
      rejectionReason: update.rejectionReason,
      updatedAt:       update.updatedAt,
    }).where(and(eq(approval_requests.id, id), eq(approval_requests.status, 'pending'))).returning();
  }
}
