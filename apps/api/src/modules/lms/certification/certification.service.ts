/**
 * @module certification.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable , Logger} from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  async checkWorkerCertification(workerId: number, operationId: number): Promise<Result<boolean>>{
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT 1 FROM lms_certificates
        WHERE employee_id = ${workerId}
          AND (course_id IS NULL OR course_id = ${operationId})
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `);
      return r.rows.length > 0;
    });
  }

  async getCertifications(query: Record<string, unknown> = {}): Promise<Result<{ items: Row[]; total: number; page: number; limit: number }>>{
    return safeCall(async () => {
      const page  = Math.max(1, Number(query['page']  ?? 1));
      const limit = Math.min(Number(query['limit'] ?? 10), 100);
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        runQuery<Row>(sql`
          SELECT lc.*, e.full_name AS employee_name
          FROM lms_certificates lc
          LEFT JOIN employees e ON e.id = lc.employee_id
          ORDER BY lc.issued_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `),
        runQuery<{ total: number }>(sql`
          SELECT COUNT(*)::int AS total FROM lms_certificates
        `),
      ]);
      const items  = Array.isArray(rows.rows) ? rows.rows : [];
      const total = Number(countRows.rows[0]?.total ?? 0);
      return { items, total, page, limit };
    });
  }

  async create(dto: Record<string, unknown>): Promise<Result<object>>{
    return safeCall(async () => {
      this.logger.log(`certification: yaratilmoqda`);
      const r = await runQuery<Row>(sql`
        INSERT INTO lms_certificates (employee_id, course_id, issued_at, expires_at, certificate_number)
        VALUES (
          ${Number(dto['employeeId'] ?? dto['employee_id'] ?? 0)},
          ${dto['courseId'] ?? dto['course_id'] ?? null},
          NOW(),
          ${dto['expiresAt'] ?? dto['expires_at'] ?? null},
          ${dto['certificateNumber'] ?? dto['certificate_number'] ?? null}
        )
        RETURNING *
      `);
      return r.rows[0] ?? { ...dto };
    });
  }
}
