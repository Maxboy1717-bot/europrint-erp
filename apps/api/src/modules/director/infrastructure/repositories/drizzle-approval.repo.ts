import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql, eq, and, desc, count } from 'drizzle-orm';
import { pgTable, text, decimal, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { Result, Err , Ok } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../domain/enums/hitl-document-type.enum';
import { DrizzleApprovalWriteRepo, approvalRequestsTable, mapApprovalRow } from './drizzle-approval-write.repo';

const approvalRequests = approvalRequestsTable;

@Injectable()
export class DrizzleApprovalRepo implements IApprovalRepo {
  private readonly logger = new Logger(DrizzleApprovalRepo.name);

  constructor(private readonly writeRepo: DrizzleApprovalWriteRepo) {}

  private mapToAggregate(row: typeof approvalRequests.$inferSelect): ApprovalRequest {
    return mapApprovalRow(row);
  }

  async findById(id: string): Promise<Result<ApprovalRequest>> {
    try {
      const rows = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id)).limit(1);
      if (rows.length === 0) return Err(`Tasdiqlash so'rovi topilmadi: ${id}`);
      return Ok(this.mapToAggregate(rows[0]));
    } catch (err) {
      this.logger.error(`findById error: ${err}`);
      return Err('Tasdiqlash so\'rovi yuklanishida xatolik');
    }
  }

  async findPending(filters: { documentType?: HitlDocumentType; page?: number; limit?: number }): Promise<Result<{ items: ApprovalRequest[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [eq(approvalRequests.status, ApprovalStatus.PENDING)];
      if (filters.documentType) conditions.push(eq(approvalRequests.documentType, filters.documentType));
      const [rows, countResult] = await Promise.all([
        db.select().from(approvalRequests).where(and(...conditions)).orderBy(desc(approvalRequests.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(approvalRequests).where(and(...conditions)),
      ]);
      return { ok: true, data: { items: (rows ?? []).map((r) => this.mapToAggregate(r)), total: countResult[0]?.count ?? 0 } };
    } catch (err) {
      this.logger.error(`findPending error: ${err}`);
      return Err('Pending so\'rovlar yuklanishida xatolik');
    }
  }

  async findHistory(filters: { documentType?: HitlDocumentType; status?: ApprovalStatus; page?: number; limit?: number }): Promise<Result<{ items: ApprovalRequest[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (filters.documentType) conditions.push(eq(approvalRequests.documentType, filters.documentType));
      if (filters.status) conditions.push(eq(approvalRequests.status, filters.status));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [rows, countResult] = await Promise.all([
        db.select().from(approvalRequests).where(whereClause).orderBy(desc(approvalRequests.updatedAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(approvalRequests).where(whereClause),
      ]);
      return { ok: true, data: { items: (rows ?? []).map((r) => this.mapToAggregate(r)), total: countResult[0]?.count ?? 0 } };
    } catch (err) {
      this.logger.error(`findHistory error: ${err}`);
      return Err('Tarixni yuklanishida xatolik');
    }
  }

  async findExistingPending(documentType: HitlDocumentType, documentId: string): Promise<Result<ApprovalRequest | null>> {
    try {
      const rows = await db.select().from(approvalRequests).where(and(eq(approvalRequests.documentType, documentType), eq(approvalRequests.documentId, documentId), eq(approvalRequests.status, ApprovalStatus.PENDING))).limit(1);
      if (rows.length === 0) return Ok(null);
      return Ok(this.mapToAggregate(rows[0]));
    } catch (err) {
      this.logger.error(`findExistingPending error: ${err}`);
      return Err('Mavjud so\'rov tekshirilishida xatolik');
    }
  }

  // ── Write delegates ────────────────────────────────────────────────────────
  save(approval: Partial<ApprovalRequest>) { return this.writeRepo.save(approval); }
  update(id: string, data: Partial<ApprovalRequest>) { return this.writeRepo.update(id, data); }
  getStats() { return this.writeRepo.getStats(); }
}
