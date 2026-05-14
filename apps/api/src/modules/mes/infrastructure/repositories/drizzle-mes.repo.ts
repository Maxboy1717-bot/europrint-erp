/**
 * @module drizzle-mes.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Err, Ok } from '@common/result';
import { Result } from '@common/result';
import { ProductionSession } from '../../domain/aggregates/production-session.aggregate';
import { IMesRepository } from '../../domain/repositories/mes.repository';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleMesRepository implements IMesRepository {
  private readonly logger = new Logger(DrizzleMesRepository.name);

  async saveSession(session: ProductionSession): Promise<Result<number>> {
    try {
      const r = await exec(sql`INSERT INTO production_sessions (pp_id, work_center_id, operator_id, status, certification_required, started_at, completed_at) VALUES (${session['ppId']}, ${session['workCenterId']}, ${session.getOperatorId()}, ${session.getStatus()}, ${session.getCertificationRequired()}, ${session['startedAt']}, ${session['completedAt']}) RETURNING id`);
      return Ok(Number(r[0]?.id ?? 0));
    } catch {
      this.logger.error('Failed to save production session');
      return Err('Sessiya saqlashda xatolik');
    }
  }

  async getSession(id: number): Promise<Result<ProductionSession>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE id = ${id} LIMIT 1`);
      if (!r[0]) return Err('Sessiya topilmadi');
      const row = r[0];
      return Ok(new ProductionSession(Number(row.id), Number(row.pp_id), Number(row.work_center_id), Number(row.operator_id), Boolean(row.certification_required)));
    } catch {
      this.logger.error('Failed to get session');
      return Err('Oqish xatoligi');
    }
  }

  async getSessionByPpId(ppId: number): Promise<Result<ProductionSession>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE pp_id = ${ppId} LIMIT 1`);
      if (!r[0]) return Err('Sessiya topilmadi');
      const row = r[0];
      return Ok(new ProductionSession(Number(row.id), Number(row.pp_id), Number(row.work_center_id), Number(row.operator_id), Boolean(row.certification_required)));
    } catch {
      this.logger.error('Failed to get session by PP');
      return Err('Oqish xatoligi');
    }
  }

  async getAllSessionsByStatus(status: string): Promise<Result<ProductionSession[]>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE status = ${status}`);
      return Ok(r.map((row) => new ProductionSession(Number(row.id), Number(row.pp_id), Number(row.work_center_id), Number(row.operator_id), Boolean(row.certification_required))));
    } catch {
      this.logger.error('Failed to get sessions');
      return Err('Oqish xatoligi');
    }
  }

  async checkOperatorCertification(operatorId: number, courseId: number): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT * FROM operator_certifications WHERE operator_id = ${operatorId} AND course_id = ${courseId} LIMIT 1`);
      const cert = r[0];
      if (!cert) {
        return { ok: true as const, data: { valid: false, courseName: 'Unknown Course', expiresAt: null } };
      }
      const now = _time.now();
      const valid = cert.expires_at ? new Date(String(cert.expires_at)) > now : false;
      return { ok: true as const, data: { valid, courseName: cert.course_name, expiresAt: cert.expires_at } };
    } catch {
      this.logger.error('Failed to check certification');
      return Err('Sertifikat tekshirishda xatolik');
    }
  }
}
