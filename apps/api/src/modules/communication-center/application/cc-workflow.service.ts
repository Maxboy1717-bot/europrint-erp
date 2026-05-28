/**
 * Communication Center — Workflow engine
 *
 * 5 ta asosiy operatsiya: sendDocument / approve / reject / resubmit / cancel.
 * NOTE: approve helpers split into ./cc-workflow/cc-workflow-approve.helpers.ts (Rule 16).
 */

import { Injectable, BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CcDocumentsRepository, type DocumentRow } from '../infrastructure/repositories/cc-documents.repo';
import type { WorkflowStepRow } from '../infrastructure/repositories/cc-documents/types';
import { CcOrgResolverService } from './cc-org-resolver.service';
import { CcPinService } from './cc-pin.service';
import { CcDocumentNumberService } from './cc-document-number.service';
import { unwrapOrThrow } from '@common/http-result';
import { isOk } from '@common/result';
import { db } from '@shared/db';
import {
  executeApproveTransaction, findMyPendingApproval, requireDocInProgress,
} from './cc-workflow/cc-workflow-approve.helpers';
import {
  findMyRejectableApproval, signRejection, allApprovalsResolved, finalizeReject, runResubmitTx,
} from './cc-workflow/cc-workflow-reject-resubmit.helpers';
import type {
  CreateDraftDto, SendDocumentDto, ApproveDto, RejectDto, ResubmitDto, CancelDto,
} from './cc-workflow.types';

// Re-export DTOs so consumers importing from './cc-workflow.service' keep working
export type {
  CreateDraftDto, SendDocumentDto, ApproveDto, RejectDto, ResubmitDto, CancelDto,
} from './cc-workflow.types';

@Injectable()
export class CcWorkflowService {
  private readonly logger = new Logger(CcWorkflowService.name);

  constructor(
    private readonly docs:    CcDocumentsRepository,
    private readonly org:     CcOrgResolverService,
    private readonly pin:     CcPinService,
    private readonly numbers: CcDocumentNumberService,
    private readonly i18n:    I18nService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // CREATE DRAFT
  // ─────────────────────────────────────────────────────────────────────
  async createDraft(senderUserId: number, dto: CreateDraftDto) {
    const tmpl = unwrapOrThrow(await this.docs.getTemplate(dto.templateId));
    if (!tmpl) throw new NotFoundException(await this.i18n.t('errors.templateNotFound'));
    if (!tmpl.isActive) throw new BadRequestException(await this.i18n.t('errors.templateInactive'));

    const docNumR = await this.numbers.generate(tmpl.id, tmpl.numberFormat);
    if (!isOk(docNumR)) throw new BadRequestException(docNumR.error.message);
    const documentNumber = docNumR.data;

    const created = unwrapOrThrow(await this.docs.createDraft({
      templateId:      tmpl.id,
      templateVersion: tmpl.version,
      senderUserId,
      branchId:        dto.branchId ?? null,
      subject:         dto.subject,
      aiBody:          dto.aiBody,
      aiAnswers:       dto.aiAnswers ?? {},
      senderComment:   dto.senderComment ?? null,
      priority:        dto.priority ?? tmpl.defaultPriority,
      language:        dto.language ?? 'uz',
      documentNumber,
    }));
    return created;
  }

  // ─────────────────────────────────────────────────────────────────────
  // SEND
  // ─────────────────────────────────────────────────────────────────────
  async sendDocument(documentId: string, senderUserId: number, dto: SendDocumentDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException(await this.i18n.t('errors.onlySenderCanSend'));
    }
    if (doc.workflowState !== 'draft') {
      throw new BadRequestException(`${await this.i18n.t('errors.duplicateEntry')} (${doc.workflowState})`);
    }
    await this.pin.verifyAndSign(senderUserId, dto.pin, `send:${doc.id}`);

    const { firstStepOrder, firstStepRows } = await this.loadFirstStep(doc);
    const approvers = await this.createFirstStepApprovals(doc, senderUserId, firstStepRows);
    if (approvers.length === 0) {
      throw new BadRequestException(
        `Birinchi bosqich (${firstStepOrder}) uchun mas'ul xodim topilmadi. ` +
        `Workflow sozlamalarini tekshiring yoki administrator bilan bog'laning.`,
      );
    }

    await this.transitionToFirstStep(doc, senderUserId, approvers[0], firstStepOrder);
    return { ok: true, documentId: doc.id, currentStepOrder: firstStepOrder, pendingApproverIds: approvers };
  }

  private async transitionToFirstStep(doc: DocumentRow, senderUserId: number, primaryOwner: number, firstStepOrder: number): Promise<void> {
    unwrapOrThrow(await this.docs.transition({
      documentId:       doc.id,
      newBasketState:   'inbox',
      newBasketOwnerId: primaryOwner,
      newWorkflowState: 'in_progress',
      newCurrentStep:   firstStepOrder,
      actorUserId:      senderUserId,
      auditAction:      'sent',
      auditComment:     null,
    }));
  }

