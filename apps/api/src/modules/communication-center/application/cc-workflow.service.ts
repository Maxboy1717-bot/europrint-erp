/**
 * Communication Center — Workflow engine
 *
 * 5 ta asosiy operatsiya: sendDocument / approve / reject / resubmit / cancel.
 * NOTE: approve helpers split into ./cc-workflow/cc-workflow-approve.helpers.ts (Rule 16).
 */

import { Injectable, BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { CcDocumentsRepository, type DocumentRow } from '../infrastructure/repositories/cc-documents.repo';
import { CcDocumentFullyApprovedEvent } from '../domain/events/cc-document-fully-approved.event';
import type { WorkflowStepRow } from '../infrastructure/repositories/cc-documents/types';
import { CcOrgResolverService } from './cc-org-resolver.service';
import { CcPinService } from './cc-pin.service';
import { CcDocumentNumberService } from './cc-document-number.service';
import { CcKanbanBridgeService } from './cc-kanban-bridge.service';
import { unwrapOrThrow } from '@common/http-result';
import { isOk } from '@common/result';
import { safeNum } from '@common/math';
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
    private readonly eventBus: EventBus,
    private readonly kanban:  CcKanbanBridgeService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // CREATE DRAFT
  // ─────────────────────────────────────────────────────────────────────
  async createDraft(senderUserId: number, dto: CreateDraftDto) {
    const tmpl = unwrapOrThrow(await this.docs.getTemplate(dto.templateId));
    if (!tmpl) throw new NotFoundException(await this.i18n.t('errors.templateNotFound'));
    if (!tmpl.isActive) throw new BadRequestException(await this.i18n.t('errors.templateInactive'));

    // 20-cc#11: bola-hujjat faqat ota-hujjat 'approved' yoki 'in_progress' holatida
    // bo'lsagina yaratilishi mumkin — ota hali qoralama/rad/bekor bo'lsa, bog'liq
    // bola-hujjat ma'nosiz (ota hech qachon amalga oshmasligi mumkin).
    if (dto.parentDocumentId) {
      const parent = unwrapOrThrow(await this.docs.getById(dto.parentDocumentId));
      if (!parent) throw new NotFoundException(await this.i18n.t('errors.documentNotFound'));
      if (!['approved', 'in_progress'].includes(parent.workflowState)) {
        throw new BadRequestException(
          `Ota-hujjat holati "${parent.workflowState}" — faqat tasdiqlangan/jarayondagi ota-hujjatga bola-hujjat qo'shish mumkin`,
        );
      }
    }

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
      parentDocumentId: dto.parentDocumentId ?? null,
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
      throw new BadRequestException(
        await this.i18n.t('errors.documentNotDraftState', { args: { state: doc.workflowState } }),
      );
    }
    await this.pin.verifyAndSign(senderUserId, dto.pin, `send:${doc.id}`);

    const { firstStepOrder, firstStepRows } = await this.loadFirstStep(doc);
    const approvers = await this.createFirstStepApprovals(doc, senderUserId, firstStepRows);
    if (approvers.length === 0) {
      throw new BadRequestException(
        await this.i18n.t('errors.firstStepApproverNotFound', { args: { stepOrder: firstStepOrder } }),
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
      const approverResult = await this.org.resolveApprover(step.approverPositionCode, senderUserId);
      if (!approverResult.ok) {
        // CC #3 ambiguous_route: an unresolvable approver used to only be logger.warn'd,
        // so the document could silently deadlock with nobody able to act. Journal it
        // (queryable) AND proactively notify the sender so it never disappears silently.
        this.logger.warn(
          `Step ${step.stepOrder}: approver unresolvable (${approverResult.error.message}) — skipping. Document ${doc.id} may get stuck.`,
        );
        await this.docs.logAudit({
          documentId:        doc.id,
          action:            'approver_unresolved',
          performedByUserId: null,
          comment:           `Bosqich ${step.stepOrder} (${step.approverPositionCode}): imzolovchi aniqlanmadi — ${approverResult.error.message}`,
        });
        await this.docs.notifyUser({
          userId:    senderUserId,
          documentId: doc.id,
          type:      'route_unresolved',
          priority:  'high',
          titleUz:   'Hujjat marshruti aniqlanmadi',
          titleRu:   'Маршрут документа не определён',
          messageUz: `Bosqich ${step.stepOrder} uchun imzolovchi topilmadi; hujjat yuborilmadi.`,
          messageRu: `Не найден утверждающий для этапа ${step.stepOrder}; документ не отправлен.`,
        });
        continue;
      }
      const approverId = approverResult.data;
      // CC #3 ambiguous_route: a POSITION:<CODE> first step matching MORE THAN ONE active
      // employee (e.g. two uchastka heads share one positions.code) is structurally
      // ambiguous — resolveByPosition silently picks the first (ORDER BY e.id ASC LIMIT 1).
      // Keep the pick-one behavior, but JOURNAL the ambiguity (queryable) so the owner can
      // make the template specify "qaysi bo'lim" (vision 20-cc #3). Read-only count, additive log.
      if (/^\s*position:/i.test(step.approverPositionCode)) {
        const ambigR = await this.org.countActiveByPosition(step.approverPositionCode);
        if (ambigR.ok && ambigR.data > 1) {
          this.logger.warn(
            `Step ${step.stepOrder}: POSITION ${step.approverPositionCode} matched ${ambigR.data} active employees — ambiguous_route; picked user ${approverId}. Document ${doc.id}.`,
          );
          await this.docs.logAudit({
            documentId:        doc.id,
            action:            'ambiguous_route',
            performedByUserId: null,
            comment:           `Lavozim ${step.approverPositionCode}: ${ambigR.data} nomzod topildi — birinchisi (foydalanuvchi ${approverId}) tanlandi; shablonda "qaysi bo'lim" aniqlashtirilishi kerak.`,
          });
        }
      }
      // CC #21 self_route_blocked (SoD): the sender can NEVER be their own approver
      // — a doc must not land in the sender's own inbox for self-sign-off. Most
      // resolver branches (dept-head / position / director / ceo) do not exclude the
      // sender, so this is the catch-all guard for every branch. Skip this approval
      // and journal it; if no other approver resolves, sendDocument's
      // approvers.length===0 guard throws firstStepApproverNotFound (400).
      if (approverId === senderUserId) {
        this.logger.warn(
          `Step ${step.stepOrder}: resolved approver === sender (${senderUserId}) — self-route blocked (SoD). Document ${doc.id}.`,
        );
        await this.docs.logAudit({
          documentId:        doc.id,
          action:            'self_route_blocked',
          performedByUserId: null,
          comment:           `Yuboruvchi (${senderUserId}) o'ziga imzo qo'ya olmaydi (SoD); bosqich ${step.stepOrder} o'tkazib yuborildi.`,
        });
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
    await requireDocInProgress(doc, this.i18n);

    const approvals = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
    const mine = await findMyPendingApproval(approvals, approverUserId, this.i18n);

    const sigHash = await this.pin.verifyAndSign(approverUserId, dto.pin, `approve:${doc.id}:${mine.id}`);

    const result = await executeApproveTransaction(
      {
        doc, approverUserId, approvalId: mine.id, signatureHash: sigHash, comment: dto.comment ?? null,
        referenceDocumentNumber: dto.referenceDocumentNumber,
      },
      this.docs, this.org, this.logger, this.i18n,
    );

    // G4: hujjat TO'LIQ tasdiqlandi (oxirgi bosqich) — moliyaviy shablon bo'lsa
    // kassir-ko'prik event'i chiqadi (to'lov AVTO yaratilmaydi — faqat bildirishnoma)
    // + (20-cc#49) GL auto-post listener shu event'ni ham qabul qiladi.
    if (result.status === 'finalized') {
      await this.emitFullyApprovedIfFinancial(doc, approverUserId);
    }
    return result;
  }

  /**
   * G4 approve→kassir ko'prigi: to'liq tasdiqlangan hujjat shabloni
   * ADVANCE/FINANCIAL_AID bo'lsa CcDocumentFullyApprovedEvent chiqaradi.
   * Xato approve javobini buzmasligi kerak — shuning uchun try/catch + logger.error.
   *
   * 20-cc#49 (P0, owner 2026-07-11): event'ga `amount` (ai_answers.amount) va
   * `approverUserId` ham qo'shildi — CcApprovedGlPostingListener shu ikkalasidan
   * foydalanib GL jurnal yozuvini avtomatik yaratadi (musbat summa + gl_account_mappings
   * xaritalash mavjud bo'lsagina — Q-40, fabrikatsiya taqiq).
   */
  private async emitFullyApprovedIfFinancial(doc: DocumentRow, approverUserId: number): Promise<void> {
    try {
      const tmplR = await this.docs.getTemplate(doc.templateId);
      if (!isOk(tmplR) || !tmplR.data) {
        this.logger.error(`emitFullyApprovedIfFinancial(${doc.id}): shablon topilmadi`);
        return;
      }
      const code = tmplR.data.code;
      if (code !== 'ADVANCE' && code !== 'FINANCIAL_AID') return;
      const rawAmount = safeNum(doc.aiAnswers?.['amount'], 0);
      const amount = rawAmount > 0 ? rawAmount : null;
      this.eventBus.publish(new CcDocumentFullyApprovedEvent({
        documentId:     doc.id,
        documentNumber: doc.documentNumber,
        templateCode:   code,
        senderUserId:   doc.senderUserId,
        subject:        doc.subject,
        amount,
        approverUserId,
      }));
      this.logger.log(`CcDocumentFullyApprovedEvent chiqarildi: ${doc.documentNumber} (${code}, amount=${amount ?? 'yo\'q'})`);
    } catch (e) {
      this.logger.error(`emitFullyApprovedIfFinancial(${doc.id}): ${String(e)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // REJECT
  // ─────────────────────────────────────────────────────────────────────
  async reject(documentId: string, approverUserId: number, dto: RejectDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.workflowState !== 'in_progress') {
      throw new BadRequestException(
        await this.i18n.t('errors.rejectNotAllowed', { args: { state: doc.workflowState } }),
      );
    }

    const mine = await findMyRejectableApproval(this.docs, doc, approverUserId, this.i18n);
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
    // CC #36: yangi versiya yaratildi (snapshotVersion + updateBody) — eski Kanban
    // kartaga "[ESKIRGAN]" belgisi qo'yiladi, karta ko'chirilmaydi/o'chirilmaydi.
    // Kanban qo'shimcha funksiya: markCardStale ichida try/catch bor, resubmit'ni to'xtatmaydi.
    await this.kanban.markCardStale(doc.id);
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
