/**
 * @module razryad.service
 * @description Business logic for razryad (grade) master-data. Mirrors CardService.
 *   404 on missing; UNIQUE(level) conflict bubbles up from the repo as a CONFLICT. Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { RazryadRepository, RazryadInput } from './razryad.repository';

type Row = Record<string, unknown>;

@Injectable()
export class RazryadService {
  constructor(private readonly repo: RazryadRepository) {}

  list(includeArchived: boolean): Promise<Result<Row[]>> {
    return this.repo.list(includeArchived);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Razryad #${id} topilmadi`));
    return Ok(r.data);
  }

  create(dto: RazryadInput): Promise<Result<Row | null>> {
    return this.repo.create(dto);
  }

  async update(id: number, dto: RazryadInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Razryad #${id} topilmadi`));
    return Ok(r.data);
  }

  async softDelete(id: number): Promise<Result<Row>> {
    const r = await this.repo.softDelete(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Razryad #${id} topilmadi yoki allaqachon arxivlangan`));
    return Ok(r.data);
  }
}
