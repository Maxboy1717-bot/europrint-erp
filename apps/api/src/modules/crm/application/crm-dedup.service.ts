/**
 * @module crm-dedup.service
 * @description Business-logic service for phone-based lead deduplication:
 *   list duplicate groups + merge a duplicate lead into a canonical one.
 *   Reuses the shared PhoneNumber value object for +998 normalisation.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError, AppErr, Err } from '@common/result';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { CrmDedupRepository, DuplicateGroup, MergeResult } from '../infrastructure/repositories/crm-dedup.repository';

@Injectable()
export class CrmDedupService {
  constructor(private readonly repo: CrmDedupRepository) {}

  /** Active leads that share a phone after normalisation (grouped). */
  async getDuplicates(): Promise<Result<DuplicateGroup[], AppError>> {
    return this.repo.findPhoneDuplicates();
  }

  /**
   * Merge `duplicateId` into `canonicalId`. Validates both leads exist and are
   * active, refuses to merge two leads whose phones differ, normalises the
   * surviving canonical's phone (+998 E.164), then delegates the transactional
   * repoint + soft-delete to the repository.
   */
  async merge(canonicalId: number, duplicateId: number): Promise<Result<MergeResult, AppError>> {
    if (canonicalId === duplicateId) {
      return Err(AppErr('VALIDATION', 'Kanonik va dublikat lid bir xil bo\'lishi mumkin emas'));
    }

    const canonRes = await this.repo.findLeadForMerge(canonicalId);
    if (!canonRes.ok) return Err(canonRes.error);
    if (!canonRes.data) return Err(AppErr('NOT_FOUND', `Kanonik lid #${canonicalId} topilmadi`));
    if (canonRes.data['deleted_at'] != null) {
      return Err(AppErr('CONFLICT', `Kanonik lid #${canonicalId} o'chirilgan — unga birlashtirib bo'lmaydi`));
    }

    const dupRes = await this.repo.findLeadForMerge(duplicateId);
    if (!dupRes.ok) return Err(dupRes.error);
    if (!dupRes.data) return Err(AppErr('NOT_FOUND', `Dublikat lid #${duplicateId} topilmadi`));
    if (dupRes.data['deleted_at'] != null) {
      return Err(AppErr('CONFLICT', `Dublikat lid #${duplicateId} allaqachon birlashtirilgan/o'chirilgan`));
    }

    const canonRaw = canonRes.data['contact_phone'] != null ? String(canonRes.data['contact_phone']) : '';
    const dupRaw = dupRes.data['contact_phone'] != null ? String(dupRes.data['contact_phone']) : '';
    const canonNorm = PhoneNumber.fromRaw(canonRaw).value;
    const dupNorm = PhoneNumber.fromRaw(dupRaw).value;

    // Guard: two leads that BOTH carry a phone must share the SAME number after
    // normalisation — prevents an operator merging two unrelated leads by mistake.
    if (canonNorm && dupNorm && canonNorm !== dupNorm) {
      return Err(AppErr('CONFLICT', 'Lidlar bir xil telefon raqamiga ega emas — birlashtirib bo\'lmaydi'));
    }

    // Surviving canonical phone: a validated E.164 when possible, else strip-normalised.
    const rawForCanon = canonRaw || dupRaw;
    const vo = PhoneNumber.create(rawForCanon);
    const normalizedPhone = vo.ok ? vo.data.value : PhoneNumber.fromRaw(rawForCanon).value;

    return this.repo.mergeLeads(canonicalId, duplicateId, normalizedPhone);
  }
}
