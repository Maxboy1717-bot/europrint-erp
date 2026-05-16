/**
 * @module approval-request-acl
 * @description ACL translator: legacy `approval_workflow` rows ↔ canonical
 * `ApprovalRequestDto` for new BC-7 (Finance) / cross-cutting workflow
 * consumers.
 *
 * The legacy repo emits the monetary `amount` as a string (Drizzle `numeric`)
 * and dates as native `Date | null`. This translator normalises both: amount
 * to `number`, every timestamp to `Date | null`, ids to `string`.
 *
 * TODO PA2-14: collapse into a `ApprovalRequestRepository.find*()` typed
 * return shape and delete this file.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyApprovalRow {
  id: string | number;
  documentType?: unknown;
  documentId?: unknown;
  documentNumber?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  requestedBy?: unknown;
  approvedBy?: unknown;
  approvedAt?: unknown;
  rejectedBy?: unknown;
  rejectedAt?: unknown;
  rejectionReason?: unknown;
  notes?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ApprovalRequestDto {
  id: string;
  documentType: string;
  documentId: string;
  documentNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  requestedById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  rejectedById: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toMoney(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

export class ApprovalRequestAclTranslator
  implements IAclTranslator<LegacyApprovalRow, ApprovalRequestDto>
{
  toDomain(legacy: LegacyApprovalRow): Result<ApprovalRequestDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'ApprovalRequestAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'ApprovalRequestAcl: legacy.id missing'));
    }
    const documentType = toStr(legacy.documentType);
    const documentId = toStr(legacy.documentId);
    const requestedBy = toStr(legacy.requestedBy);
    if (!documentType) return Err(AppErr('VALIDATION', 'ApprovalRequestAcl: documentType missing'));
    if (!documentId)   return Err(AppErr('VALIDATION', 'ApprovalRequestAcl: documentId missing'));
    if (!requestedBy)  return Err(AppErr('VALIDATION', 'ApprovalRequestAcl: requestedBy missing'));

    return Ok({
      id: String(legacy.id),
      documentType,
      documentId,
      documentNumber: toStr(legacy.documentNumber),
      amount: toMoney(legacy.amount),
      currency: toStr(legacy.currency) ?? 'UZS',
      status: toStr(legacy.status) ?? 'pending',
      requestedById: requestedBy,
      approvedById: toStr(legacy.approvedBy),
      approvedAt: toDate(legacy.approvedAt),
      rejectedById: toStr(legacy.rejectedBy),
      rejectedAt: toDate(legacy.rejectedAt),
      rejectionReason: toStr(legacy.rejectionReason),
      notes: toStr(legacy.notes),
      createdAt: toDate(legacy.createdAt),
      updatedAt: toDate(legacy.updatedAt),
    });
  }

  toLegacy(domain: ApprovalRequestDto): LegacyApprovalRow {
    return {
      id: domain.id,
      documentType: domain.documentType,
      documentId: domain.documentId,
      documentNumber: domain.documentNumber,
      amount: String(domain.amount),
      currency: domain.currency,
      status: domain.status,
      requestedBy: domain.requestedById,
      approvedBy: domain.approvedById,
      approvedAt: domain.approvedAt ? domain.approvedAt.toISOString() : null,
      rejectedBy: domain.rejectedById,
      rejectedAt: domain.rejectedAt ? domain.rejectedAt.toISOString() : null,
      rejectionReason: domain.rejectionReason,
      notes: domain.notes,
      createdAt: domain.createdAt ? domain.createdAt.toISOString() : null,
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
