/**
 * @module cc-workflow/cc-workflow-approve.helpers
 * @description Approval transaction helper extracted from CcWorkflowService
 *   (Rule 16 file-size split). Pure orchestration over CcDocumentsRepository.
 */

import { Logger, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { unwrapOrThrow } from '@common/http-result';
import { db } from '@shared/db';
import type { CcDocumentsRepository, DocumentRow } from '../../infrastructure/repositories/cc-documents.repo';
import type { CcOrgResolverService } from '../cc-org-resolver.service';

export interface ApproveArgs {
  doc: DocumentRow;
  approverUserId: number;
  approvalId: string;
  signatureHash: string;
  comment: string | null;
  /** 20-cc#89: ERP web'da majburiy, Telegram bot yo'lida hali ixtiyoriy (yuqoridagi izoh). */
  referenceDocumentNumber?: string;
}

export async function executeApproveTransaction(
  args: ApproveArgs,
  docs: CcDocumentsRepository,
  org: CcOrgResolverService,
  logger: Logger,
  i18n: I18nService,
): Promise<{ ok: true; status: string; remainingApprovers?: number[]; nextStepOrder?: number; nextApproverIds?: number[] }> {
  const { doc, approverUserId, approvalId, signatureHash, comment, referenceDocumentNumber } = args;

  try {
    return await db.transaction(async () => {
      unwrapOrThrow(await docs.signApproval({
        approvalId, state: 'approved',
        signatureHash, rejectionReasonId: null, comment, referenceDocumentNumber,
      }));

      const updated = unwrapOrThrow(await docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
      const stillPending = updated.filter(a => a.state === 'pending');

      if (stillPending.length > 0) {
        return { ok: true, status: 'partial', remainingApprovers: stillPending.map(a => a.approverUserId) };
      }

      const steps = unwrapOrThrow(await docs.getStepsForTemplate(doc.templateId, doc.templateVersion));
      const stepOrders = [...new Set(steps.map(s => s.stepOrder))].sort((a, b) => a - b);
      const idx = stepOrders.indexOf(doc.currentStepOrder);
      const nextOrder = idx >= 0 && idx < stepOrders.length - 1 ? stepOrders[idx + 1] : null;

      if (nextOrder == null) {
        unwrapOrThrow(await docs.transition({
          documentId: doc.id,
          newBasketState: 'outbox',
          newBasketOwnerId: doc.senderUserId,
          newWorkflowState: 'approved',
          newCurrentStep: doc.currentStepOrder,
          actorUserId: approverUserId,
          auditAction: 'approved',
          auditComment: comment,
        }));
        return { ok: true, status: 'finalized' };
      }

      const nextRows = steps.filter(s => s.stepOrder === nextOrder);
      const nextApprovers: number[] = [];
      for (const step of nextRows) {
        const approverResult = await org.resolveApprover(step.approverPositionCode, doc.senderUserId);
        if (!approverResult.ok) {
          logger.warn(
            `Step ${step.stepOrder}: approver unresolvable (${approverResult.error.message}) — skipping. Document ${doc.id} may get stuck.`,
          );
          continue;
        }
        const approverId = approverResult.data;
        nextApprovers.push(approverId);
        unwrapOrThrow(await docs.createApproval({
          documentId: doc.id,
          stepOrder: step.stepOrder,
          approverUserId: approverId,
          deadlineHours: step.timeLimitHours,
          rejectionStops: step.rejectionStops,
        }));
      }
      const primaryNext = nextApprovers[0];

      unwrapOrThrow(await docs.transition({
        documentId: doc.id,
        newBasketState: 'inbox',
        newBasketOwnerId: primaryNext,
        newWorkflowState: 'in_progress',
        newCurrentStep: nextOrder,
        actorUserId: approverUserId,
        auditAction: 'approved',
        auditComment: comment,
      }));

      return { ok: true, status: 'advanced', nextStepOrder: nextOrder, nextApproverIds: nextApprovers };
    });
  } catch (e) {
    if (e instanceof BadRequestException || e instanceof ForbiddenException) throw e;
    throw new InternalServerErrorException(
      await i18n.t('errors.approveTransactionFailed', { args: { message: String(e) } }),
    );
  }
}

export async function findMyPendingApproval(
  approvals: { id: string; approverUserId: number; state: string; rejectionStops: boolean }[],
  approverUserId: number,
  i18n: I18nService,
) {
  const mine = approvals.find(a => a.approverUserId === approverUserId && a.state === 'pending');
  if (!mine) throw new ForbiddenException(await i18n.t('errors.noApprovePermission'));
  return mine;
}

export async function requireDocInProgress(doc: DocumentRow, i18n: I18nService): Promise<void> {
  if (doc.workflowState !== 'in_progress') {
    throw new BadRequestException(await i18n.t('errors.cannotApproveInState', { args: { state: doc.workflowState } }));
  }
}
