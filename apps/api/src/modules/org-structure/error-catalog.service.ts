/**
 * @module error-catalog.service
 * @description Business logic for XATO-KATALOG (`error_catalog`, T10-08, EP-ORG-097). CRUD +
 *   soft-delete. Karta-bog'lanish ixtiyoriy (card_id NULL = umumiy). Result<T>.
 *   ⭐ Xato-ro'yxati = EGASI/HR-data (UI orqali kiritiladi) — bu yerda soxta satr yaratilmaydi (Q-40).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { ErrorCatalogRepository, ErrorCatalogInput } from './error-catalog.repository';

type Row = Record<string, unknown>;

@Injectable()
export class ErrorCatalogService {
  constructor(private readonly repo: ErrorCatalogRepository) {}

  list(cardId: number | null, includeArchived: boolean): Promise<Result<Row[]>> {
    return this.repo.list(cardId, includeArchived);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Xato-katalog #${id} topilmadi`));
    return Ok(r.data);
  }

  create(dto: ErrorCatalogInput, createdBy: number | null): Promise<Result<Row | null>> {
    return this.repo.create(dto, createdBy);
  }

  async update(id: number, dto: ErrorCatalogInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Xato-katalog #${id} topilmadi`));
    return Ok(r.data);
  }

  async softDelete(id: number): Promise<Result<Row>> {
    const r = await this.repo.softDelete(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Xato-katalog #${id} topilmadi yoki allaqachon arxivlangan`));
    return Ok(r.data);
  }
}
