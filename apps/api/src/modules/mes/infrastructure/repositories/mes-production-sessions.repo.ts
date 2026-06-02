/**
 * @module mes-production-sessions.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class MesProductionSessionsRepository {
  private readonly logger = new Logger(MesProductionSessionsRepository.name);

  async listSessions(page: number, limit: number, status?: string): Promise<Row[]> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT ms.*, wc.name AS work_center_name, (u.first_name || ' ' || u.last_name) AS operator_name
        FROM mes_sessions ms
        LEFT JOIN work_centers wc ON wc.id = ms.work_center_id
        LEFT JOIN users u ON u.id = ms.operator_id
        WHERE (${status ?? null}::text IS NULL OR ms.status = ${status ?? null})

        ORDER BY ms.started_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`listSessions: ${(err as Error).message}`);
      return [];
    }
  }

  async createSession(body: Row): Promise<Row | null> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO mes_sessions (work_center_id, operator_id, production_order_id, started_at, status)
        VALUES (${body.workCenterId ?? null}, ${body.operatorId ?? null}, ${body.ppOrderId ?? null}, NOW(), 'pending')
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`createSession: ${(err as Error).message}`);
      return null;
    }
  }

  async getSession(id: number): Promise<Row | null> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT ms.*, wc.name AS work_center_name, (u.first_name || ' ' || u.last_name) AS operator_name
        FROM mes_sessions ms
        LEFT JOIN work_centers wc ON wc.id = ms.work_center_id
        LEFT JOIN users u ON u.id = ms.operator_id
        WHERE ms.id = ${id}
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`getSession: ${(err as Error).message}`);
      return null;
    }
  }

  async recordDowntimeForSession(sessionId: number, body: Row): Promise<Row | null> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO downtime_events (session_id, reason_description, duration_minutes, started_at, event_type)
        VALUES (${sessionId}, ${body.reason ?? 'unspecified'}, ${body.durationMinutes ?? 0}, NOW(), 'downtime')
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`recordDowntimeForSession: ${(err as Error).message}`);
      return null;
    }
  }

  async listDowntimeEvents(sessionId: number): Promise<Row[]> {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM downtime_events WHERE session_id = ${sessionId} ORDER BY started_at DESC`);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`listDowntimeEvents: ${(err as Error).message}`);
      return [];
    }
  }
}
