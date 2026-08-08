/**
 * @module diary.service
 * @description Business-logic service for the director daily diary. openDiary
 *   creates/loads today's entry (auto-fill) then carries over the previous
 *   day's unresolved issues. Returns Result<T>.
 */

import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
   * Kunlik daftarni FOYDALANUVCHI uchun ochadi. Karta-markazli model: muallif
   * user.id emas, foydalanuvchi egallagan org-karta (org_functions.id). Kartani
   * resolveAuthorCard orqali topadi; karta yo'q bo'lsa user.id ga fallback qiladi
   * (daftar baribir ochiladi).
   */
  async openDiaryForUser(userId: number, date: string): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const resolved = await this.repo.resolveAuthorCard(userId);
      if (!resolved.ok) throw new Error(resolved.error.message);
      const cardId = resolved.data ?? userId;
      if (resolved.data == null) {
        this.logger.warn({ code: 'EP-DIR-008', op: 'dir.diary.no-card', userId });
      }
      const opened = await this.openDiary(cardId, date);
      if (!opened.ok) throw new Error(opened.error.message);
      return opened.data;
    }, 'DB_ERROR');
  }

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

  /** users.org_function_id/employees.org_function_id fallback (openDiaryForUser bilan bir xil qoida). */
  private async resolveCallerCardId(userId: number): Promise<number> {
    const resolved = await this.repo.resolveAuthorCard(userId);
    if (!resolved.ok) throw new Error(resolved.error.message);
    return resolved.data ?? userId;
  }

  /**
   * Item #113 (IDOR fix): id bo'yicha yozuvni faqat egasi (o'z author_card_id'i)
   * o'zgartira oladi — avval hech qanday tekshiruv yo'q edi, istalgan
   * 'manager'-rol foydalanuvchi boshqa kartaning kundaligini o'qiy/tahrirlay olardi.
   */
  async saveDraft(id: number, dto: DiarySaveInput, userId: number): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const cardId = await this.resolveCallerCardId(userId);
      const existing = await this.repo.getById(id);
      if (!existing.ok) throw new Error(existing.error.message);
      if (!existing.data) throw new NotFoundException('Kundalik yozuvi topilmadi');
      if (existing.data.author_card_id !== cardId) {
        this.logger.warn({ code: 'EP-DIR-011', op: 'dir.diary.save.forbidden', userId, cardId, entryId: id, ownerCardId: existing.data.author_card_id });
        throw new ForbiddenException("Boshqa bo'lim kundaligini tahrirlash mumkin emas");
      }
      const saved = await this.repo.save(id, dto, cardId);
      if (!saved.ok) throw new Error(saved.error.message);
      return saved.data;
    }, 'DB_ERROR');
  }

  async submitEntry(id: number, userId: number): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const cardId = await this.resolveCallerCardId(userId);
      const existing = await this.repo.getById(id);
      if (!existing.ok) throw new Error(existing.error.message);
      if (!existing.data) throw new NotFoundException('Kundalik yozuvi topilmadi');
      if (existing.data.author_card_id !== cardId) {
        this.logger.warn({ code: 'EP-DIR-012', op: 'dir.diary.submit.forbidden', userId, cardId, entryId: id, ownerCardId: existing.data.author_card_id });
        throw new ForbiddenException("Boshqa bo'lim kundaligini topshirish mumkin emas");
      }
      const submitted = await this.repo.submit(id, cardId);
      if (!submitted.ok) throw new Error(submitted.error.message);
      return submitted.data;
    }, 'DB_ERROR');
  }

  async directorList(from: string, to: string, cardId?: number): Promise<Result<IDiaryEntry[]>> {
    return this.repo.listAll(from, to, cardId);
  }
}
