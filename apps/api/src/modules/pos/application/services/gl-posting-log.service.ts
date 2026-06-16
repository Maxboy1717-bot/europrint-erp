/**
 * @module gl-posting-log.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { GlPostingLogRepository } from '../../infrastructure/repositories/gl-posting-log.repository';
import { glPostingLog } from '@workspace/db';

type GlLog = typeof glPostingLog.$inferSelect;

interface GlJournalEntry {
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
}

@Injectable()
export class GlPostingLogService {
  private readonly logger = new Logger(GlPostingLogService.name);

  constructor(private readonly repo: GlPostingLogRepository) {}

  async getByMovement(movementId: number): Promise<Result<GlLog[], AppError>> {
    try {
      const r = await this.repo.getByMovement(movementId);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async getPending(): Promise<Result<GlLog[], AppError>> {
    try {
      const r = await this.repo.getPendingEntries();
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async getJournal(): Promise<Result<GlLog[], AppError>> {
    try {
      const r = await this.repo.getJournal(200);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async approveEntry(id: number, approvedBy: number): Promise<Result<GlLog, AppError>> {
    try {
      const r = await this.repo.approveEntry(id, approvedBy);
      if (!r.ok) return Err(r.error);
      this.logger.log(`[GL] Entry ${id} approved by ${approvedBy}`);
      await this.postToLedger(r.data.movementId, approvedBy);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async rejectEntry(id: number, approvedBy: number): Promise<Result<GlLog, AppError>> {
    try {
      const r = await this.repo.rejectEntry(id, approvedBy);
      if (!r.ok) return Err(r.error);
      this.logger.log(`[GL] Entry ${id} rejected by ${approvedBy}`);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async approveByMovement(movementId: number, approvedBy: number): Promise<Result<GlLog[], AppError>> {
    try {
      const r = await this.repo.approveByMovement(movementId, approvedBy);
      if (!r.ok) return Err(r.error);
      this.logger.log(`[GL] Movement ${movementId}: ${r.data.length} entries approved by ${approvedBy}`);
      await this.postToLedger(movementId, approvedBy);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /**
   * BOSQICH 2 — post the approved movement's GL to the canonical `entries` ledger.
   * Non-fatal: a missing account mapping (gl_account_mappings is owner/accountant data) just logs a
   * warning and posts nothing, rather than failing the approval or inventing accounts (Q-40).
   */
  /**
   * #03 HOP-5: auto-post a COMPLETED movement straight to the canonical `entries` ledger — idempotent
   * (skips if document_type='pos_movement'+document_id already posted), mapping-driven, and INDEPENDENT
   * of the gl_posting_log approve flow (that table is absent live). This is the event-driven path so a
   * stock movement/sale produces a real ledger row without a manual approve click.
   */
  async postMovementToCanonicalLedger(movementId: number, postedBy: number): Promise<void> {
    await this.postToLedger(movementId, postedBy);
  }

  private async postToLedger(movementId: number, approvedBy: number): Promise<void> {
    const post = await this.repo.postMovementToLedger(movementId, approvedBy);
    if (post.ok && post.data.posted) {
      this.logger.log(`[GL] Movement ${movementId} → canonical entries ledger ✓`);
    } else if (post.ok) {
      this.logger.warn(`[GL] Movement ${movementId} NOT posted to ledger: ${post.data.reason}`);
    } else {
      this.logger.error(`[GL] Movement ${movementId} ledger posting error: ${String(post.error)}`);
    }
  }

  async recordStage(
    movementId: number,
    stage: number,
    stageName: 'EXTRACT' | 'CLASSIFY' | 'COMPUTE' | 'VERIFY' | 'POST',
    status: 'PROCESSING' | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'POSTED',
    glEntries?: GlJournalEntry[],
    aiConfidence?: number,
    errorMessage?: string,
  ): Promise<Result<GlLog, AppError>> {
    try {
      const r = await this.repo.insertLog({
        movementId,
        stage,
        stageName,
        status,
        glEntries: glEntries ?? [],
        aiConfidence: aiConfidence != null ? String(aiConfidence) : null,
        errorMessage,
        processedAt: new Date(),
      });
      if (!r.ok) return Err(r.error);
      this.logger.log(`[GL] Stage ${stageName} recorded for movement ${movementId}`);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }
}
