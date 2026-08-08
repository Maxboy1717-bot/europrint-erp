/**
 * @module org-structure/exam-passed-razryad.listener
 * @description Gap #2 (T20-A1) — IMTIHON→RAZRYAD AVTO-ZANJIR (EP-ORG-010..013).
 *
 *   Imtihon O'TGANDA (lms.exam.passed) bu listener:
 *     1. exam → kurs → karta (courses.card_id); karta yo'q bo'lsa → userId birlamchi kartasi.
 *     2. userId → xodim (employees.id).
 *     3. karta JORIY razryadidan navbatdagi (level+1) razryad_levels.id ni topadi.
 *     4. RazryadHistoryService.createRequest(increase, ai_suggested=true, examScore) avto-chaqiradi.
 *
 *   2-imzo oqimi (HR + bevosita rahbar) ALLAQACHON tayyor (razryad-history.service) — bu listener
 *   faqat TRIGGER (pending so'rov yaratadi); tasdiq qo'lda davom etadi. AI-taklif (ai_suggested=true)
 *   belgisi UI da "AI tavsiya qildi" deb ko'rsatiladi.
 *
 *   FABRIKATSIYA TAQIQ (Q-40): createRequest exam_pass_threshold/min_months NULL bo'lsa RAD qiladi
 *   (egasi sozlamagan → default yo'q). Bu listener xatoni YUTADI (never-throw) — imtihon natijasini
 *   (allaqachon saqlangan) buzmaydi. So'rov yaratilmasa loglanadi (egasi-data yetishmasligi).
 *
 *   WIRING (A72 naqshi): EventEmitter2 global (@OnEvent), CqrsModule import KERAK EMAS. Emitter =
 *   LmsExamsService.submitExam; literal + payload `exam-passed.contract.ts` dan import qilinadi.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RazryadHistoryService } from './razryad-history.service';
import { RazryadHistoryRepository } from './razryad-history.repository';
import {
  EXAM_PASSED_EVENT,
  type ExamPassedPayload,
} from '../lms/infrastructure/event-handlers/exam-passed.contract';

@Injectable()
export class ExamPassedRazryadListener {
  private readonly logger = new Logger(ExamPassedRazryadListener.name);

  constructor(
    private readonly service: RazryadHistoryService,
    private readonly repo: RazryadHistoryRepository,
  ) {}

  @OnEvent(EXAM_PASSED_EVENT)
  async onExamPassed(payload: ExamPassedPayload): Promise<void> {
    try {
      await this.handle(payload);
    } catch (error: unknown) {
      this.logger.error(
        { payload, err: error instanceof Error ? error.message : String(error) },
        'IMTIHON→RAZRYAD avto-zanjir FAILED — razryad so\'rovi yaratilmadi',
      );
    }
  }

  async handle(payload: ExamPassedPayload): Promise<void> {
    const examId = Number(payload?.examId);
    const userId = Number(payload?.userId);
    const score = Number(payload?.score);
    if (!Number.isInteger(examId) || examId <= 0 || !Number.isInteger(userId) || userId <= 0) {
      this.logger.warn({ payload }, 'IMTIHON→RAZRYAD: invalid payload (examId/userId) — skip');
      return;
    }

    // 1. KARTA: exam → kurs → card_id; bo'lmasa → userId birlamchi kartasi.
    let cardId: number | null = null;
    const examCardR = await this.repo.cardIdForExam(examId);
    if (examCardR.ok) cardId = examCardR.data;

    let employeeId: number | null = null;
    const primaryR = await this.repo.primaryCardForUser(userId);
    if (primaryR.ok && primaryR.data) {
      employeeId = primaryR.data.employeeId;
      if (cardId == null) cardId = primaryR.data.cardId;
    }

    if (cardId == null) {
      // Q-40: imtihon kartaga ham, xodim kartaga ham bog'lanmagan (egasi-DATA) — so'rov YO'Q.
      this.logger.log({ examId, userId }, 'IMTIHON→RAZRYAD: karta topilmadi (egasi-data) — skip');
      return;
    }

    // 2. NAVBATDAGI razryad nishoni (level+1); eng yuqorida → o'sish nishoni yo'q.
    const nextR = await this.repo.nextRazryadIdForCard(cardId);
    if (!nextR.ok) {
      this.logger.warn({ cardId, err: nextR.error }, 'IMTIHON→RAZRYAD: navbatdagi razryad o\'qilmadi — skip');
      return;
    }
    if (nextR.data == null) {
      this.logger.log({ cardId }, 'IMTIHON→RAZRYAD: navbatdagi razryad yo\'q (eng yuqori daraja) — skip');
      return;
    }

    // 3. AI-taklif razryad-so'rovi (increase). 2-imzo oqimi keyin qo'lda. createRequest
    //    threshold/min_months guardlarini o'zi qo'llaydi (FABRIKATSIYA yo'q — egasi-data NULL → RAD).
    const created = await this.service.createRequest({
      cardId,
      targetRazryadId: nextR.data,
      requestType: 'increase',
      examScore: Number.isFinite(score) ? score : null,
      requestedBy: userId,
      aiSuggested: true,
    });

    if (!created.ok) {
      // VALIDATION (threshold sozlanmagan / imtihon-bali past / 3-oy guard) — bu KUTILGAN
      // graceful holat (egasi-data yoki biznes-qoida), xato emas. LOG only.
      this.logger.log(
        { cardId, targetRazryadId: nextR.data, employeeId, reason: created.error.message },
        'IMTIHON→RAZRYAD: razryad-so\'rov yaratilmadi (graceful)',
      );
      return;
    }

    this.logger.log(
      { cardId, targetRazryadId: nextR.data, employeeId, requestId: (created.data as Record<string, unknown>)?.id },
      'IMTIHON→RAZRYAD: AI-taklif razryad-so\'rovi yaratildi (2-imzo kutyapti)',
    );
  }
}
