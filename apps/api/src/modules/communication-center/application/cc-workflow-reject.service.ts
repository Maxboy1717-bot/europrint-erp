/**
 * @module cc-workflow-reject.service
 * @description Reject / resubmit / cancel / complaint / print handlers extracted
 *   from cc-workflow.service.ts to keep that file <300 lines (Rule 16).
 */

import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CcDocumentsRepository, type DocumentRow } from '../infrastructure/repositories/cc-documents.repo';
import { CcPinService } from './cc-pin.service';
import { unwrapOrThrow } from '@common/http-result';
import { sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import type { RejectDto, ResubmitDto, CancelDto } from './cc-workflow.types';

@Injectable()
export class CcWorkflowRejectService {
  private readonly logger = new Logger(CcWorkflowRejectService.name);

  constructor(
    private readonly docs: CcDocumentsRepository,
    private readonly pin:  CcPinService,
    private readonly i18n: I18nService,
  ) {}

  private async requireDoc(documentId: string): Promise<DocumentRow> {
    const doc = unwrapOrThrow(await this.docs.getById(documentId));
    if (!doc) throw new NotFoundException(await this.i18n.t('errors.documentNotFound'));
    return doc;
  }

  // ─────────────────────────────────────────────────────────────────────
  // REJECT
  // ─────────────────────────────────────────────────────────────────────
  async reject(documentId: string, approverUserId: number, dto: RejectDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.workflowState !== 'in_progress') {
      throw new BadRequestException(`${await this.i18n.t('errors.rejectNotAllowed')} (${doc.workflowState})`);
    }

    const mine = await this.requireMyApproval(doc, approverUserId);
    await this.recordRejection(doc, mine, approverUserId, dto);

    if (mine.rejectionStops) {
      await this.finalizeReject(doc, approverUserId, dto);
      return { ok: true, status: 'finalized_rejected' };
    }

    if (await this.noPendingLeft(doc.id)) {
      await this.finalizeReject(doc, approverUserId, dto);
      return { ok: true, status: 'finalized_rejected' };
    }
    return { ok: true, status: 'partial_reject' };
  }

  private async requireMyApproval(
    doc: DocumentRow,
    approverUserId: number,
  ): Promise<{ id: string; approverUserId: number; state: string; rejectionStops: boolean }> {
    const approvals = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
    const mine = approvals.find(a => a.approverUserId === approverUserId && a.state === 'pending');
    if (!mine) throw new ForbiddenException(await this.i18n.t('errors.noRejectPermission'));
    return mine;
  }

  private async recordRejection(
    doc: DocumentRow,
    mine: { id: string },
    approverUserId: number,
    dto: RejectDto,
  ): Promise<void> {
    const sigHash = await this.pin.verifyAndSign(approverUserId, dto.pin, `reject:${doc.id}:${mine.id}`);
    unwrapOrThrow(await this.docs.signApproval({
      approvalId:        mine.id,
      state:             'rejected',
      signatureHash:     sigHash,
      rejectionReasonId: dto.rejectionReasonId ?? null,
      comment:           dto.comment ?? null,
    }));
  }

  private async noPendingLeft(documentId: string): Promise<boolean> {
    const remaining = await runQuery<{ c: string }>(sql`
      SELECT COUNT(*)::text AS c FROM cc_approvals
      WHERE document_id = ${documentId} AND state = 'pending'
    `);
    return Number(remaining.rows[0]?.c ?? '0') === 0;
  }

  private async finalizeReject(doc: DocumentRow, approverUserId: number, dto: RejectDto): Promise<void> {
    // Use transition() so the audit log entry is written (not a raw UPDATE)
    unwrapOrThrow(await this.docs.transition({
      documentId:       doc.id,
      newBasketState:   'outbox',
      newBasketOwnerId: doc.senderUserId,
      newWorkflowState: 'rejected',
      newCurrentStep:   doc.currentStepOrder,
      actorUserId:      approverUserId,
      auditAction:      'rejected',
      auditComment:     dto.comment ?? null,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  // RESUBMIT (rejected → new version → caller must re-call sendDocument)
  // ─────────────────────────────────────────────────────────────────────
  async resubmitPrepare(documentId: string, senderUserId: number, dto: ResubmitDto): Promise<DocumentRow> {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException(await this.i18n.t('errors.onlySenderCanResubmit'));
    }
    if (doc.workflowState !== 'rejected') {
      throw new BadRequestException(await this.i18n.t('errors.onlyRejectedCanBeResubmitted'));
    }

    const newVersion = doc.version + 1;
    try {
      await db.transaction(async () => {
        await this.runResubmitTx(doc, senderUserId, dto, newVersion);
      });
    } catch (err) {
      this.logger.error(`resubmit transaction failed for doc ${doc.id}: ${String(err)}`);
      throw new BadRequestException(await this.i18n.t('errors.resubmitFailed'));
    }
    return doc;
  }

  private async runResubmitTx(
    doc: DocumentRow,
    senderUserId: number,
    dto: ResubmitDto,
    newVersion: number,
  ): Promise<void> {
    // 1) Eski versiyani snapshot qilish
    unwrapOrThrow(await this.docs.snapshotVersion({
      documentId:      doc.id,
      version:         doc.version,
      aiBody:          doc.aiBody,
      senderComment:   doc.senderComment,
      createdByUserId: senderUserId,
    }));

    // 2) Yangi versiya bilan yangilash
    unwrapOrThrow(await this.docs.updateBody({
      documentId:    doc.id,
      aiBody:        dto.aiBody,
      senderComment: dto.senderComment ?? null,
      newVersion,
    }));

    // 3) Workflow qayta boshlanadi (workflowState=draft, currentStep=0)
    unwrapOrThrow(await this.docs.transition({
      documentId:       doc.id,
      newBasketState:   'outbox',
      newBasketOwnerId: senderUserId,
      newWorkflowState: 'draft',
      newCurrentStep:   0,
      actorUserId:      senderUserId,
      auditAction:      'reopened',
      auditComment:     `Qayta yuborildi (v${newVersion})`,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  // CANCEL (sender bekor qiladi)
  // ─────────────────────────────────────────────────────────────────────
  async cancel(documentId: string, senderUserId: number, dto: CancelDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException(await this.i18n.t('errors.onlySenderCanCancel'));
    }
    if (['cancelled', 'archived'].includes(doc.workflowState)) {
      throw new BadRequestException(await this.i18n.t('errors.alreadyCancelledOrArchived'));
    }
    await this.pin.verifyAndSign(senderUserId, dto.pin, `cancel:${doc.id}`);
    unwrapOrThrow(await this.docs.cancel({
      documentId: doc.id, cancelledByUserId: senderUserId, reason: dto.reason,
    }));
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────────────
  // COMPLAINT (faqat direktorga)
  // ─────────────────────────────────────────────────────────────────────
  async createComplaint(documentId: string, complainantUserId: number, reason: string) {
    const doc = await this.requireDoc(documentId);
    const complaintId = unwrapOrThrow(await this.docs.createComplaint({
      documentId: doc.id, complainantUserId, reason,
    }));
    return { ok: true, complaintId };
  }

  // ─────────────────────────────────────────────────────────────────────
  // PRINT (sabab majburiy)
  // ─────────────────────────────────────────────────────────────────────
  async logPrint(documentId: string, printedByUserId: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException(await this.i18n.t('errors.printReasonRequired'));
    const doc = await this.requireDoc(documentId);
    unwrapOrThrow(await this.docs.logPrint({
      documentId: doc.id, printedByUserId, reason,
    }));
    return { ok: true };
  }
}
