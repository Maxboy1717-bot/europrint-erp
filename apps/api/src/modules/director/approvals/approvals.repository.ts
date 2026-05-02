import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { approvalRequests } from '@europrint/schemas';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class ApprovalsRepository {
  async findExistingPending(documentType: string, documentId: string): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(approvalRequests).where(
        and(
          eq(approvalRequests.documentType, documentType),
          eq(approvalRequests.documentId, documentId),
          eq(approvalRequests.status, 'pending'),
        )
      );
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: typeof approvalRequests.$inferInsert): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.insert(approvalRequests).values(values).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findById(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async approve(id: number, approvedBy: string, notes?: string): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(approvalRequests)
        .set({ status: 'approved', approvedBy, notes, approvedAt: _time.now() } as never)
        .where(eq(approvalRequests.id, id))
        .returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async reject(id: number, notes?: string): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(approvalRequests)
        .set({ status: 'rejected', notes } as never)
        .where(eq(approvalRequests.id, id))
        .returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
