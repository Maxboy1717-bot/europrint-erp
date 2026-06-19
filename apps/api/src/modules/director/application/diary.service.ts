/**
 * @module diary.service
 * @description Business-logic service for the director daily diary. openDiary
 *   creates/loads today's entry (auto-fill) then carries over the previous
 *   day's unresolved issues. Returns Result<T>.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import {
  DIARY_REPO,
  type IDiaryRepo,
  type IDiaryEntry,
  type DiarySaveInput,
} from '../domain/repositories/i-diary.repo';

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(@Inject(DIARY_REPO) private readonly repo: IDiaryRepo) {}

  /**
   * Kunlik daftarni ochadi: getOrCreateToday (auto-fill) → carryOverIssues
   * (kechagi hal qilinmagan) → yangilangan yozuvni qayta o'qib qaytaradi.
   */
  async openDiary(cardId: number, date: string): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      this.logger.log({ code: 'EP-DIR-007', op: 'dir.diary.open', cardId, date });

      const created = await this.repo.getOrCreateToday(cardId, date);
      if (!created.ok) throw new Error(created.error.message);
      this.logger.log({ code: 'EP-DIR-009', op: 'dir.diary.autofill', state: created.data.daily_state });

      const carried = await this.repo.carryOverIssues(cardId, date);
      if (!carried.ok) throw new Error(carried.error.message);
      this.logger.log({ code: 'EP-DIR-010', op: 'dir.diary.carryover', cardId, date });

      // Carry-over yozuvni yangilagan bo'lishi mumkin — qayta o'qib qaytaramiz.
      const fresh = await this.repo.getByAuthorDate(cardId, date);
      if (!fresh.ok) throw new Error(fresh.error.message);
      return fresh.data ?? created.data;
    }, 'DB_ERROR');
  }

  async saveDraft(id: number, dto: DiarySaveInput): Promise<Result<IDiaryEntry>> {
    return this.repo.save(id, dto);
  }

  async submitEntry(id: number): Promise<Result<IDiaryEntry>> {
    return this.repo.submit(id);
  }

  async directorList(from: string, to: string, cardId?: number): Promise<Result<IDiaryEntry[]>> {
    return this.repo.listAll(from, to, cardId);
  }
}
