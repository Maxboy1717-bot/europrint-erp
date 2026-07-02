/**
 * @module hitl-approvals.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * Backs the approve/reject endpoints that close the loop on `hitl_approvals` rows written by
 * PoRequiresDirectorApprovalListener, ThreeWayMatchFailedListener and OrderMaterialWaitingListener.
 */
import { Injectable, Logger } from '@nestjs/common';
import { db, hitlApprovals } from '@shared/db';
import { and, desc, eq } from 'drizzle-orm';
import { AppErr, Err, Ok, Result } from '@common/result';
import { HitlApprovalRow, IHitlApprovalsRepo } from '../../domain/repositories/i-hitl-approvals.repo';

@Injectable()
export class HitlApprovalsRepository implements IHitlApprovalsRepo {
  private readonly logger = new Logger(HitlApprovalsRepository.name);

  async listPending(limit: number): Promise<Result<HitlApprovalRow[]>> {
    try {
      const rows = await db
        .select()
        .from(hitlApprovals)
        .where(eq(hitlApprovals.status, 'pending'))
        .orderBy(desc(hitlApprovals.createdAt))
        .limit(limit);
      return Ok(rows as HitlApprovalRow[]);
    } catch (e) {
      this.logger.error(`listPending failed: ${(e as Error).message}`);
      return Err(AppErr('INTERNAL', "HITL tasdiqlash ro'yxatini olishda xatolik"));
    }
  }

  async findById(id: number): Promise<Result<HitlApprovalRow>> {
    try {
      const rows = await db.select().from(hitlApprovals).where(eq(hitlApprovals.id, id)).limit(1);
      const row = rows[0];
      if (!row) return Err(AppErr('NOT_FOUND', `HITL tasdiqlash so'rovi topilmadi: ${id}`));
      return Ok(row as HitlApprovalRow);
    } catch (e) {
      this.logger.error(`findById failed: ${(e as Error).message}`);
      return Err(AppErr('INTERNAL', "HITL tasdiqlash so'rovini olishda xatolik"));
    }
  }

  async approve(id: number, approvedBy: string, notes: string | null): Promise<Result<HitlApprovalRow>> {
    return this.transition(id, 'approved', approvedBy, notes, 'tasdiqlandi', 'tasdiqlashda', 'tasdiqlanadi');
  }

  async reject(id: number, rejectedBy: string, reason: string | null): Promise<Result<HitlApprovalRow>> {
    return this.transition(id, 'rejected', rejectedBy, reason, 'rad etildi', 'rad etishda', 'rad etiladi');
  }

  /**
   * Shared approve/reject implementation: guards on current status being 'pending'
   * (409 CONFLICT otherwise), appends the actor's note to the existing note trail
   * (preserving why the listener originally raised the review item), stamps the
   * actor + timestamp, and returns the updated row.
   */
  private async transition(
    id: number,
    nextStatus: 'approved' | 'rejected',
    actor: string,
    actorNote: string | null,
    logVerb: string,
    errVerbGerund: string,
    errVerbFuture: string,
  ): Promise<Result<HitlApprovalRow>> {
    try {
      const existing = await this.findById(id);
      if (!existing.ok) return existing;
      if (existing.data.status !== 'pending') {
        return Err(AppErr('CONFLICT', `So'rov #${id} allaqachon '${existing.data.status}' holatida — faqat 'pending' so'rov ${errVerbFuture}`));
      }

      const combinedNotes = actorNote
        ? [existing.data.notes, actorNote].filter(Boolean).join(' | ')
        : existing.data.notes;

      const updated = await db
        .update(hitlApprovals)
        .set({
          status: nextStatus,
          approvedBy: actor,
          notes: combinedNotes,
          updatedAt: new Date(),
        })
        .where(and(eq(hitlApprovals.id, id), eq(hitlApprovals.status, 'pending')))
        .returning();

      const row = updated[0];
      if (!row) {
        return Err(AppErr('CONFLICT', `So'rov #${id} boshqa amaliyot bilan bir vaqtda o'zgartirildi — qayta urinib ko'ring`));
      }
      this.logger.log(`HITL approval #${id} ${logVerb} by ${actor}`);
      return Ok(row as HitlApprovalRow);
    } catch (e) {
      this.logger.error(`${errVerbGerund} failed for #${id}: ${(e as Error).message}`);
      return Err(AppErr('INTERNAL', `HITL ${errVerbGerund} xatolik`));
    }
  }
}
