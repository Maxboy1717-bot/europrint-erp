/**
 * @module telegram-admin.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class TelegramAdminService {
  async getStats(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS total_subscribers,
          COUNT(*) FILTER (WHERE status = 'active') AS active_subscribers
        FROM employees
        WHERE status != 'terminated'
      `);
      const row = dbRows(r)[0] ?? {};
      return {
        totalSubscribers:   Number(row['total_subscribers'] ?? 0),
        activeSubscribers:  Number(row['active_subscribers'] ?? 0),
        messagesLastDay:    0,
        messagesLastWeek:   0,
        botStatus:          'active',
        updatedAt:          _time.now().toISOString(),
      };
    });
  }

  async getUsers(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT e.id, e.employee_code AS "chatId", e.email AS username,
               e.first_name AS "firstName", e.status,
               CASE WHEN e.status = 'active' THEN true ELSE false END AS "isActive",
               COALESCE(primary_org.pos_name, '') AS role
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.status != 'terminated'
        ORDER BY e.first_name
        LIMIT 100
      `);
      const rows = Array.isArray(dbRows(r)) ? dbRows(r) : [];
      return { users: rows, total: rows.length };
    });
  }

  async broadcast(message: string, targetRole?: string) {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT COUNT(*) AS recipient_count
        FROM employees
        WHERE status = 'active'
      `);
      const row = dbRows(r)[0] ?? {};
      return {
        message,
        targetRole:     targetRole ?? 'all',
        recipientCount: Number(row['recipient_count'] ?? 0),
        sentAt:         _time.now().toISOString(),
        status:         'queued',
      };
    });
  }
}
