/**
 * @module cc-workflow-reject-resubmit.helpers
 * @description Pure helpers extracted from cc-workflow.service.ts (reject + resubmit
 *   flows) to keep the service file <300 lines (Rule 16).
 */

import { ForbiddenException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { unwrapOrThrow } from '@common/http-result';
import type { CcDocumentsRepository, DocumentRow } from '../../infrastructure/repositories/cc-documents.repo';
import type { CcPinService } from '../cc-pin.service';
import type { RejectDto, ResubmitDto } from '../cc-workflow.types';

interface RejectablePending { id: string; rejectionStops: boolean }

export async function findMyRejectableApproval(
  docs: CcDocumentsRepository,
  doc: DocumentRow,
  approverUserId: number,
): Promise<RejectablePending> {
  const approvals = unwrapOrThrow(await docs.getPendingApprovalsAtStep(doc.id, doc.currentStepOrder));
  const mine = approvals.find(a => a.approverUserId === approverUserId && a.state === 'pending');
  if (!mine) throw new ForbiddenException('Sizga bu hujjatni rad etish huquqi berilmagan');
  return mine;
}

export async function signRejection(
  docs: CcDocumentsRepository,
  pin: CcPinService,
  doc: DocumentRow,
  mine: { id: string },
  approverUserId: number,
  dto: RejectDto,
): Promise<void> {
  const sigHash = await pin.verifyAndSign(approverUserId, dto.pin, `reject:${doc.id}:${mine.id}`);
  unwrapOrThrow(await docs.signApproval({
    approvalId:        mine.id,
    state:             'rejected',
    signatureHash:     sigHash,
    rejectionReasonId: dto.rejectionReasonId ?? null,
    comment:           dto.comment ?? null,
  }));
}

export async function allApprovalsResolved(documentId: string): Promise<boolean> {
  const remaining = await runQuery<{ c: string }>(sql`
    SELECT COUNT(*)::text AS c FROM cc_approvals
    WHERE document_id = ${documentId} AND state = 'pending'
  `);
  return Number(remaining.rows[0]?.c ?? '0') === 0;
}

export async function finalizeReject(
  docs: CcDocumentsRepository,
  doc: DocumentRow,
  approverUserId: number,
  comment: string | null,
): Promise<void> {
  unwrapOrThrow(await docs.transition({
    documentId:       doc.id,
    newBasketState:   'outbox',
    newBasketOwnerId: doc.senderUserId,
    newWorkflowState: 'rejected',
    newCurrentStep:   doc.currentStepOrder,
    actorUserId:      approverUserId,
    auditAction:      'rejected',
    auditComment:     comment,
  }));
}

export async function runResubmitTx(
  docs: CcDocumentsRepository,
  doc: DocumentRow,
  senderUserId: number,
  dto: ResubmitDto,
  newVersion: number,
): Promise<void> {
  unwrapOrThrow(await docs.snapshotVersion({
    documentId:      doc.id,
    version:         doc.version,
    aiBody:          doc.aiBody,
    senderComment:   doc.senderComment,
    createdByUserId: senderUserId,
  }));
  unwrapOrThrow(await docs.updateBody({
    documentId:    doc.id,
    aiBody:        dto.aiBody,
    senderComment: dto.senderComment ?? null,
    newVersion,
  }));
  unwrapOrThrow(await docs.transition({
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
