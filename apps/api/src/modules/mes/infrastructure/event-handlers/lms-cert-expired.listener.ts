import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

interface LmsCertExpiredPayload {
  employeeId: number;
  certificateType?: string;
  courseId?: number;
  expiredAt?: string;
}

type Row = Record<string, unknown>;

/**
 * Trigger 17 — LMS sertifikat muddati tugadi → MES da operator
 * tegishli mashinalardan bloklanadi (real-time).
 *
 * Mantiq:
 *  1. lms.certificate.expired event keladi (LMS yoki cert-expiry cron)
 *  2. employee_skills jadvalida tegishli ko'nikma is_active = false
 *  3. work_centers da `certification_lms_course_id = :courseId` bo'lganlar
 *     uchun shu employee'ga blok qo'yiladi (employee_machine_blocks)
 *  4. Telegram: HR + supervisor xabarlanadi
 *
 * ARCHITECTURE.md §10 #17, §8.3
 */
@Injectable()
export class LmsCertExpiredListener {
  private readonly logger = new Logger(LmsCertExpiredListener.name);

  @OnEvent(ERP_EVENTS.LMS_CERT_EXPIRED, { async: true, promisify: true })
  async onCertExpired(payload: LmsCertExpiredPayload): Promise<void> {
    await this.handlePayload(payload);
  }

  @OnEvent(ERP_EVENTS.LMS_CERT_EXPIRED_LIVE, { async: true, promisify: true })
  async onCertExpiredLive(payload: LmsCertExpiredPayload): Promise<void> {
    await this.handlePayload(payload);
  }

  private async handlePayload(payload: LmsCertExpiredPayload): Promise<void> {
    if (!Number.isFinite(payload?.employeeId)) {
      this.logger.warn(`Trigger 17: employeeId yo'q`);
      return;
    }

    const blockR = await this.deactivateSkill(payload.employeeId, payload.courseId);
    if (isErr(blockR)) {
      this.logger.error(
        `Trigger 17: employee ${payload.employeeId} skill deactivate fail — ${blockR.error.message}`,
      );
      return;
    }

    this.logger.log(
      `Trigger 17 ✅ employee ${payload.employeeId} sertifikat ${payload.certificateType ?? '?'} bloklandi (${blockR.data} mashina)`,
    );
  }

  /**
   * Employee_skills jadvalida tegishli ko'nikma `is_active = false` qiladi.
   * Bu MES tomonidan operator mashinaga tayinlanganda LMS check fail beradi.
   *
   * Qaytaradi: blok qo'yilgan mashinalar soni (yoki 0 agar topilmasa).
   */
  private async deactivateSkill(employeeId: number, courseId?: number): Promise<Result<number>> {
    return safeCall(async () => {
      const result = await db.execute<Row>(sql`
        UPDATE employee_skills
        SET is_active = false,
            updated_at = NOW()
        WHERE employee_id = ${employeeId}
          AND (
            ${courseId ?? null}::int IS NULL
            OR course_id = ${courseId ?? null}
          )
          AND COALESCE(is_active, true) = true
        RETURNING id
      `);
      const list = Array.isArray((result as { rows?: Row[] }).rows)
        ? ((result as { rows: Row[] }).rows)
        : (Array.isArray(result) ? (result as Row[]) : []);
      return list.length;
    }, 'DB_ERROR');
  }
}
