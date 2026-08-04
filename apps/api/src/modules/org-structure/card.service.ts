/**
 * @module card.service
 * @description Business logic for the canonical ORG CARD (`org_functions`): CRUD + the
 *   application-layer atomic guard (EP-ORG-002 — 1 seat = 1 active employee; the DB unique
 *   index is deferred until the seat-split, EP-ORG-037). Returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CardRepository, CardInput } from './card.repository';
import {
  CARD_EMPLOYEE_ASSIGNED_EVENT,
  type CardEmployeeAssignedPayload,
} from '../lms/infrastructure/event-handlers/card-employee-assigned.handler';
import {
  CARD_STATUS_CHANGED_EVENT,
  CardStatusChangedEvent,
  type CardStatusTransition,
} from './card-lifecycle.events';

type Row = Record<string, unknown>;

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly repo: CardRepository,
    // Optional (Q-39 back-compat): single-arg unit tests keep constructing CardService(repo);
    // at runtime Nest injects the global EventEmitter2 (app.module EventEmitterModule.forRoot()).
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
    return this.repo.list(departmentId, status);
  }

  async findById(id: number): Promise<Result<Row>> {
    const r = await this.repo.findById(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi`));
    return Ok(r.data);
  }

  /** SB0107: `dto.code` berilmasa, positionName'dan avto-raqamlangan kod ("Operator-01") generatsiya qilinadi. */
  async create(dto: CardInput): Promise<Result<Row | null>> {
    if (!dto.code && dto.positionName) {
      const codeR = await this.repo.nextCodeForName(dto.positionName);
      if (codeR.ok) {
        return this.repo.create({ ...dto, code: codeR.data });
      }
      this.logger.warn(`create karta: avto-kod generatsiya qilinmadi ("${dto.positionName}") — code NULL qoladi: ${codeR.error.message}`);
    }
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

  /** Vizyon (Vysotskiy 7 vertikal): kartaning boshqaruvchisini belgilash + nomzodlar. */
  async setCardManager(cardId: number, managerId: number | null): Promise<Result<Row>> {
    const r = await this.repo.setCardManager(cardId, managerId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Ok(r.data);
  }
  listManagerCandidates(cardId: number): Promise<Result<Row[]>> {
    return this.repo.listManagerCandidates(cardId);
  }

  /**
   * Karta↔xodim moslik (fit) skorer — deterministik v1 (vizyon: "karta baholaydi").
   * fit = 0.5·biriktirish + 0.5·karta-ta'rif. AI-kalit/imtihon kelganda komponent qo'shiladi.
   */
  async computeCardFit(cardId: number): Promise<Result<Row[]>> {
    const r = await this.repo.computeCardFit(cardId);
    if (!r.ok) return Err(r.error);
    const scored = (r.data ?? []).map((row) => {
      const assignment = Number(row['assignment_score'] ?? 0);
      const definition = Number(row['definition_score'] ?? 0);
      const fit = Math.round(0.5 * assignment + 0.5 * definition);
      const label = fit >= 80 ? "a'lo" : fit >= 60 ? 'yaxshi' : fit >= 40 ? "o'rta" : 'past';
      return { ...row, fit_score: fit, fit_label: label };
    });
    return Ok(scored);
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
   *
   * Race-safety: the guard-check + insert + mirror-sync run inside ONE DB transaction
   * (`CardRepository.assignEmployeeGuarded`, `pg_advisory_xact_lock(82002, cardId)`) instead of two
   * separate repo calls, so two concurrent requests for the same card cannot both pass the
   * occupant-count check (previously a TOCTOU race — see repo method doc for the full rationale).
   */
  async assignEmployeeToCard(
    cardId: number, employeeId: number, isPrimary: boolean,
    isActing = false, actingSupplement: number | null = null, endedAt: string | null = null,
  ): Promise<Result<{ assigned: boolean; cardId: number; employeeId: number; isPrimary: boolean; isActing: boolean }>> {
    const card = await this.repo.findById(cardId);
    if (!card.ok) return Err(card.error);
    if (!card.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));

    const primary = isPrimary && !isActing;
    const guarded = await this.repo.assignEmployeeGuarded(cardId, employeeId, primary, isActing, actingSupplement, endedAt);
    if (!guarded.ok) return Err(guarded.error);
    if (guarded.data.blocked) {
      return Err(AppErr('CONFLICT', `Karta band: ${guarded.data.activeOccupants} faol xodim (1 o'rin = 1 xodim, EP-ORG-002)`));
    }

    // T10-06 (EP-ORG-028/088, golden-thread WIRE): publish AFTER the assignment commit so the
    // LMS CardEmployeeAssignedHandler (@OnEvent) auto-enrolls the employee in the card's active
    // courses (idempotent, FABRIKATSIYA YO'Q — no-op when the card has no bound course). Emitted
    // on the canonical EventEmitter2 channel; the listener shares this literal + payload contract
    // (imported from the handler). Non-blocking: an emit failure must NOT roll back the (already
    // committed) assignment — mirrors OrgStructureService.create() cascade emit.
    if (this.eventEmitter) {
      try {
        const payload: CardEmployeeAssignedPayload = { employeeId, cardId, assignedAt: new Date().toISOString() };
        this.eventEmitter.emit(CARD_EMPLOYEE_ASSIGNED_EVENT, payload);
      } catch (e) {
        this.logger.warn(`org.card.employee.assigned emit skipped (card=${cardId}, emp=${employeeId}): ${String(e)}`);
      }
    }

    return Ok({ assigned: true, cardId, employeeId, isPrimary: primary, isActing });
  }

  /**
   * FAZA-09 5-holat lifecycle: karta muzlatish (active/io/vacant → frozen). State-machine:
   *   - karta yo'q (yoki arxivlangan/o'chirilgan) → NOT_FOUND.
   *   - aks holda current_state='frozen', sabab+muddat saqlanadi (active→frozen OK; idempotent re-freeze).
   * `until` ixtiyoriy ISO sana (YYYY-MM-DD yoki to'liq timestamp) yoki null.
   */
  async freezeCard(cardId: number, reason: string | null, until: string | null): Promise<Result<Row>> {
    const r = await this.repo.freeze(cardId, reason, until);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi yoki arxivlangan (muzlatib bo'lmaydi)`));
    this.emitStatusChanged(cardId, 'frozen', 'frozen', reason);
    return Ok(r.data);
  }

  /**
   * FAZA-09 5-holat lifecycle: karta eritish (frozen → active). State-machine:
   *   - karta yo'q → NOT_FOUND.
   *   - karta 'frozen' EMAS → CONFLICT (faqat muzlatilgan kartani eritish mumkin).
   *   - aks holda current_state='active', freeze meta tozalanadi.
   */
  async thawCard(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.thaw(cardId);
    if (!r.ok) return Err(r.error);
    if (r.data) {
      this.emitStatusChanged(cardId, 'active', 'thawed', null);
      return Ok(r.data);
    }
    // No row updated — distinguish 404 (no card) from 409 (not frozen).
    const cur = await this.repo.currentState(cardId);
    if (!cur.ok) return Err(cur.error);
    if (!cur.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Err(AppErr('CONFLICT', `Karta #${cardId} holati '${cur.data.status}' — faqat 'frozen' kartani eritish mumkin`));
  }

  /**
   * FAZA-09 5-holat lifecycle: karta VAKANT (active/frozen/io → vacant). Egasi ketganda karta vakant
   * qoladi (yangi xodim qidiriladi). State-machine:
   *   - karta yo'q → NOT_FOUND.
   *   - karta 'archived' (arxivlangan) → CONFLICT (arxivlangan kartani vakant qilib bo'lmaydi).
   *   - aks holda current_state='vacant'.
   */
  async setVacantCard(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.setVacant(cardId);
    if (!r.ok) return Err(r.error);
    if (r.data) {
      this.emitStatusChanged(cardId, 'vacant', 'vacant', null);
      return Ok(r.data);
    }
    const cur = await this.repo.anyState(cardId);
    if (!cur.ok) return Err(cur.error);
    if (!cur.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Err(AppErr('CONFLICT', `Karta #${cardId} holati '${cur.data.status}' — arxivlangan kartani vakant qilib bo'lmaydi`));
  }

  /**
   * FAZA-09 5-holat lifecycle: ARXIVLANGAN kartani TIKLASH (archived → active) — softDelete teskarisi.
   * State-machine:
   *   - karta umuman yo'q → NOT_FOUND.
   *   - karta allaqachon faol (arxivlanmagan) → CONFLICT (faqat arxivlangan karta tiklanadi).
   *   - aks holda is_active=true + current_state='active'.
   */
  async restoreCard(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.restore(cardId);
    if (!r.ok) return Err(r.error);
    if (r.data) {
      this.emitStatusChanged(cardId, 'active', 'restored', null);
      return Ok(r.data);
    }
    const cur = await this.repo.anyState(cardId);
    if (!cur.ok) return Err(cur.error);
    if (!cur.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Err(AppErr('CONFLICT', `Karta #${cardId} holati '${cur.data.status}' — faqat arxivlangan kartani tiklash mumkin`));
  }

  /** EP-ORG-137: mark a card as reviewed now (resets the 1-year staleness clock). */
  async markReviewed(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.markReviewed(cardId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Ok(r.data);
  }

  /** EP-ORG-137: cards whose annual review is overdue — feeds the daily CardExpiredEvent cron. */
  listStaleCards(): Promise<Result<Row[]>> {
    return this.repo.listStaleCards();
  }

  /**
   * Payroll frozen-card gate batch prefetch (mirrors LmsCardGateService.prefetchMandatoryCourses
   * — N+1 fix pattern, owner-approved 2026-07-05): current_state + freeze_reason for many cards
   * in one query. See PayrollService.computeGatedMonthlySalary (discovery sweep 2026-08-03 —
   * "muzlatilgan karta oylikni to'xtatmaydi").
   */
  listCardStatuses(cardIds: number[]): Promise<Result<Map<number, { status: string; freezeReason: string | null }>>> {
    return this.repo.listCurrentStatesByIds(cardIds);
  }

  /**
   * Discovery sweep 2026-08-03 fix ("CardStatusChangedEvent/CardExpiredEvent yo'q"): publish
   * AFTER the DB transition commits, EventEmitter2 (mirrors T10-06's assignEmployeeToCard emit
   * above). Non-blocking: an emit failure never rolls back the already-committed transition.
   * NOTE: no gate/consumer currently relies on this event being delivered (see
   * card-lifecycle.events.ts header) — Payroll re-reads live current_state instead (Q-40).
   */
  private emitStatusChanged(
    cardId: number,
    newStatus: string,
    transition: CardStatusTransition,
    reason: string | null,
  ): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(CARD_STATUS_CHANGED_EVENT, new CardStatusChangedEvent(cardId, newStatus, transition, reason));
    } catch (e) {
      this.logger.warn(`org.card.status.changed emit skipped (card=${cardId}, transition=${transition}): ${String(e)}`);
    }
  }

  /**
   * EP-ORG-003 card-gate: resolve a user's card-derived RBAC tier + salary eligibility.
   * NON-BLOCKING — a card-less user is flagged (gated=true), never denied login (no login is gated here).
   */
  async resolveGate(userId: number): Promise<Result<Row>> {
    const r = await this.repo.resolveGate(userId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Foydalanuvchi #${userId} topilmadi`));
    const hasCard = r.data.has_card === true;
    return Ok({
      ...r.data,
      gated: !hasCard,
      flag: hasCard ? null : "Kartaga ulanmagan — RBAC/oylik kartadan kelmaydi (admin biriktirsin)",
    });
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

  // ─── Card-level Portret (org_node_portret, card_id-keyed) ────────────────────

  /** Read a card's portret row (null when not yet filled). */
  getCardPortret(cardId: number): Promise<Result<Row | null>> {
    return this.repo.getCardPortret(cardId);
  }

  /** Upsert a card's portret_data (manual SELECT-then-write in the repo). */
  async saveCardPortret(
    cardId: number,
    data: Record<string, unknown>,
    creatorId: number | null,
  ): Promise<Result<Row>> {
    const r = await this.repo.saveCardPortret(cardId, data, creatorId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('INTERNAL', `Karta #${cardId} portreti saqlanmadi`));
    return Ok(r.data);
  }

  // ─── Kerakli jihozlar (required equipment per card) ──────────────────────────
  listRequiredEquipment(cardId: number): Promise<Result<string[]>> {
    return this.repo.listRequiredEquipment(cardId);
  }

  async addRequiredEquipmentItem(cardId: number, item: string): Promise<Result<string[]>> {
    const r = await this.repo.addRequiredEquipmentItem(cardId, item);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Ok(r.data);
  }

  async removeRequiredEquipmentItem(cardId: number, item: string): Promise<Result<string[]>> {
    const r = await this.repo.removeRequiredEquipmentItem(cardId, item);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return Ok(r.data);
  }

  // ─── EP-ORG-064 (merge) / EP-ORG-065 (split) ─────────────────────────────────
  // Tavsiya A, docs/audit/decisions/01-org-kartalar.md:460-472 — Holat OCHIQ (final owner
  // sign-off pending); implemented per the recorded recommendation so the endpoints exist
  // meanwhile (2026-08-04 discovery-sweep item "Karta Merge/Split endpointlari umuman yo'q").

  /** SB0107-style auto-code (mirrors create()) applied per-card so split's two new cards get a code
   *  when the caller omits one. Kept private/local to this class — not a change to create(). */
  private async withAutoCode(dto: CardInput): Promise<CardInput> {
    if (!dto.code && dto.positionName) {
      const codeR = await this.repo.nextCodeForName(dto.positionName);
      if (codeR.ok) return { ...dto, code: codeR.data };
    }
    return dto;
  }

  /**
   * EP-ORG-064 · "Ikki kartani birlashtirish". Primary card survives; secondary's occupancy +
   * razryad history move to it; secondary is archived (merged_into_id → primary).
   */
  async mergeCards(primaryCardId: number, secondaryCardId: number): Promise<Result<{ merged: boolean; primary: Row; secondary: Row }>> {
    if (primaryCardId === secondaryCardId) {
      return Err(AppErr('VALIDATION', "Karta o'zi bilan birlashtirilmaydi (primary === secondary)"));
    }
    const r = await this.repo.mergeCards(primaryCardId, secondaryCardId);
    if (!r.ok) return Err(r.error);
    if (!r.data) {
      return Err(AppErr(
        'NOT_FOUND',
        `Karta #${primaryCardId} yoki #${secondaryCardId} topilmadi yoki faol emas (birlashtirib bo'lmaydi)`,
      ));
    }
    return Ok({ merged: true, primary: r.data.primary, secondary: r.data.secondary });
  }

  /**
   * EP-ORG-065 · "Bitta kartani ikkiga bo'lish". Two brand-new cards are created (linked back via
   * split_from_id), the source card is archived. Existing active employee assignments on the
   * source are NOT auto-moved (open semantic decision — which of the two new cards should inherit
   * the occupant is unspecified by Tavsiya A); HR re-assigns via the existing assign/unassign
   * endpoints, same as any other archived card.
   */
  async splitCard(cardId: number, cardA: CardInput, cardB: CardInput): Promise<Result<{ source: Row; cardA: Row; cardB: Row }>> {
    const dtoA = await this.withAutoCode(cardA);
    const dtoB = await this.withAutoCode(cardB);
    const r = await this.repo.splitCard(cardId, dtoA, dtoB);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi yoki faol emas (bo'lib bo'lmaydi)`));
    return Ok(r.data);
  }
}
