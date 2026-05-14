/**
 * Communication Center — Workflow engine
 *
 * 5 ta asosiy operatsiya:
 *   - sendDocument()     : qoralamani rasmiy yuborish (PIN bilan)
 *   - approve()          : tasdiqlash
 *   - reject()           : rad etish
 *   - resubmit()         : rad etilgan hujjatni yangi versiya bilan qayta yuborish
 *   - cancel()           : yuboruvchi bekor qiladi
 *
 * Jarayon:
 *   - sendDocument: birinchi step uchun approver(lar) topiladi → cc_approvals
 *     yozuvlari yaratiladi → hujjat birinchi approver inbox'iga tushadi.
 *   - approve: bu step ning rejection_stops bayrog'iga qarab parallel/sequential
 *     mantiq ishlaydi. Hammasi tasdiqlasa keyingi step'ga yoki yakuniy 'approved'.
 *   - reject: agar bu approver rejection_stops bo'lsa → 'rejected', sender outbox.
 *   - resubmit: yangi versiya yozuvi → workflow qayta boshlanadi.
 */

import { Injectable, BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { CcDocumentsRepository, type DocumentRow } from '../infrastructure/repositories/cc-documents.repo';
import { CcOrgResolverService } from './cc-org-resolver.service';
import { CcPinService } from './cc-pin.service';
import { CcDocumentNumberService } from './cc-document-number.service';
import { unwrapOrThrow } from '@common/http-result';
import { sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import type { Priority, Language } from '../domain/types';

export interface CreateDraftDto {
  templateId:    string;
  subject:       string;
  aiBody:        string;
  aiAnswers?:    Record<string, unknown>;
  senderComment?: string;
  priority?:     Priority;
  language?:     Language;
  branchId?:     string;
}

export interface SendDocumentDto { pin: string }
export interface ApproveDto      { pin: string; comment?: string }
export interface RejectDto       { pin: string; rejectionReasonId?: string; comment?: string }
export interface ResubmitDto     { pin: string; aiBody: string; senderComment?: string }
export interface CancelDto       { pin: string; reason: string }

@Injectable()
export class CcWorkflowService {
  private readonly logger = new Logger(CcWorkflowService.name);

  constructor(
    private readonly docs:    CcDocumentsRepository,
    private readonly org:     CcOrgResolverService,
    private readonly pin:     CcPinService,
    private readonly numbers: CcDocumentNumberService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // CREATE DRAFT
  // ─────────────────────────────────────────────────────────────────────
  async createDraft(senderUserId: number, dto: CreateDraftDto) {
    const tmpl = unwrapOrThrow(await this.docs.getTemplate(dto.templateId));
    if (!tmpl) throw new NotFoundException('Hujjat shabloni topilmadi');
    if (!tmpl.isActive) throw new BadRequestException('Bu shablon faol emas');

    const documentNumber = await this.numbers.generate(tmpl.id, tmpl.numberFormat);

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
  // SEND (qoralama → kutilmoqda → birinchi approver inbox)
  // ─────────────────────────────────────────────────────────────────────
  async sendDocument(documentId: string, senderUserId: number, dto: SendDocumentDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException('Faqat yuboruvchi yuborishi mumkin');
    }
    if (doc.workflowState !== 'draft') {
      throw new BadRequestException(`Hujjat allaqachon yuborilgan (holat: ${doc.workflowState})`);
    }

    // PIN tekshirish (yuboruvchining imzosi audit'ga kirmaydi, lekin uni majburiy tekshiramiz)
    await this.pin.verifyAndSign(senderUserId, dto.pin, `send:${doc.id}`);

    // Birinchi step'ni topish
    const steps = unwrapOrThrow(await this.docs.getStepsForTemplate(doc.templateId, doc.templateVersion));
    if (steps.length === 0) {
      throw new BadRequestException('Bu hujjat turida workflow bosqichlari sozlanmagan');
    }
    const firstStepOrder = steps[0].stepOrder;
    const firstStepRows  = steps.filter(s => s.stepOrder === firstStepOrder);

    // Har bir parallel approver uchun cc_approvals yozuvi
    const approvers: number[] = [];
    for (const step of firstStepRows) {
      const approverId = await this.org.resolveApprover(step.approverPositionCode, senderUserId);
      if (!approverId) {
        this.logger.warn(`Step ${step.stepOrder}: approver unresolvable — skipping. Document ${documentId} may get stuck.`);
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

    // Hech qanday approver topilmasa — hujjat imzosiz o'tmaydi
    if (approvers.length === 0) {
      throw new BadRequestException(
        `Birinchi bosqich (${firstStepOrder}) uchun mas'ul xodim topilmadi. ` +
        `Workflow sozlamalarini tekshiring yoki administrator bilan bog'laning.`
      );
    }

    // Hujjatni birinchi approver inbox'iga ko'chirish
    // (parallel bo'lsa ham, bitta "asosiy" owner — birinchi approver; qolganlari approval yozuvi orqali ko'rishadi)
    const primaryOwner = approvers[0];

    // Use 'in_progress' for all sent documents — both parallel (multi-approver) and
    // sequential (single approver). This gives a single, unambiguous "waiting for approval"
    // state. 'sent' was never persisted in cc_approvals and caused confusion in the approve()
    // guard that had to accept ['sent', 'in_progress'] as equivalent.
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

    return {
      ok:                 true,
      documentId:         doc.id,
      currentStepOrder:   firstStepOrder,
      pendingApproverIds: approvers,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // APPROVE
  // ─────────────────────────────────────────────────────────────────────
  async approve(documentId: string, approverUserId: number, dto: ApproveDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.workflowState !== 'in_progress') {
      throw new BadRequestException(`Tasdiqlab bo'lmaydi (holat: ${doc.workflowState})`);
    }

    // Joriy step'ning approval'lari
    const approvals = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
    const mine = approvals.find(a => a.approverUserId === approverUserId && a.state === 'pending');
    if (!mine) throw new ForbiddenException('Sizga bu hujjatni tasdiqlash huquqi berilmagan yoki allaqachon imzolagansiz');

    // PIN tekshirish transaksiyadan tashqarida (xavfsiz — faqat o'qish/hashing)
    const sigHash = await this.pin.verifyAndSign(approverUserId, dto.pin, `approve:${doc.id}:${mine.id}`);

    // Approve, next-step creation va transition — bitta atomic transaksiya
    try {
      return await db.transaction(async () => {
        unwrapOrThrow(await this.docs.signApproval({
          approvalId:        mine.id,
          state:             'approved',
          signatureHash:     sigHash,
          rejectionReasonId: null,
          comment:           dto.comment ?? null,
        }));

      // Step yakunlanishini tekshirish: hammasi tasdiqlanganmi (parallel) yoki sequential
      const updated = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
      const stillPending = updated.filter(a => a.state === 'pending');

      if (stillPending.length > 0) {
        // parallel: hali boshqalari kutilmoqda — workflow holatini saqlaymiz
        return { ok: true, status: 'partial', remainingApprovers: stillPending.map(a => a.approverUserId) };
      }

      // Hammasi tasdiqlangan — keyingi step yoki yakuniy 'approved'
      const steps = unwrapOrThrow(await this.docs.getStepsForTemplate(doc.templateId, doc.templateVersion));
      const stepOrders = [...new Set(steps.map(s => s.stepOrder))].sort((a, b) => a - b);
      const idx = stepOrders.indexOf(doc.currentStepOrder);
      const nextOrder = idx >= 0 && idx < stepOrders.length - 1 ? stepOrders[idx + 1] : null;

      if (nextOrder == null) {
        // Yakuniy tasdiq → sender outbox
        unwrapOrThrow(await this.docs.transition({
          documentId:       doc.id,
          newBasketState:   'outbox',
          newBasketOwnerId: doc.senderUserId,
          newWorkflowState: 'approved',
          newCurrentStep:   doc.currentStepOrder,
          actorUserId:      approverUserId,
          auditAction:      'approved',
          auditComment:     dto.comment ?? null,
        }));
        return { ok: true, status: 'finalized' };
      }

      // Keyingi step approver(lar)ini yaratish
      const nextRows = steps.filter(s => s.stepOrder === nextOrder);
      const nextApprovers: number[] = [];
      for (const step of nextRows) {
        const approverId = await this.org.resolveApprover(step.approverPositionCode, doc.senderUserId);
        if (!approverId) {
          this.logger.warn(`Step ${step.stepOrder}: approver unresolvable — skipping. Document ${documentId} may get stuck.`);
          continue;
        }
        nextApprovers.push(approverId);
        unwrapOrThrow(await this.docs.createApproval({
          documentId:     doc.id,
          stepOrder:      step.stepOrder,
          approverUserId: approverId,
          deadlineHours:  step.timeLimitHours,
          rejectionStops: step.rejectionStops,
        }));
      }
      const primaryNext = nextApprovers[0];

      unwrapOrThrow(await this.docs.transition({
        documentId:       doc.id,
        newBasketState:   'inbox',
        newBasketOwnerId: primaryNext,
        newWorkflowState: 'in_progress',
        newCurrentStep:   nextOrder,
        actorUserId:      approverUserId,
        auditAction:      'approved',
        auditComment:     dto.comment ?? null,
      }));

      return { ok: true, status: 'advanced', nextStepOrder: nextOrder, nextApproverIds: nextApprovers };
    });
    } catch (e) {
      throw new Error(`ccWorkflow.approve: ${String(e)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // REJECT
  // ─────────────────────────────────────────────────────────────────────
  async reject(documentId: string, approverUserId: number, dto: RejectDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.workflowState !== 'in_progress') {
      throw new BadRequestException(`Rad etib bo'lmaydi (holat: ${doc.workflowState})`);
    }

    const approvals = unwrapOrThrow(await this.docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
    const mine = approvals.find(a => a.approverUserId === approverUserId && a.state === 'pending');
    if (!mine) throw new ForbiddenException('Sizga bu hujjatni rad etish huquqi berilmagan');

    const sigHash = await this.pin.verifyAndSign(approverUserId, dto.pin, `reject:${doc.id}:${mine.id}`);

    unwrapOrThrow(await this.docs.signApproval({
      approvalId:        mine.id,
      state:             'rejected',
      signatureHash:     sigHash,
      rejectionReasonId: dto.rejectionReasonId ?? null,
      comment:           dto.comment ?? null,
    }));

    // Agar bu approver to'xtatuvchi bo'lsa → workflow rejected, sender outbox
    if (mine.rejectionStops) {
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
      return { ok: true, status: 'finalized_rejected' };
    }

    // To'xtatuvchi emas — qolgan pending approvallarni tekshirish
    const remaining = await runQuery<{ c: string }>(sql`
      SELECT COUNT(*)::text AS c FROM cc_approvals
      WHERE document_id = ${doc.id} AND state = 'pending'
    `);
    if (Number(remaining.rows[0]?.c ?? '0') === 0) {
      // Barcha approverlar rad etdi yoki imzoladi, hech kim pending qolmadi → reject
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
      return { ok: true, status: 'finalized_rejected' };
    }
    return { ok: true, status: 'partial_reject' };
  }

  // ─────────────────────────────────────────────────────────────────────
  // RESUBMIT (rejected → new version → restart workflow)
  // ─────────────────────────────────────────────────────────────────────
  async resubmit(documentId: string, senderUserId: number, dto: ResubmitDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException('Faqat yuboruvchi qayta yuborishi mumkin');
    }
    if (doc.workflowState !== 'rejected') {
      throw new BadRequestException("Faqat rad etilgan hujjatlarni qayta yuborish mumkin");
    }

    // PIN tekshirish transaksiyadan tashqarida (hashing operatsiyasi)
    // sendDocument() ichida qayta tekshiriladi, shuning uchun bu yerda alohida verify kerak emas.

    // Snapshot + body update + draft transition — bitta atomic transaksiya
    const newVersion = doc.version + 1;
    await db.transaction(async () => {
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
    });

    // Qayta yuborish (sendDocument o'z ichida PIN tekshiradi)
    return await this.sendDocument(doc.id, senderUserId, { pin: dto.pin });
  }

  // ─────────────────────────────────────────────────────────────────────
  // CANCEL (sender bekor qiladi)
  // ─────────────────────────────────────────────────────────────────────
  async cancel(documentId: string, senderUserId: number, dto: CancelDto) {
    const doc = await this.requireDoc(documentId);
    if (doc.senderUserId !== senderUserId) {
      throw new ForbiddenException('Faqat yuboruvchi bekor qila oladi');
    }
    if (['cancelled', 'archived'].includes(doc.workflowState)) {
      throw new BadRequestException("Hujjat allaqachon bekor qilingan yoki arxivlangan");
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
    if (!reason?.trim()) throw new BadRequestException('Chop etish sababi majburiy');
    const doc = await this.requireDoc(documentId);
    unwrapOrThrow(await this.docs.logPrint({
      documentId: doc.id, printedByUserId, reason,
    }));
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────────────
  private async requireDoc(documentId: string): Promise<DocumentRow> {
    const doc = unwrapOrThrow(await this.docs.getById(documentId));
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    return doc;
  }
}
