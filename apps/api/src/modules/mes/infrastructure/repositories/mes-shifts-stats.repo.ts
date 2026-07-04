/**
 * @module mes-shifts-stats.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  OEE_PERCENT_SCALE,
  OEE_PERFORMANCE_CAP,
  OEE_ROUND_FACTOR,
  SECONDS_PER_MINUTE_OEE,
} from '../../constants/mes.constants';

type Row = Record<string, unknown>;

@Injectable()
export class MesShiftsStatsRepository {
  async getCurrentShift(): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      SELECT
        ms.id,
        ms.status,
        ms.started_at                                                        AS start_time,
        ms.operator_id,
        ms.notes,
        COALESCE(e.first_name || ' ' || e.last_name, 'Operator')            AS operator_name,
        eq.status                                                            AS machine_status,
        COALESCE(SUM(mps.actual_quantity), 0)::int                          AS produced_qty,
        COALESCE(SUM(mps.defect_quantity), 0)::int                          AS brak_qty,
        -- REAL live OEE (A×P×Q from actual signals) — NOT the stale pre-stored
        -- mps.oee (documented mixed-scale demo seed; averaging it was a green lie).
        -- Mirrors getOee()'s world-standard formula over the running sessions:
        --   A = run/(run+stop), P = actual/target (cap 100%), Q = (actual-defect)/actual.
        -- downtime_events fold-in is omitted here (run/stop seconds already capture
        -- stoppage); getOee() stays the per-machine canonical. Every divisor guarded.
        CASE
          WHEN (SUM(COALESCE(mps.running_time_seconds,0)) + SUM(COALESCE(mps.stopped_time_seconds,0))) > 0
           AND SUM(COALESCE(mps.target_quantity,0)) > 0
           AND SUM(COALESCE(mps.actual_quantity,0)) > 0
          THEN ROUND((
                 (100.0 * SUM(mps.running_time_seconds)
                        / NULLIF(SUM(mps.running_time_seconds) + SUM(mps.stopped_time_seconds), 0))
               * LEAST(100.0, 100.0 * SUM(mps.actual_quantity) / NULLIF(SUM(mps.target_quantity), 0))
               * (100.0 * (SUM(mps.actual_quantity) - SUM(mps.defect_quantity))
                        / NULLIF(SUM(mps.actual_quantity), 0))
               / 10000.0)::numeric, 2)
          ELSE 0
        END                                                                  AS oee
      FROM mes_sessions ms
      LEFT JOIN employees           e   ON e.id  = ms.operator_id
      LEFT JOIN equipment           eq  ON eq.id = ms.machine_id
      LEFT JOIN mes_production_sessions mps ON mps.status IN ('running','in_progress')
      WHERE ms.status = 'active'
      GROUP BY ms.id, ms.status, ms.started_at, ms.operator_id, ms.notes,
               e.first_name, e.last_name, eq.status
      LIMIT 1
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }

  async shiftHandover(outgoing_supervisor: number, incoming_supervisor: number, notes: string | null, issues: string | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_shift_handovers (outgoing_supervisor, received_by, handed_over_by, handover_date, department, notes, issues, handover_time)
      VALUES (${outgoing_supervisor}, ${incoming_supervisor}, ${outgoing_supervisor}, to_char(NOW(),'YYYY-MM-DD'), '', ${notes ?? null}, ${issues ?? null}, NOW()) RETURNING *
    `);
    return rows.rows as Row[];
  }

  /**
   * Handover tasdiq-gate (SB0429): shiftHandover() above creates a 'pending'
   * draft with no signature — anyone could treat it as "done" even though the
   * receiving supervisor never actually acknowledged it. This closes that gap
   * the same way pos-shift-handover.service.ts's 2-signature gate does: the
   * row only flips 'pending' → 'confirmed' when the RECEIVING supervisor
   * (received_by) submits a signature, and the WHERE clause makes every
   * failure mode return 0 rows (caught by the caller as NOT_FOUND/forbidden):
   *   - already confirmed (status <> 'pending')            → 0 rows
   *   - wrong user confirming (received_by <> confirmerId) → 0 rows
   * INSERT into mes_shift_handovers (the VIEW) is a no-go for UPDATE targeting
   * — write straight to the base table (shift_handovers), consistent with
   * closeShiftEvaluation()'s base-table-not-view rule above.
   */
  async confirmShiftHandover(id: number, confirmerId: number, signatureData: string): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE shift_handovers
      SET status = 'confirmed', signature_data = ${signatureData}
      WHERE id = ${id} AND status = 'pending' AND received_by = ${confirmerId}
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async closeShiftEvaluation(shift_id: number, supervisor_id: number | null, production_score: number, quality_score: number, safety_score: number, notes: string | null): Promise<Row[]> {
    // INSERT into base table (shift_evaluations), NOT the VIEW (mes_shift_evaluations).
    // Column mapping: supervisor_id→operator_id, production_score→productivity_score.
    // eval_id (NOT NULL, unique) is seeded from shift_id; shift_name (NOT NULL) defaults to ''.
    // ON CONFLICT uses eval_id (shift_evaluations_eval_id_unique index).
    const prod = production_score ?? 0;
    const qual = quality_score ?? 0;
    const safe = safety_score ?? 0;
    const overall = Math.round((prod + qual + safe) / 3);
    const rows = await runQuery<Row>(sql`
      INSERT INTO shift_evaluations (eval_id, shift_name, operator_id, productivity_score, quality_score, safety_score, overall_score, notes, evaluated_at, shift_id)
      VALUES (${shift_id}, '', ${supervisor_id ?? null}, ${prod}, ${qual}, ${safe}, ${overall}, ${notes ?? null}, NOW(), ${shift_id})
      ON CONFLICT (eval_id) DO UPDATE
        SET productivity_score = EXCLUDED.productivity_score,
            quality_score      = EXCLUDED.quality_score,
            safety_score       = EXCLUDED.safety_score,
            overall_score      = EXCLUDED.overall_score,
            notes              = EXCLUDED.notes,
            evaluated_at       = NOW()
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getShiftEvaluations(from: string | undefined, to: string | undefined, lim: number): Promise<Row[]> {
    // operator_id is the real column (supervisor_id does not exist in shift_evaluations).
    // Reading from the VIEW (mes_shift_evaluations) is fine for SELECT.
    const rows = await runQuery<Row>(sql`
      SELECT se.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS supervisor_name
      FROM mes_shift_evaluations se
      LEFT JOIN employees e ON e.id = se.operator_id
      WHERE (${from ?? null}::date IS NULL OR se.evaluated_at::date >= ${from ?? null}::date)
        AND (${to ?? null}::date IS NULL OR se.evaluated_at::date <= ${to ?? null}::date)
      ORDER BY se.evaluated_at DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  async getOee(): Promise<{ machines: Row[]; averageOee: number }> {
    // REAL OEE — world-standard formula computed from production_sessions actual
    // signals, NOT the pre-stored ps.oee/availability/... columns (those held
    // inconsistent demo seed values mixing 0-1 and 0-100 scales, and a "running"
    // session with NULLs; averaging them was a green lie that ignored real
    // run-time, output and defects).
    //
    //   OEE = Availability × Performance × Quality   (each factor on 0-100 scale)
    //     Availability = run / (run + stop + logged-downtime)
    //                    run/stop from running_time_seconds/stopped_time_seconds;
    //                    downtime_events duration is FOLDED IN so logged stoppages
    //                    (setup/changeover/breakdown) reduce availability.
    //     Performance  = actual_quantity / target_quantity  (capped at 100% — target
    //                    is the planned output; over-run does not inflate OEE).
    //     Quality      = (actual_quantity − defect_quantity) / actual_quantity
    //                    = good units / produced units (real fraction).
    //
    // Aggregation is numerator/denominator-first per machine (SUM the seconds and
    // quantities across that machine's sessions, then derive the factor once) so a
    // machine with several sessions is weighted by real volume, not a naive average
    // of per-session percentages. Every divisor is guarded → 0, never NaN/100.
    // A machine with no (non-deleted) sessions scores 0 (honest-empty); an empty
    // production_sessions table yields all-zero machines and averageOee 0.
    const rows = await runQuery<Row>(sql`
      WITH dt AS (
        SELECT session_id,
               SUM(COALESCE(duration_min, duration_minutes, duration_seconds / 60.0, 0))::numeric AS downtime_min
        FROM downtime_events
        GROUP BY session_id
      ),
      sess AS (
        SELECT ps.equipment_id,
               COUNT(*)::int                                          AS session_count,
               SUM(COALESCE(ps.running_time_seconds, 0))::numeric     AS run_s,
               SUM(COALESCE(ps.stopped_time_seconds, 0))::numeric     AS stop_s,
               SUM(COALESCE(dt.downtime_min, 0) * ${SECONDS_PER_MINUTE_OEE}::numeric)::numeric AS downtime_s,
               SUM(COALESCE(ps.target_quantity, 0))::numeric          AS target_qty,
               SUM(COALESCE(ps.actual_quantity, 0))::numeric          AS actual_qty,
               SUM(COALESCE(ps.defect_quantity, 0))::numeric          AS defect_qty
        FROM production_sessions ps
        LEFT JOIN dt ON dt.session_id = ps.id
        WHERE ps.deleted_at IS NULL
        GROUP BY ps.equipment_id
      )
      SELECT e.id, e.name, e.status,
             COALESCE(s.session_count, 0)                             AS session_count,
             CASE WHEN COALESCE(s.run_s, 0) + COALESCE(s.stop_s, 0) + COALESCE(s.downtime_s, 0) > 0
                  THEN ROUND(${OEE_PERCENT_SCALE}::numeric * s.run_s / (s.run_s + s.stop_s + s.downtime_s), 2)
                  ELSE 0 END::numeric(5,2)                            AS availability,
             CASE WHEN COALESCE(s.target_qty, 0) > 0
                  THEN ROUND(LEAST(${OEE_PERFORMANCE_CAP}::numeric, ${OEE_PERCENT_SCALE}::numeric * s.actual_qty / s.target_qty), 2)
                  ELSE 0 END::numeric(5,2)                            AS performance,
             CASE WHEN COALESCE(s.actual_qty, 0) > 0
                  THEN ROUND(${OEE_PERCENT_SCALE}::numeric * (s.actual_qty - s.defect_qty) / s.actual_qty, 2)
                  ELSE 0 END::numeric(5,2)                            AS quality
      FROM equipment e
      LEFT JOIN sess s ON s.equipment_id = e.id
      WHERE e.is_active = true AND e.deleted_at IS NULL
      GROUP BY e.id, e.name, e.status, s.session_count, s.run_s, s.stop_s, s.downtime_s, s.target_qty, s.actual_qty, s.defect_qty
      ORDER BY e.name
    `);

    const machines: Row[] = (rows.rows as Row[]).map((r) => {
      const availability = Number(r['availability'] ?? 0);
      const performance = Number(r['performance'] ?? 0);
      const quality = Number(r['quality'] ?? 0);
      // OEE = A × P × Q. Factors are on the 0-100 scale, so divide by scale² to
      // keep the product on the same 0-100 scale.
      const oee =
        Math.round(
          (availability * performance * quality) /
            (OEE_PERCENT_SCALE * OEE_PERCENT_SCALE) *
            OEE_ROUND_FACTOR,
        ) / OEE_ROUND_FACTOR;
      return { ...r, oee };
    });

    // averageOee over machines that actually ran (session_count > 0); idle machines
    // with no production must not drag the floor average to 0.
    const active = machines.filter((m) => Number(m['session_count'] ?? 0) > 0);
    const avgOee =
      active.length > 0
        ? active.reduce((s, r) => s + Number(r['oee'] ?? 0), 0) / active.length
        : 0;
    return { machines, averageOee: Math.round(avgOee * OEE_ROUND_FACTOR) / OEE_ROUND_FACTOR };
  }

  async getStats(d: string): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('in_progress', 'running'))::int AS active_sessions,
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

  /**
   * 3.6 MES stage-tracking — pause a running session.
   * FIX (Q-46, was dead code): the old WHERE matched status='active', a value
   * production_sessions never holds (real vocabulary is running/in_progress/
   * paused/completed — verified via information_schema + live rows 2026-07-03),
   * so this UPDATE silently affected 0 rows for every real session. Now matches
   * the real "currently working" statuses.
   * Also freezes the GSD stage clock: current_stage's elapsed time (since
   * stage_started_at) is folded into its accumulator (setup/main/teardown_seconds)
   * and stage_started_at is cleared to NULL — the stage itself is NOT advanced
   * (pause is not a stage transition), it just stops accruing time while paused.
   * resumeSession restarts the clock on the SAME current_stage.
   */
  async pauseSession(sid: number, reason: string | undefined): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      WITH before AS (
        SELECT id, status, current_stage, stage_started_at, setup_seconds, main_seconds, teardown_seconds
        FROM production_sessions
        WHERE id = ${sid} AND status IN ('running', 'in_progress') AND deleted_at IS NULL
        FOR UPDATE
      )
      UPDATE production_sessions ps
      SET status = 'paused',
          setup_seconds = CASE WHEN b.current_stage = 'setup' AND b.stage_started_at IS NOT NULL
            THEN b.setup_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - b.stage_started_at))::int)
            ELSE b.setup_seconds END,
          main_seconds = CASE WHEN b.current_stage = 'main' AND b.stage_started_at IS NOT NULL
            THEN b.main_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - b.stage_started_at))::int)
            ELSE b.main_seconds END,
          teardown_seconds = CASE WHEN b.current_stage = 'teardown' AND b.stage_started_at IS NOT NULL
            THEN b.teardown_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - b.stage_started_at))::int)
            ELSE b.teardown_seconds END,
          stage_started_at = NULL,
          updated_at = NOW()
      FROM before b
      WHERE ps.id = b.id
      RETURNING ps.*
    `);
    const row = rows.rows[0] as Row | undefined;
    if (row) {
      await this.logStageTransition(sid, 'PAUSE', String(row.current_stage ?? ''), String(row.current_stage ?? ''), reason ?? null);
    }
    return rows.rows as Row[];
  }

  async resumeSession(sid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE production_sessions
      SET status = 'running',
          stage_started_at = CASE WHEN current_stage IS NOT NULL AND current_stage <> 'done' THEN NOW() ELSE stage_started_at END,
          updated_at = NOW()
      WHERE id = ${sid} AND status = 'paused' AND deleted_at IS NULL
      RETURNING *
    `);
    const row = rows.rows[0] as Row | undefined;
    if (row) {
      await this.logStageTransition(sid, 'RESUME', String(row.current_stage ?? ''), String(row.current_stage ?? ''), null);
    }
    return rows.rows as Row[];
  }

  /**
   * 3.6 MES stage-tracking — appends a stage-transition row to the canonical
   * `audit_logs` table (same mechanism as HR's create-employee/save-employee
   * audit envelopes — no new table, Q-35). Records session id, action
   * (START/PAUSE/RESUME/STOP/ADVANCE_STAGE), from/to stage, and an optional
   * reason, so a session's setup→main→teardown history is queryable:
   *   SELECT * FROM audit_logs WHERE table_name = 'production_sessions'
   *     AND record_id = '<sessionId>' ORDER BY created_at;
   */
  private async logStageTransition(
    sessionId: number,
    action: string,
    fromStage: string,
    toStage: string,
    reason: string | null,
  ): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, reason, created_at)
        VALUES (
          gen_random_uuid()::text,
          'production_sessions',
          ${String(sessionId)},
          ${action},
          ${JSON.stringify({ stage: fromStage || null })}::jsonb,
          ${JSON.stringify({ stage: toStage || null })}::jsonb,
          ${reason},
          NOW()
        )
      `);
    } catch {
      // Best-effort: a logging failure must not fail the operator's pause/resume action.
    }
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

  async recordMaterialConsumption(session_id: number, material_id: number, quantity: number, batch_number: string | null, unit_of_measure: string | null = null): Promise<Row[]> {
    // To'lqin 3: unit_of_measure ustuni endi INSERT'ga kiritiladi (avval e'tiborsiz → doim NULL edi).
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_material_consumption (session_id, material_id, quantity, batch_number, unit_of_measure, recorded_at)
      VALUES (${session_id}, ${material_id}, ${quantity ?? 0}, ${batch_number ?? null}, ${unit_of_measure ?? null}, NOW()) RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getProductionOrders(status: string | undefined, lim: number, off: number): Promise<Row[]> {
    // mes_papka_orders has NO operator_id column (information_schema verified 2026-06-22).
    // The order's responsible person is exposed as assigned_to → join employees on that.
    const rows = await runQuery<Row>(sql`
      SELECT po.*, so.order_number AS sales_order_number,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS operator_name
      FROM mes_papka_orders po
      LEFT JOIN sales_orders so ON so.id = po.sales_order_id
      LEFT JOIN employees e ON e.id = po.assigned_to
      WHERE (${status ?? null}::text IS NULL OR po.status = ${status ?? null})
      ORDER BY po.created_at DESC LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  async getProductionOrderById(id: number): Promise<Row | null> {
    // mes_papka_orders has NO operator_id column; assigned_to is the responsible person.
    const rows = await runQuery<Row>(sql`
      SELECT po.*, so.order_number AS sales_order_number,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS operator_name
      FROM mes_papka_orders po
      LEFT JOIN sales_orders so ON so.id = po.sales_order_id
      LEFT JOIN employees e ON e.id = po.assigned_to
      WHERE po.id = ${id} LIMIT 1
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }

  async getShifts(from: string | undefined, to: string | undefined, lim: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT sh.*,
             COALESCE(e_out.first_name,'') || ' ' || COALESCE(e_out.last_name,'') AS outgoing_supervisor_name,
             COALESCE(e_in.first_name,'') || ' ' || COALESCE(e_in.last_name,'') AS incoming_supervisor_name
      FROM mes_shift_handovers sh
      LEFT JOIN employees e_out ON e_out.id = sh.outgoing_supervisor
      LEFT JOIN employees e_in  ON e_in.id  = sh.received_by
      WHERE (${from ?? null}::date IS NULL OR sh.handover_time::date >= ${from ?? null}::date)
        AND (${to ?? null}::date IS NULL OR sh.handover_time::date <= ${to ?? null}::date)
      ORDER BY sh.handover_time DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  async getMaintenanceRequests(status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT mr.*,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS assigned_to_name,
             wc.name AS work_center_name
      FROM mes_maintenance_requests mr
      LEFT JOIN employees e  ON e.id  = mr.assigned_to
      LEFT JOIN equipment wc ON wc.id = mr.equipment_id
      WHERE (${status ?? null}::text IS NULL OR mr.status = ${status ?? null})
      ORDER BY mr.created_at DESC LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  /** Real equipment norms from work_centers (capacity_per_hour, efficiency_rate, hours_per_day, cost_per_hour). */
  async getWorkCenterNorms(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT
        wc.id,
        wc.name,
        wc.code,
        wc.type,
        wc.capacity_per_hour,
        wc.efficiency_rate,
        wc.hours_per_day,
        wc.cost_per_hour,
        wc.capacity,
        COUNT(eq.id)::int AS equipment_count
      FROM work_centers wc
      LEFT JOIN equipment eq ON eq.work_center_id = wc.id AND eq.is_active = true AND eq.deleted_at IS NULL
      WHERE wc.is_active = true AND wc.deleted_at IS NULL
      GROUP BY wc.id, wc.name, wc.code, wc.type, wc.capacity_per_hour, wc.efficiency_rate, wc.hours_per_day, wc.cost_per_hour, wc.capacity
      ORDER BY wc.id
    `);
    return rows.rows as Row[];
  }
}
