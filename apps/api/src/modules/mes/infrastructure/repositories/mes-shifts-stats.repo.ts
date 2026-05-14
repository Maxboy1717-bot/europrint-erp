/**
 * @module mes-shifts-stats.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class MesShiftsStatsRepository {
  async getCurrentShift(): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      SELECT ms.*
      FROM mes_sessions ms
      WHERE ms.status = 'active' LIMIT 1
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }

  async shiftHandover(outgoing_supervisor: number, incoming_supervisor: number, notes: string | null, issues: string | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_shift_handovers (outgoing_supervisor, incoming_supervisor, notes, issues, handover_time)
      VALUES (${outgoing_supervisor}, ${incoming_supervisor}, ${notes ?? null}, ${issues ?? null}, NOW()) RETURNING *
    `);
    return rows.rows as Row[];
  }

  async closeShiftEvaluation(shift_id: number, supervisor_id: number | null, production_score: number, quality_score: number, safety_score: number, notes: string | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_shift_evaluations (shift_id, supervisor_id, production_score, quality_score, safety_score, notes, evaluated_at)
      VALUES (${shift_id}, ${supervisor_id ?? null}, ${production_score ?? 0}, ${quality_score ?? 0}, ${safety_score ?? 0}, ${notes ?? null}, NOW())
      ON CONFLICT (shift_id) DO UPDATE
        SET production_score = EXCLUDED.production_score, quality_score = EXCLUDED.quality_score,
            safety_score = EXCLUDED.safety_score, notes = EXCLUDED.notes, evaluated_at = NOW()
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getShiftEvaluations(from: string | undefined, to: string | undefined, lim: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT se.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS supervisor_name
      FROM mes_shift_evaluations se
      LEFT JOIN employees e ON e.id = se.supervisor_id
      WHERE (${from ?? null}::date IS NULL OR se.evaluated_at::date >= ${from ?? null}::date)
        AND (${to ?? null}::date IS NULL OR se.evaluated_at::date <= ${to ?? null}::date)
      ORDER BY se.evaluated_at DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  async getOee(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT e.id, e.name, e.status, COALESCE(AVG(ps.oee), 0)::numeric(5,2) AS oee
      FROM equipment e
      LEFT JOIN production_sessions ps ON ps.equipment_id = e.id AND ps.deleted_at IS NULL
      WHERE e.is_active = true GROUP BY e.id, e.name, e.status ORDER BY e.name
    `);
    return rows.rows as Row[];
  }

  async getStats(d: string): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_sessions,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(end_time) = ${d}::date)::int AS completed_today,
        COALESCE(SUM(produced_qty) FILTER (WHERE DATE(end_time) = ${d}::date), 0)::int AS produced_today,
        COALESCE(AVG(CASE WHEN produced_qty > 0 THEN defect_qty::float / produced_qty END) * 100, 0)::numeric(5,2) AS defect_rate
      FROM mes_production_sessions
      WHERE DATE(created_at) >= ${d}::date - INTERVAL '7 days'
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getGamificationLeaderboard(interval: string): Promise<Row[]> {
    const safeInterval = (interval || '30 days').replace(/[^0-9a-zA-Z ]/g, '');
    const rows = await runQuery<Row>(sql`
      SELECT e.id, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name, e.department_id,
             COALESCE(SUM(gp.points), 0)::int AS total_points,
             COUNT(gp.id)::int AS achievement_count
      FROM employees e
      LEFT JOIN gamification_points gp ON gp.employee_id = e.id AND gp.created_at >= NOW() - ${safeInterval}::interval
      WHERE e.status = 'active'
      GROUP BY e.id, e.first_name, e.last_name, e.department_id
      ORDER BY total_points DESC, achievement_count DESC LIMIT 20
    `);
    return rows.rows as Row[];
  }

  async getPapkaOrders(status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT po.*, so.order_number AS sales_order_number
      FROM mes_papka_orders po LEFT JOIN sales_orders so ON so.id = po.sales_order_id
      WHERE (${status ?? null}::text IS NULL OR po.status = ${status ?? null})
      ORDER BY po.created_at DESC LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  async pauseSession(sid: number, reason: string | undefined): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE mes_production_sessions
      SET status = 'paused', pause_reason = ${reason ?? null}, paused_at = NOW(), updated_at = NOW()
      WHERE id = ${sid} AND status = 'active' RETURNING *
    `);
    return rows.rows as Row[];
  }

  async resumeSession(sid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE mes_production_sessions SET status = 'active', paused_at = NULL, updated_at = NOW()
      WHERE id = ${sid} AND status = 'paused' RETURNING *
    `);
    return rows.rows as Row[];
  }

  async updateSessionQuantity(sid: number, produced_qty?: number, rejected_qty?: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE mes_production_sessions
      SET produced_qty = COALESCE(${produced_qty ?? null}, produced_qty),
          defect_qty = COALESCE(${rejected_qty ?? null}, defect_qty),
          updated_at = NOW()
      WHERE id = ${sid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async recordMaterialConsumption(session_id: number, material_id: number, quantity: number, batch_number: string | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_material_consumption (session_id, material_id, quantity, batch_number, recorded_at)
      VALUES (${session_id}, ${material_id}, ${quantity ?? 0}, ${batch_number ?? null}, NOW()) RETURNING *
    `);
    return rows.rows as Row[];
  }
}
