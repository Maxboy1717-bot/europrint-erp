/**
 * @module drizzle-approval-write.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, approval_requests as approvalRequestsTable } from '@shared/db';
import { sql, eq, and, gte, count } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { HitlDocumentType, ApprovalStatus } from '../../domain/enums/hitl-document-type.enum';

import { SECONDS_PER_HOUR } from '@common/constants/app.constants';

// Re-export the shared schema table so existing downstream imports keep working.
export { approvalRequestsTable };

export function mapApprovalRow(row: typeof approvalRequestsTable.$inferSelect): ApprovalRequest {
  return new ApprovalRequest(String(row.id), row.documentType as HitlDocumentType, row.documentId, row.documentNumber ?? null, Number(row.amount), row.currency ?? 'UZS', row.status as ApprovalStatus, row.requestedBy, row.approvedBy ?? null, row.approvedAt ?? null, row.rejectedBy ?? null, row.rejectedAt ?? null, row.rejectionReason ?? null, row.notes ?? null, row.createdAt ?? new Date(), row.updatedAt ?? new Date());
}

@Injectable()
export class DrizzleApprovalWriteRepo {
  private readonly logger = new Logger(DrizzleApprovalWriteRepo.name);

  async save(approval: Partial<ApprovalRequest>): Promise<Result<ApprovalRequest>> {
    try {
      const now = _time.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await db.insert(approvalRequestsTable).values({ documentType: approval.documentType, documentId: approval.documentId, documentNumber: approval.documentNumber || null, amount: approval.amount?.toString() || '0', currency: approval.currency || 'UZS', status: approval.status || ApprovalStatus.PENDING, requestedBy: approval.requestedBy, approvedBy: approval.approvedBy || null, approvedAt: approval.approvedAt || null, rejectedBy: approval.rejectedBy || null, rejectedAt: approval.rejectedAt || null, rejectionReason: approval.rejectionReason || null, notes: approval.notes || null, createdAt: approval.createdAt || now, updatedAt: approval.updatedAt || now } as any).returning();
      if (result.length === 0) return Err('Tasdiqlash so\'rovi saqlashida xatolik');
      return Ok(mapApprovalRow(result[0]));
    } catch (err) { this.logger.error(`save error: ${err}`); return Err('Tasdiqlash so\'rovi saqlashida xatolik'); }
  }

  async update(id: string, data: Partial<ApprovalRequest>): Promise<Result<ApprovalRequest>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: _time.now() };
      if (data.status !== undefined) updateData.status = data.status;
      if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
      if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
      if (data.rejectedBy !== undefined) updateData.rejectedBy = data.rejectedBy;
      if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt;
      if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
      if (data.notes !== undefined) updateData.notes = data.notes;
      const result = await db.update(approvalRequestsTable).set(updateData).where(eq(approvalRequestsTable.id, Number(id))).returning();
      if (result.length === 0) return Err('Tasdiqlash so\'rovi yangilanishida xatolik');
      return Ok(mapApprovalRow(result[0]));
    } catch (err) { this.logger.error(`update error: ${err}`); return Err('Tasdiqlash so\'rovi yangilanishida xatolik'); }
  }

  async getStats(): Promise<Result<{ pending: number; approvedToday: number; rejectedToday: number; avgApprovalTimeHours: number }>> {
    try {
      const today = _time.now();
      today.setHours(0, 0, 0, 0);
      const [pendingResult, approvedResult, rejectedResult, avgTimeResult] = await Promise.all([
        db.select({ count: count() }).from(approvalRequestsTable).where(eq(approvalRequestsTable.status, ApprovalStatus.PENDING)),
        db.select({ count: count() }).from(approvalRequestsTable).where(and(eq(approvalRequestsTable.status, ApprovalStatus.APPROVED), gte(approvalRequestsTable.approvedAt, today))),
        db.select({ count: count() }).from(approvalRequestsTable).where(and(eq(approvalRequestsTable.status, ApprovalStatus.REJECTED), gte(approvalRequestsTable.rejectedAt, today))),
        db.select({ avg_hours: sql<string>`AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / ${SECONDS_PER_HOUR})` }).from(approvalRequestsTable).where(sql`status = ${ApprovalStatus.APPROVED} AND approved_at IS NOT NULL`),
      ]);
      const avgApprovalTimeHours = parseFloat(avgTimeResult[0]?.avg_hours ?? '0');
      return { ok: true, data: { pending: pendingResult[0]?.count ?? 0, approvedToday: approvedResult[0]?.count ?? 0, rejectedToday: rejectedResult[0]?.count ?? 0, avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 100) / 100 } };
    } catch (err) { this.logger.error(`getStats error: ${err}`); return Err('Statistika yuklanishida xatolik'); }
  }
}
