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

  // ─── Phase 6: employee↔card M:N + FORMULA A salary ──────────────────────────

  /**
   * Assign an employee to a card. Substantive assigns reuse the EP-ORG-002 atomic guard (≤1 active
   * substantive employee per card) → CONFLICT when occupied; if isPrimary, syncs the
   * employees.org_function_id mirror (Q-39 back-compat). Phase 7 (EP-ORG-060/061/062, D2): an
   * i.o./acting assignment (isActing) carries a supplement + a revert end-date and does NOT consume
   * the substantive seat → it SKIPS the guard and is never the primary mirror.
   */
  async assignEmployeeToCard(
    cardId: number, employeeId: number, isPrimary: boolean,
    isActing = false, actingSupplement: number | null = null, endedAt: string | null = null,
  ): Promise<Result<{ assigned: boolean; cardId: number; employeeId: number; isPrimary: boolean; isActing: boolean }>> {
    const card = await this.repo.findById(cardId);
    if (!card.ok) return Err(card.error);
    if (!card.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));

    // i.o./acting does NOT consume the single substantive seat (D2) → skip the guard for it.
    if (!isActing) {
      const guard = await this.canAssignEmployee(cardId);
      if (!guard.ok) return Err(guard.error);
      if (!guard.data.canAssign) {
        return Err(AppErr('CONFLICT', `Karta band: ${guard.data.activeOccupants} faol xodim (1 o'rin = 1 xodim, EP-ORG-002)`));
      }
    }

    const primary = isPrimary && !isActing;
    const r = await this.repo.assignEmployee(cardId, employeeId, primary, isActing, actingSupplement, endedAt);
    if (!r.ok) return Err(r.error);
    if (primary) {
      const m = await this.repo.setPrimaryCard(employeeId, cardId);
      if (!m.ok) return Err(m.error);
    }
    return Ok({ assigned: true, cardId, employeeId, isPrimary: primary, isActing });
  }

  /** EP-ORG-137: mark a card as reviewed now (resets the 1-year staleness clock). */
  async markReviewed(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.markReviewed(cardId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Ok(r.data);
  }

  /** Unassign an employee from a card (soft). If it was the primary card, repoints the org_function_id mirror. */
  async unassignEmployeeFromCard(
    cardId: number, employeeId: number,
  ): Promise<Result<{ unassigned: boolean; cardId: number; employeeId: number }>> {
    const r = await this.repo.unassignEmployee(cardId, employeeId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Bog'lanish topilmadi (karta #${cardId}, xodim #${employeeId})`));
    if (r.data.is_primary) {
      const m = await this.repo.repointPrimaryMirror(employeeId);
      if (!m.ok) return Err(m.error);
    }
    return Ok({ unassigned: true, cardId, employeeId });
  }

  /** An employee's active cards + the FORMULA-A total salary (SUM of card max_salary, no cap, EP-ORG-142). */
  async listEmployeeCards(employeeId: number): Promise<Result<{ cards: Row[]; totalSalary: number }>> {
    const cards = await this.repo.listEmployeeCards(employeeId);
    if (!cards.ok) return Err(cards.error);
    const total = await this.repo.employeeSalaryTotal(employeeId);
    if (!total.ok) return Err(total.error);
    return Ok({ cards: cards.data, totalSalary: total.data });
  }

  /** EP-ORG-047: the card's occupants' certificates + 30-day expiry flag (reuses `certificates`). */
  listCertificates(cardId: number): Promise<Result<Row[]>> { return this.repo.listCertificates(cardId); }
}
