import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql, isNull } from 'drizzle-orm';
import { visitor_log, hrEmployees } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class ReceptionRepository {
  async checkInVisitor(dto: { visitorName: string; visitorPhone?: string; visitorCompany?: string; purpose: string; hostEmployeeId: number; badgeNumber: string; registeredBy?: number; idDocument?: string; idDocumentType?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(visitor_log).values({
        visitor_name:     dto.visitorName,
        visitor_phone:    dto.visitorPhone ?? null,
        visitor_company:  dto.visitorCompany ?? null,
        purpose:          dto.purpose,
        host_employee_id: dto.hostEmployeeId,
        badge_number:     dto.badgeNumber,
        registered_by:    dto.registeredBy ?? null,
        id_document:      dto.idDocument ?? null,
        id_document_type: dto.idDocumentType ?? 'passport',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async checkOutVisitor(visitorId: number, notes?: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(visitor_log).set({
        check_out_at: _time.now(),
        notes:        notes ?? null,
      }).where(sql`${visitor_log.id} = ${visitorId} AND ${visitor_log.check_out_at} IS NULL`).returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async validateBadge(badgeNumber: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT vl.*, e.first_name || ' ' || e.last_name AS host_name
        FROM visitor_log vl
        LEFT JOIN employees e ON e.id = vl.host_employee_id
        WHERE vl.badge_number = ${badgeNumber} AND vl.check_out_at IS NULL
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getActiveVisitors(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT vl.*, e.first_name || ' ' || e.last_name AS host_name
        FROM visitor_log vl
        LEFT JOIN employees e ON e.id = vl.host_employee_id
        WHERE vl.check_out_at IS NULL
        ORDER BY vl.check_in_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getVisitorLog(lim: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT vl.*, e.first_name || ' ' || e.last_name AS host_name
        FROM visitor_log vl
        LEFT JOIN employees e ON e.id = vl.host_employee_id
        ORDER BY vl.check_in_at DESC
        LIMIT ${lim}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        active_visitors: sql<number>`COUNT(*) FILTER (WHERE ${visitor_log.check_out_at} IS NULL)`,
        today_visitors:  sql<number>`COUNT(*) FILTER (WHERE DATE(${visitor_log.check_in_at}) = CURRENT_DATE)`,
        month_visitors:  sql<number>`COUNT(*) FILTER (WHERE ${visitor_log.check_in_at} >= DATE_TRUNC('month', CURRENT_DATE))`,
      }).from(visitor_log);
      return (r[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async autoCheckoutOverdue(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        UPDATE visitor_log
        SET check_out_at = NOW(), status = 'auto_checked_out'
        WHERE check_out_at IS NULL AND check_in_at < NOW() - INTERVAL '12 hours'
        RETURNING id, visitor_name, host_employee_id
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }
}
