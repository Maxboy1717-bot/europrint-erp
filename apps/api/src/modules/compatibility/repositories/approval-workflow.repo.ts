/**
 * @module approval-workflow.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

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
    try {
      return await db.select().from(approval_requests).orderBy(desc(approval_requests.createdAt));
    } catch (e) {
      throw new Error(`approval_workflow.findAll: ${String(e)}`);
    }
  }

  async findPending() {
    try {
      return await db.select().from(approval_requests)
        .where(eq(approval_requests.status, 'pending'))
        .orderBy(desc(approval_requests.createdAt));
    } catch (e) {
      throw new Error(`approval_workflow.findPending: ${String(e)}`);
    }
  }

  async findByType(documentType: string) {
    try {
      return await db.select().from(approval_requests)
        .where(eq(approval_requests.documentType, documentType))
        .orderBy(desc(approval_requests.createdAt));
    } catch (e) {
      throw new Error(`approval_workflow.findByType: ${String(e)}`);
    }
  }

  async findById(id: string) {
    try {
      const rows = await db.select().from(approval_requests).where(eq(approval_requests.id, id));
      return rows[0] ?? null;
    } catch (e) {
      throw new Error(`approval_workflow.findById: ${String(e)}`);
    }
  }

  async findByDocType(type: string, docId: string) {
    try {
      return await db.select().from(approval_requests)
        .where(and(eq(approval_requests.documentType, type), eq(approval_requests.documentId, docId)))
        .orderBy(desc(approval_requests.createdAt));
    } catch (e) {
      throw new Error(`approval_workflow.findByDocType: ${String(e)}`);
    }
  }

  async insert(data: ApprovalInsert) {
    try {
      return await db.insert(approval_requests).values({
        documentType:   data.documentType,
        documentId:     data.documentId,
        documentNumber: data.documentNumber ?? null,
        amount:         data.amount ?? '0',
        currency:       data.currency ?? 'UZS',
        requestedBy:    data.requestedBy,
        notes:          data.notes ?? null,
      }).returning();
    } catch (e) {
      throw new Error(`approval_workflow.insert: ${String(e)}`);
    }
  }

  async approve(id: string, update: ApproveUpdate) {
    try {
      return await db.update(approval_requests).set({
        status:     'approved',
        approvedBy: update.approvedBy,
        approvedAt: update.approvedAt,
        notes:      update.notes,
        updatedAt:  update.updatedAt,
      }).where(and(eq(approval_requests.id, id), eq(approval_requests.status, 'pending'))).returning();
    } catch (e) {
      throw new Error(`approval_workflow.approve: ${String(e)}`);
    }
  }

  async reject(id: string, update: RejectUpdate) {
    try {
      return await db.update(approval_requests).set({
        status:          'rejected',
        rejectedBy:      update.rejectedBy,
        rejectedAt:      update.rejectedAt,
        rejectionReason: update.rejectionReason,
        updatedAt:       update.updatedAt,
      }).where(and(eq(approval_requests.id, id), eq(approval_requests.status, 'pending'))).returning();
    } catch (e) {
      throw new Error(`approval_workflow.reject: ${String(e)}`);
    }
  }
}
