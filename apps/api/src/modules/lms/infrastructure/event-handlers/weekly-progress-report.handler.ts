/**
 * @module weekly-progress-report.handler
 * @description 12-lms #27 (non-AI half): haftalik avto progress hisobot.
 *   Har hafta har bir o'quvchi-xodim uchun (enrollments + lms_exam_attempts)
 *   yig'ma progress hisoblab, uch manzilga `notifications` yoziladi:
 *   o'zi (self, users.id), murabbiy (lms_card_mentors.mentor_user_id) va
 *   HR (users.role='HR_MANAGER'). AI "orqadagilar tahlili" bu hisobotdan
 *   TASHQARIDA — AI-kalit owner-gated (Item #8/#33/#43 bilan bir blok);
 *   bu faqat non-AI yig'ma hisobot.
 *
 *   @Cron uslubi cert-expiry.handler.ts bilan bir xil; bildirishnoma INSERT
 *   uslubi rasporyazhenie-escalation.cron.ts:76 bilan bir xil. Barcha DB-kirish
 *   LmsRepository orqali (Qoida 15) — handler faqat matn tuzadi va yo'naltiradi.
 * @layer Infrastructure / Event-handler (Cron)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LmsRepository } from '../repositories/drizzle-lms.repo';

@Injectable()
export class WeeklyProgressReportHandler {
  private readonly logger = new Logger(WeeklyProgressReportHandler.name);

  constructor(private readonly lmsRepo: LmsRepository) {}

  /**
   * Haftalik yig'ma progress hisobot. EVERY_WEEK (yakshanba 00:00) — cert-expiry
   * kunlik sweep bilan bir uslub, owner-tomonidan-belgilanadigan qiymat yo'q.
   * Har xodim uchun self + murabbiy + HR bildirishnoma yuboriladi.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyProgressReports(): Promise<void> {
    const r = await this.lmsRepo.findWeeklyProgressReport();
    if (!r.ok) {
      this.logger.error(`Weekly progress report fetch failed: ${r.error}`);
      return;
    }
    const rows = r.data;
    if (rows.length === 0) {
      this.logger.debug('Weekly progress report: no enrolled employees');
      return;
    }

    // HR manzillari global — bir marta o'qiladi (per-xodim emas).
    const hrR = await this.lmsRepo.findHrManagerUserIds();
    const hrIds = hrR.ok ? hrR.data : [];

    let sent = 0;
    for (const row of rows) {
      const title = 'Haftalik o\'qish hisoboti';
      const body =
        `Tugallangan: ${row.completedCourses}/${row.totalCourses} kurs, ` +
        `o'rtacha ${row.avgProgress}%. ` +
        `Imtihon: ${row.examsPassed} o'tdi, ${row.examsFailed} yiqildi.`;

      // 1) Xodimning o'ziga.
      const selfRes = await this.lmsRepo.insertProgressNotification(
        row.selfUserId, 'lms_weekly_progress', title, body, row.employeeId, 'normal',
      );
      if (selfRes.ok) sent += 1;

      // 2) Murabbiy(lar)ga (karta orqali; karta bog'lanmagan bo'lsa ro'yxat bo'sh -> no-op).
      const mentorRes = await this.lmsRepo.findActiveMentorUserIdsByCard(row.cardId ?? 0);
      const mentorIds = mentorRes.ok ? mentorRes.data : [];
      for (const mentorId of mentorIds) {
        const mRes = await this.lmsRepo.insertProgressNotification(
          mentorId, 'lms_weekly_progress_mentor',
          `Shogird haftalik hisoboti (xodim #${row.employeeId})`, body, row.employeeId, 'normal',
        );
        if (mRes.ok) sent += 1;
      }

      // 3) HR ga (RBAC role bo'yicha; HR_MANAGER yo'q bo'lsa ro'yxat bo'sh -> no-op).
      for (const hrId of hrIds) {
        const hRes = await this.lmsRepo.insertProgressNotification(
          hrId, 'lms_weekly_progress_hr',
          `HR: haftalik o'qish (xodim #${row.employeeId})`, body, row.employeeId, 'normal',
        );
        if (hRes.ok) sent += 1;
      }
    }

    this.logger.log(
      `Weekly progress report: ${rows.length} employee(s), ${sent} notification(s) sent`,
    );
  }
}
