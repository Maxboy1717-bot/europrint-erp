/**
 * @module question-bank.service
 * @description Business logic for AI-imtihon savollar banki (`hr_question_bank`, EP-ORG-046).
 *   Mirrors RazryadService/ErrorCatalogService — 404 on missing, thin pass-through otherwise.
 *   ⭐ Savollar ro'yxati = EGASI/HR-data (UI orqali kiritiladi) — bu yerda soxta savol yaratilmaydi (Q-40).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { QuestionBankRepository, QuestionBankInput } from './question-bank.repository';

type Row = Record<string, unknown>;

@Injectable()
export class QuestionBankService {
  constructor(private readonly repo: QuestionBankRepository) {}

  list(orgFunctionId: number | null, includeArchived: boolean): Promise<Result<Row[]>> {
    return this.repo.list(orgFunctionId, includeArchived);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Savol #${id} topilmadi`));
    return Ok(r.data);
  }

  create(dto: QuestionBankInput): Promise<Result<Row | null>> {
    return this.repo.create(dto);
  }

  async update(id: number, dto: QuestionBankInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Savol #${id} topilmadi`));
    return Ok(r.data);
  }

  async softDelete(id: number): Promise<Result<Row>> {
    const r = await this.repo.softDelete(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Savol #${id} topilmadi yoki allaqachon arxivlangan`));
    return Ok(r.data);
  }
}
