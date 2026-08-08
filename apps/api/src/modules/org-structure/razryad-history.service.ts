/**
 * @module razryad-history.service
 * @description Razryad o'sish/pasayish biznes-logikasi (EP-ORG-010..013/091). Result<T>.
 *   2-imzo (HR + bevosita rahbar), 3-oy guard (min_months + history), imtihon o'tish-chegara,
 *   ichki sertifikat. FABRIKATSIYA TAQIQ: exam_pass_threshold/min_months NULL -> RAD (default yo'q).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { RazryadHistoryRepository, RazryadRequestInput, ApplyChangeInput } from './razryad-history.repository';

type Row = Record<string, unknown>;

@Injectable()
export class RazryadHistoryService {
  private readonly logger = new Logger(RazryadHistoryService.name);
  constructor(private readonly repo: RazryadHistoryRepository) {}

  historyByCard(cardId: number): Promise<Result<Row[]>> {
    return this.repo.historyByCard(cardId);
  }

  listRequestsByCard(cardId: number): Promise<Result<Row[]>> {
    return this.repo.listRequestsByCard(cardId);
  }

  listPendingRequests(): Promise<Result<Row[]>> {
    return this.repo.listPendingRequests();
  }

  /**
   * O'sish/pasayish so'rovi yaratish.
   *  - increase: target razryad joriydan YUQORI + 3-oy guard + imtihon-chegara.
   *  - decrease: target razryad joriydan PAST + reason MAJBURIY.
   */
  async createRequest(dto: RazryadRequestInput): Promise<Result<Row>> {
    const curR = await this.repo.cardRazryad(dto.cardId);
    if (!curR.ok) return Err(curR.error);
    if (!curR.data) return Err(AppErr('NOT_FOUND', `Karta #${dto.cardId} topilmadi`));
    const currentRazryadId = curR.data.razryadLevelId;

    const tgtR = await this.repo.razryadLevel(dto.targetRazryadId);
    if (!tgtR.ok) return Err(tgtR.error);
    if (!tgtR.data) return Err(AppErr('NOT_FOUND', `Razryad #${dto.targetRazryadId} topilmadi`));
    const targetLevel = Number(tgtR.data.level);

    let currentLevel = 0;
    if (currentRazryadId != null) {
      const cr = await this.repo.razryadLevel(currentRazryadId);
      if (cr.ok && cr.data) currentLevel = Number(cr.data.level);
    }

    if (dto.requestType === 'increase') {
      if (currentRazryadId != null && targetLevel <= currentLevel) {
        return Err(AppErr('VALIDATION', `O'sish uchun target razryad (${targetLevel}) joriydan (${currentLevel}) yuqori bo'lishi kerak`));
      }
      const threshold = tgtR.data.exam_pass_threshold;
      if (threshold == null) {
        return Err(AppErr('VALIDATION', `${targetLevel}-razryad uchun imtihon o'tish-chegarasi sozlanmagan (egasi sozlashi kerak)`));
      }
      if (dto.examScore == null) {
        return Err(AppErr('VALIDATION', `O'sish so'rovi uchun imtihon bali kerak`));
      }
      if (Number(dto.examScore) < Number(threshold)) {
        return Err(AppErr('VALIDATION', `Imtihon bali (${dto.examScore}%) o'tish-chegarasidan (${threshold}%) past`));
      }
      const guard = await this.checkInterval(dto.cardId, tgtR.data.min_months == null ? null : Number(tgtR.data.min_months));
      if (!guard.ok) return Err(guard.error);
    } else {
      if (!dto.reason || dto.reason.trim().length === 0) {
        return Err(AppErr('VALIDATION', `Pasayish uchun sabab majburiy`));
      }
      if (currentRazryadId != null && targetLevel >= currentLevel) {
        return Err(AppErr('VALIDATION', `Pasayish uchun target razryad joriydan past bo'lishi kerak`));
      }
    }

    const occ = await this.repo.cardOccupant(dto.cardId);
    const employeeId = occ.ok ? occ.data : null;

    const created = await this.repo.createRequest(dto, currentRazryadId, employeeId);
    if (!created.ok) return Err(created.error);
    if (!created.data) return Err(AppErr('INTERNAL', `So'rov yaratilmadi`));
    return Ok(created.data);
  }

  /**
   * 3-oy oraliq guard (EP-ORG-011). min_months NULL -> RAD (egasi sozlamagan, fabrikatsiya yo'q).
   */
  private async checkInterval(cardId: number, minMonths: number | null): Promise<Result<true>> {
    if (minMonths == null) {
      return Err(AppErr('VALIDATION', `Razryad uchun minimal oraliq (min_months) sozlanmagan (egasi sozlashi kerak)`));
    }
    if (minMonths <= 0) return Ok(true);
    const last = await this.repo.lastChangeAt(cardId);
    if (!last.ok) return Err(last.error);
    if (last.data == null) return Ok(true);
    const monthsPassed = (Date.now() - last.data.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (monthsPassed < minMonths) {
      return Err(AppErr('VALIDATION', `Oxirgi razryad o'zgarishdan ${minMonths} oy o'tishi kerak (hozir ~${monthsPassed.toFixed(1)} oy)`));
    }
    return Ok(true);
  }

  /** HR imzosi (1-imzo). */
  async hrApprove(requestId: number, hrUserId: number): Promise<Result<Row>> {
    const r = await this.repo.markHrApproved(requestId, hrUserId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('VALIDATION', `So'rov topilmadi yoki allaqachon HR tomonidan ko'rilgan`));
    return Ok(r.data);
  }

  /**
   * Bevosita rahbar imzosi (2-imzo) -> razryad amalda o'zgaradi (atomik). Faqat status='hr_approved'.
   * Ichki sertifikat raqami avtomatik (EP-ORG-013).
   */
  async managerApprove(requestId: number, managerUserId: number): Promise<Result<Row>> {
    const reqR = await this.repo.findRequest(requestId);
    if (!reqR.ok) return Err(reqR.error);
    const req = reqR.data;
    if (!req) return Err(AppErr('NOT_FOUND', `So'rov #${requestId} topilmadi`));
    if (req.status !== 'hr_approved') {
      return Err(AppErr('VALIDATION', `So'rov avval HR tomonidan tasdiqlanishi kerak (joriy: ${req.status})`));
    }
    const cardId = Number(req.card_id);
    const newRazryadId = Number(req.target_razryad_id);
    const oldRazryadId = req.current_razryad_id == null ? null : Number(req.current_razryad_id);
    const changeType: 'increase' | 'decrease' = String(req.request_type) === 'decrease' ? 'decrease' : 'increase';
    const certNumber = `CERT-RZ-${cardId}-${Date.now()}`;

    const apply: ApplyChangeInput = {
      cardId,
      employeeId: req.employee_id == null ? null : Number(req.employee_id),
      oldRazryadId,
      newRazryadId,
      changeType,
      reason: req.reason == null ? null : String(req.reason),
      examScore: req.exam_score == null ? null : Number(req.exam_score),
      certificateNumber: certNumber,
      requestedBy: req.requested_by == null ? null : Number(req.requested_by),
      hrApprovedBy: req.hr_approved_by == null ? null : Number(req.hr_approved_by),
      managerApprovedBy: managerUserId,
      aiSuggested: Boolean(req.ai_suggested),
    };
    const res = await this.repo.applyChange(apply, requestId);
    if (!res.ok) return Err(res.error);
    this.logger.log(`Razryad ${changeType}: karta #${cardId} -> razryad #${newRazryadId} (cert ${certNumber})`);
    return Ok(res.data);
  }

  async reject(requestId: number, userId: number, reason: string): Promise<Result<Row>> {
    if (!reason || reason.trim().length === 0) return Err(AppErr('VALIDATION', `Rad sababi majburiy`));
    const r = await this.repo.markRejected(requestId, userId, reason);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('VALIDATION', `So'rov topilmadi yoki yopilgan`));
    return Ok(r.data);
  }
}
