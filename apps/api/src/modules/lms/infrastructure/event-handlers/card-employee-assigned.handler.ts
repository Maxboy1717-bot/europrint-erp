/**
 * @module lms/card-employee-assigned.handler
 * @description A72 (To'lqin 4 — LMS): darslik KARTAGA biriktiriladi (EP-ORG-028), xodim emas.
 *   Xodim kartaga (employee_cards / employee_org_departments) ulanganda — o'sha kartaning
 *   barcha FAOL kurslariga AVTO yoziladi (EP-ORG-088 "xodim kelganda darslikni ko'radi").
 *   Bu — listener. Kurs↔karta + xodim↔karta REAL bog'lanish bo'lganda darslik o'z-o'zidan paydo bo'ladi.
 *
 * WIRING (oltin-ip naqshi): org tomon (Faza 1 — A23/A24 `card.repository.assignEmployee`)
 *   xodimni kartaga yozganda `org.card.employee.assigned` eventini emit qiladi
 *   (EventEmitter2, app.module global `EventEmitterModule.forRoot()`). Bu listener shu
 *   eventga `@OnEvent` orqali ulanadi — xuddi org-structure `CkpMesFeedListener` (A67) va
 *   `OrgCascadeListener` kabi (CqrsModule import KERAK EMAS). Emitter A72 ko'lamidan tashqarida
 *   (fayl-izolyatsiya, Q-31): emitter qo'shilmaguncha listener `lms-cert-expired-live` listener
 *   bilan bir xil "dead-letter" holatda turadi — bu reja bo'yicha kutilgan (PHASE-07 §B5).
 *   Payload-shartnoma (CARD_EMPLOYEE_ASSIGNED_EVENT + CardEmployeeAssignedPayload) shu yerda
 *   e'lon qilinadi; emitter shuni import qilib/literal nom bilan moslaydi.
 *
 * FABRIKATSIYA TAQIQ (Q-40): kurs↔karta binding hozir 0/5 (egasi-DATA). Karta uchun faol kurs
 *   bo'lmasa — listener no-op (hech narsa yozmaydi, soxta enrollment O'YLAB TOPMAYDI).
 *
 * IDEMPOTENT: `autoEnroll` ON CONFLICT (employee_id, course_id) — qayta-event (retry, qayta-biriktirish)
 *   dublikat yaratmaydi; mavjud (qo'lda) enrollment status'iga TEGMAYDI, faqat karta-izini to'ldiradi.
 *
 * NEVER THROWS: enroll xatosi loglanadi va yutiladi — u xodim↔karta biriktirilishini (allaqachon
 *   commit qilingan) ortga qaytarmasligi yoki golden-thread'ni buzmasligi shart.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LmsRepository } from '../repositories/drizzle-lms.repo';

/**
 * Canonical EventEmitter2 topic the org-side assignment path publishes when an employee
 * is linked to a card (employee_cards INSERT, is_active). Defined here so the emitter
 * (org Faza 1) and this listener share one literal — no cross-cutting constants file edit.
 */
export const CARD_EMPLOYEE_ASSIGNED_EVENT = 'org.card.employee.assigned' as const;

/** Payload contract for {@link CARD_EMPLOYEE_ASSIGNED_EVENT}. */
export interface CardEmployeeAssignedPayload {
  /** employees.id (the integer employee key enrollments.employee_id stores). */
  employeeId: number;
  /** org_departments.id — the CARD the employee was assigned to. */
  cardId: number;
  /** ISO timestamp of the assignment (audit/log only). */
  assignedAt?: string;
}

@Injectable()
export class CardEmployeeAssignedHandler {
  private readonly logger = new Logger(CardEmployeeAssignedHandler.name);

  constructor(private readonly lmsRepo: LmsRepository) {}

  /**
   * EventEmitter2 entrypoint. Wraps the pure handler so any auto-enroll failure is logged
   * but never propagates (the card assignment is already committed upstream).
   */
  @OnEvent(CARD_EMPLOYEE_ASSIGNED_EVENT)
  async onCardEmployeeAssigned(payload: CardEmployeeAssignedPayload): Promise<void> {
    try {
      await this.handle(payload);
    } catch (error: unknown) {
      this.logger.error(
        { payload, err: error instanceof Error ? error.message : String(error) },
        'LMS avto-enroll FAILED — kartaning kurslariga avto-yozilmadi',
      );
    }
  }

  /**
   * Resolve the card's active courses, then auto-enroll the employee in each (idempotent).
   * No-op (logged) when the payload is invalid or the card has no bound course (FABRIKATSIYA YO'Q).
   */
  async handle(payload: CardEmployeeAssignedPayload): Promise<void> {
    const employeeId = Number(payload?.employeeId);
    const cardId = Number(payload?.cardId);
    if (!Number.isInteger(employeeId) || employeeId <= 0 || !Number.isInteger(cardId) || cardId <= 0) {
      this.logger.warn({ payload }, 'LMS avto-enroll: invalid payload (employeeId/cardId) — skipped');
      return;
    }

    const coursesR = await this.lmsRepo.findActiveCoursesByCard(cardId);
    if (!coursesR.ok) {
      this.logger.error({ cardId, err: coursesR.error }, 'LMS avto-enroll: karta kurslarini o\'qib bo\'lmadi');
      return;
    }

    const courses = coursesR.data;
    if (courses.length === 0) {
      // Q-40: kartaga kurs biriktirilmagan (egasi-DATA) — soxta enrollment YO'Q.
      this.logger.log({ cardId, employeeId }, 'LMS avto-enroll: kartaga biriktirilgan faol kurs yo\'q — skipped (owner data)');
      return;
    }

    let enrolled = 0;
    let already = 0;
    for (const c of courses) {
      const r = await this.lmsRepo.autoEnroll(employeeId, c.id, cardId);
      if (!r.ok) {
        this.logger.warn({ employeeId, courseId: c.id, cardId, err: r.error }, 'LMS avto-enroll: bitta kurs yozilmadi');
        continue;
      }
      if (r.data.enrolled) enrolled += 1;
      else already += 1;
    }

    this.logger.log(
      { employeeId, cardId, total: courses.length, enrolled, already },
      'LMS avto-enroll: xodim kartaning kurslariga yozildi',
    );
  }
}
