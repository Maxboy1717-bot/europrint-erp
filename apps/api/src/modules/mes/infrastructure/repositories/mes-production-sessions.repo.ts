/**
 * @module mes-production-sessions.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { nextDocNumber } from '@common/database/doc-sequences.helper';

type Row = Record<string, unknown>;

@Injectable()
export class MesProductionSessionsRepository {
  private readonly logger = new Logger(MesProductionSessionsRepository.name);

  async listSessions(page: number, limit: number, status?: string): Promise<Row[]> {
    try {
      // Query mes_production_sessions (canonical IoT/MES data) with equipment join.
      // mes_sessions lacks target_quantity, actual_quantity, oee etc. — wrong table.
      const rows = await runQuery<Row>(sql`
        SELECT
          mps.id,
          mps.session_number,
          mps.production_order_id,
          mps.equipment_id,
          mps.worker_id,
          mps.status,
          mps.target_quantity,
          mps.actual_quantity,
          mps.defect_quantity,
          mps.running_time_seconds,
          mps.stopped_time_seconds,
          mps.oee,
          mps.started_at,
          mps.ended_at,
          mps.availability,
          mps.performance,
          mps.quality,
          eq.name AS equipment_name,
          -- A53 — xodim↔KARTA: surface the working operator's primary card in the list too
          -- (same resolution chain as getSession: users.card_id → employee_cards → org_department_id).
          COALESCE(u.card_id, ec.card_id, u.org_department_id) AS operator_card_id,
          card.name             AS operator_card_name,
          card.razryad_level_id AS operator_card_razryad_level_id
        FROM mes_production_sessions mps
        LEFT JOIN equipment eq ON eq.id = mps.equipment_id
        LEFT JOIN users u ON u.id = mps.worker_id
        LEFT JOIN employees emp ON emp.user_id = u.id
        LEFT JOIN employee_cards ec ON ec.employee_id = emp.id
          AND ec.is_active = true AND ec.is_primary = true
        LEFT JOIN org_departments card
          ON card.id = COALESCE(u.card_id, ec.card_id, u.org_department_id)
        WHERE mps.deleted_at IS NULL
          AND (${status ?? null}::text IS NULL OR mps.status = ${status ?? null})
        ORDER BY mps.started_at DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`listSessions: ${(err as Error).message}`);
      return [];
    }
  }

  async createSession(body: Row): Promise<Row | null> {
    try {
      // Canonical session table = `production_sessions` (mes_production_sessions is a VIEW over it; the
      // golden-thread PP-release listener and listSessions both target this table). Writing here makes
      // created rows visible in GET list/:id. Read the SAME validated keys the DTO produces; accept both
      // snake_case (work_center_id / production_order_id / operator_id) and camelCase fallbacks so neither
      // controller's payload shape drops input. equipment_id/worker_id/production_order_id/target_quantity
      // are NOT NULL with no FK → default to 0 ("unassigned") when omitted.
      const productionOrderId = Number(body.production_order_id ?? body.work_order_id ?? body.ppOrderId ?? 0) || 0;
      const workCenterId = Number(body.work_center_id ?? body.machine_id ?? body.workCenterId ?? 0) || 0;
      const operatorId = Number(body.operator_id ?? body.operatorId ?? 0) || 0;
      const targetQuantity = Number(body.planned_qty ?? body.target_quantity ?? 0) || 0;
      const notes = (body.notes ?? null) as string | null;
      const sessionNumber = await nextDocNumber('MES');

      const rows = await runQuery<Row>(sql`
        INSERT INTO production_sessions
          (session_number, production_order_id, equipment_id, worker_id, machine_id, operator_id,
           target_quantity, worker_notes, status, started_at, created_at, updated_at)
        VALUES (
          ${sessionNumber}, ${productionOrderId}, ${workCenterId}, ${operatorId},
          ${workCenterId}, ${operatorId}, ${targetQuantity}, ${notes}, 'pending', NOW(), NOW(), NOW())
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
      // Read the canonical table (same as createSession + listSessions VIEW) so freshly-created rows are
      // visible. equipment_id → equipment.name (work center); worker_id → users (operator).
      //
      // A53 — xodim↔KARTA bog'lanishi: the working employee's KARTA (card = org_departments, kanonik
      // KARTA-markaz). Session.worker_id is a users.id, so resolve the operator's primary card via:
      //   1) users.card_id (birlamchi karta pointer — direct, fastest)   — see EGASI 8-qaror (login/RBAC=birlamchi karta)
      //   2) employee_cards (M:N canonical, PHASE-00) joined through employees.user_id, is_primary+is_active
      //   3) users.org_department_id (legacy single-dept fallback)
      // COALESCE picks the first non-NULL. card_id NULL → operator has no card (no oylik/login per vizyon);
      // we surface NULLs rather than fabricating (Q-40). razryad_level_id rides along for the card's grade.
      const rows = await runQuery<Row>(sql`
        SELECT ps.*,
               eq.name AS work_center_name,
               (u.first_name || ' ' || u.last_name) AS operator_name,
               COALESCE(u.card_id, ec.card_id, u.org_department_id) AS operator_card_id,
               card.name                AS operator_card_name,
               card.code                AS operator_card_code,
               card.razryad_level_id    AS operator_card_razryad_level_id,
               card.node_type           AS operator_card_node_type
        FROM production_sessions ps
        LEFT JOIN equipment eq ON eq.id = ps.equipment_id
        LEFT JOIN users u ON u.id = ps.worker_id
        LEFT JOIN employees emp ON emp.user_id = u.id
        LEFT JOIN employee_cards ec ON ec.employee_id = emp.id
          AND ec.is_active = true AND ec.is_primary = true
        LEFT JOIN org_departments card
          ON card.id = COALESCE(u.card_id, ec.card_id, u.org_department_id)
        WHERE ps.id = ${id} AND ps.deleted_at IS NULL
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
