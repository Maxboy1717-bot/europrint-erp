/**
 * @module lms-cert-expired-block.service
 * @description Wave 4 round-2 (PA2-18): shared helper for the Trigger 17
 *   MES operator-blocking action when an LMS certificate expires.
 *   Previously a private method on `LmsCertExpiredListener`, extracted so
 *   the split canonical `@EventsHandler(CertificateExpiredEvent)` and
 *   `@EventsHandler(CertificateExpiredLiveEvent)` listeners can share the
 *   SQL + logging logic.
 *
 *   ARCHITECTURE.md §10 #17, §8.3
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class LmsCertExpiredBlockService {
  private readonly logger = new Logger(LmsCertExpiredBlockService.name);

  async block(params: {
    employeeId: number;
    courseId?: number;
    certificateType?: string;
  }): Promise<void> {
    const { employeeId, courseId, certificateType } = params;
    if (!Number.isFinite(employeeId)) {
      this.logger.warn(`Trigger 17: employeeId yo'q`);
      return;
    }

    const blockR = await this.deactivateSkill(employeeId, courseId);
    if (isErr(blockR)) {
      this.logger.error(
        `Trigger 17: employee ${employeeId} skill deactivate fail — ${blockR.error.message}`,
      );
      return;
    }

    this.logger.log(
      `Trigger 17 OK employee ${employeeId} sertifikat ${certificateType ?? '?'} bloklandi (${blockR.data} mashina)`,
    );
  }

  /**
   * Employee_skills jadvalida tegishli ko'nikma `is_active = false` qiladi.
   * Bu MES tomonidan operator mashinaga tayinlanganda LMS check fail beradi.
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
