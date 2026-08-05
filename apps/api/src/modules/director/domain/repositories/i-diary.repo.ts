/**
 * @module i-diary.repo
 * @description Domain repository interface for director daily diary
 *   (one entry per author_card_id per day; auto-fill from company_state_log +
 *   carry-over of unresolved issues from the previous day).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/diary.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface IDiaryEntry {
  id: number;
  author_card_id?: number | null;
  date: string;
  daily_state?: string | null;
  main_kpi_value?: string | null;
  main_issue?: string | null;
  solution?: string | null;
  tomorrow_plan?: string | null;
  carry_over_issues: unknown[];
  status: 'draft' | 'submitted';
  created_at: Date;
  updated_at: Date;
}

export type DiarySaveInput = {
  main_issue?: string | null;
  solution?: string | null;
  tomorrow_plan?: string | null;
};

export interface IDiaryRepo {
  /**
   * Foydalanuvchining org-kartasi (org_functions.id) ni topadi: avval
   * users.org_function_id, bo'lmasa employees.org_function_id (user_id orqali).
   * Karta topilmasa null qaytaradi (chaqiruvchi user.id ga fallback qiladi).
   */
  resolveAuthorCard(userId: number): Promise<Result<number | null>>;
  /** Mavjud kun yozuvini qaytaradi yoki auto-fill bilan yangisini yaratadi. */
  getOrCreateToday(authorCardId: number, date: string): Promise<Result<IDiaryEntry>>;
  getByAuthorDate(authorCardId: number, date: string): Promise<Result<IDiaryEntry | null>>;
  /** Egasini tekshirmasdan id bo'yicha yozuvni qaytaradi — service ownership-gate uchun ishlatadi. */
  getById(id: number): Promise<Result<IDiaryEntry | null>>;
  listAll(from: string, to: string, authorCardId?: number): Promise<Result<IDiaryEntry[]>>;
  save(id: number, dto: DiarySaveInput, authorCardId: number): Promise<Result<IDiaryEntry>>;
  submit(id: number, authorCardId: number): Promise<Result<IDiaryEntry>>;
  /** Kechagi (draft) hal qilinmagan main_issue ni bugungi carry_over_issues ga ko'chiradi. */
  carryOverIssues(authorCardId: number, targetDate: string): Promise<Result<void>>;
}

export const DIARY_REPO = Symbol('DIARY_REPO');