  private async loadFirstStep(doc: DocumentRow): Promise<{
    firstStepOrder: number;
    firstStepRows: WorkflowStepRow[];
  }> {
    const steps = unwrapOrThrow(await this.docs.getStepsForTemplate(doc.templateId, doc.templateVersion));
    if (steps.length === 0) {
      throw new BadRequestException(await this.i18n.t('errors.workflowStagesNotConfigured'));
    }
    const firstStepOrder = steps[0].stepOrder;
    const firstStepRows = steps.filter(s => s.stepOrder === firstStepOrder);
    return { firstStepOrder, firstStepRows };
  }

  private async createFirstStepApprovals(
    doc: DocumentRow,
    senderUserId: number,
    firstStepRows: WorkflowStepRow[],
  ): Promise<number[]> {
    const approvers: number[] = [];
    for (const step of firstStepRows) {
      const approverId = await this.org.resolveApprover(step.approverPositionCode, senderUserId);
      if (!approverId) {
        this.logger.warn(`Step ${step.stepOrder}: approver unresolvable — skipping. Document ${doc.id} may get stuck.`);
        continue;
      }
      approvers.push(approverId);
      unwrapOrThrow(await this.docs.createApproval({
        documentId:     doc.id,
        stepOrder:      step.stepOrder,
        approverUserId: approverId,
        deadlineHours:  step.timeLimitHours,
        rejectionStops: step.rejectionStops,
      }));
    }
    return approvers;
  }

  // ─────────────────────────────────────────────────────────────────────
  // APPROVE
  // ─────────────────────────────────────────────────────────────────────
  async approve(documentId: string, approverUserId: number, dto: ApproveDto) {
    const doc = await this.requireDoc(documentId);
    requireDocInProgress(doc);

    const approvals = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
    const mine = findMyPendingApproval(approvals, approverUserId);

    const sigHash = await this.pin.verifyAndSign(approverUserId, dto.pin, `approve:${doc.id}:${mine.id}`);

    return executeApproveTransaction(
      { doc, approverUserId, approvalId: mine.id, signatureHash: sigHash, comment: dto.comment ?? null },
      this.docs, this.org, this.logger,
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // REJECT
  // ─────────────────────────────────────────────────────────────────────
  async reject(documentId: string, approverUserId: number, dto: RejectDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.workflowState !== 'in_progress') {
      throw new BadRequestException(`${await this.i18n.t('errors.rejectNotAllowed')} (${doc.workflowState})`);
    }

    const mine = await findMyRejectableApproval(this.docs, doc, approverUserId);
    await signRejection(this.docs, this.pin, doc, mine, approverUserId, dto);

    if (mine.rejectionStops || await allApprovalsResolved(doc.id)) {
      await finalizeReject(this.docs, doc, approverUserId, dto.comment ?? null);
      return { ok: true, status: 'finalized_rejected' };
    }
    return { ok: true, status: 'partial_reject' };
  }

  // ─────────────────────────────────────────────────────────────────────
  // RESUBMIT
  // ─────────────────────────────────────────────────────────────────────
  async resubmit(documentId: string, senderUserId: number, dto: ResubmitDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException(await this.i18n.t('errors.onlySenderCanResubmit'));
    }
    if (doc.workflowState !== 'rejected') {
      throw new BadRequestException(await this.i18n.t('errors.onlyRejectedCanBeResubmitted'));
    }

    const newVersion = doc.version + 1;
    try {
      await db.transaction(async () => { await runResubmitTx(this.docs, doc, senderUserId, dto, newVersion); });
    } catch (err) {
      this.logger.error(`resubmit transaction failed for doc ${doc.id}: ${String(err)}`);
      throw new BadRequestException(await this.i18n.t('errors.resubmitFailed'));
    }
    return await this.sendDocument(doc.id, senderUserId, { pin: dto.pin });
  }

  // ─────────────────────────────────────────────────────────────────────
  // CANCEL / COMPLAINT / PRINT
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

  async createComplaint(documentId: string, complainantUserId: number, reason: string) {
    const doc = await this.requireDoc(documentId);
    const complaintId = unwrapOrThrow(await this.docs.createComplaint({
      documentId: doc.id, complainantUserId, reason,
    }));
    return { ok: true, complaintId };
  }

  async logPrint(documentId: string, printedByUserId: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException(await this.i18n.t('errors.printReasonRequired'));
    const doc = await this.requireDoc(documentId);
    unwrapOrThrow(await this.docs.logPrint({
      documentId: doc.id, printedByUserId, reason,
    }));
    return { ok: true };
  }

  private async requireDoc(documentId: string): Promise<DocumentRow> {
    const doc = unwrapOrThrow(await this.docs.getById(documentId));
    if (!doc) throw new NotFoundException(await this.i18n.t('errors.documentNotFound'));
    return doc;
  }
}
