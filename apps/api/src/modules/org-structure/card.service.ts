/**
 * @module card.service
 * @description Business logic for the canonical ORG CARD (`org_functions`): CRUD + the
 *   application-layer atomic guard (EP-ORG-002 — 1 seat = 1 active employee; the DB unique
 *   index is deferred until the seat-split, EP-ORG-037). Returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CardRepository, CardInput } from './card.repository';

type Row = Record<string, unknown>;

@Injectable()
export class CardService {
  constructor(private readonly repo: CardRepository) {}

  list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
    return this.repo.list(departmentId, status);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi`));
    return Ok(r.data);
  }

  create(dto: CardInput): Promise<Result<Row | null>> {
    return this.repo.create(dto);
  }

  async update(id: number, dto: CardInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi`));
    return Ok(r.data);
  }

  async softDelete(id: number): Promise<Result<Row>> {
    const r = await this.repo.softDelete(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi yoki allaqachon arxivlangan`));
    return Ok(r.data);
  }

  /**
   * EP-ORG-002 atomic guard (application layer). A card is atomic: 1 active occupant.
   * The DB unique index is deferred (data is position-type granular — some cards already
   * hold 3 employees — until the seat-split EP-ORG-037), so callers that assign an employee
   * MUST check this first and reject when `canAssign` is false.
   */
  async canAssignEmployee(cardId: number): Promise<Result<{ canAssign: boolean; activeOccupants: number }>> {
    const r = await this.repo.activeOccupantCount(cardId);
    if (!r.ok) return Err(r.error);
    return Ok({ canAssign: r.data === 0, activeOccupants: r.data });
  }

  // ─── Phase 5 card-detail tabs (read-only) ──────────────────────────────────
  listEmployees(cardId: number): Promise<Result<Row[]>> { return this.repo.listEmployees(cardId); }
  listChildren(cardId: number): Promise<Result<Row[]>> { return this.repo.listChildren(cardId); }
  listVacancies(cardId: number): Promise<Result<Row[]>> { return this.repo.listVacancies(cardId); }
  listHistory(cardId: number): Promise<Result<Row[]>> { return this.repo.listHistory(cardId); }
}
