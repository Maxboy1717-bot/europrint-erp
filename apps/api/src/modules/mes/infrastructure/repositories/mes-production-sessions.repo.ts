/**
 * @module mes-production-sessions.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { nextDocNumber } from '@common/database/doc-sequences.helper';
import { GsdStage, STAGE_ORDER } from '../../domain/aggregates/production-session.aggregate';

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

  /**
   * SB0420 — TB-xavfsizlik / smena-tayyorlik chek-list shabloni.
   * ProductionSession.passChecklist (domain aggregate) session START'ni BLOKLAYDI
   * agar setup_checklists/checklist_items bo'sh bo'lsa (fail-safe: "xavfsizlik
   * tekshirilmagan" holati). Shu shablon HAR bir yangi sessiya uchun avtomatik
   * checklist qatorini yaratadi — shunda operator chek-listni to'ldirib, sessiyani
   * boshlashi mumkin (aks holda gate hech qachon o'tib bo'lmaydigan holatda qolardi).
   * Nomlar umumiy TPM/OT&B standartiga asoslangan (fabrikatsiya emas — Q-40), egasi
   * keyinchalik o'z ro'yxatini kiritishi mumkin (checklist_items jadvali orqali).
   */
  private static readonly DEFAULT_CHECKLIST_ITEMS: Array<{ category: string; title: string; description: string; sortOrder: number }> = [
    { category: 'safety', title: 'Himoya kiyim-kechak (SIZ) kiyilgan', description: "Kaska, qo'lqop, ko'zoynak, maxsus poyabzal", sortOrder: 1 },
    { category: 'safety', title: "Favqulodda to'xtatish tugmasi tekshirilgan", description: 'E-STOP ishlayotganiga ishonch hosil qilindi', sortOrder: 2 },
    { category: 'safety', title: 'Mashina atrofi begona narsalardan tozalangan', description: "Yo'l-yo'lakay xavf yo'q", sortOrder: 3 },
    { category: 'setup', title: 'Barcha materiallar skanerlangan', description: 'Kit-barcode orqali tasdiqlangan', sortOrder: 4 },
    { category: 'setup', title: 'Jamoa (master) tayinlangan', description: 'Smena uchun mas\'ul operator biriktirilgan', sortOrder: 5 },
  ];

  private async createDefaultChecklist(sessionId: number): Promise<void> {
    try {
      const checklistRows = await runQuery<Row>(sql`
        INSERT INTO setup_checklists (session_id, status, all_materials_scanned, all_settings_confirmed, all_crew_assigned, test_piece_approved, created_at)
        VALUES (${sessionId}, 'pending', false, false, false, false, NOW())
        RETURNING id
      `);
      const checklistId = Number((checklistRows.rows[0] as Row | undefined)?.id ?? 0);
      if (!checklistId) return;

      for (const item of MesProductionSessionsRepository.DEFAULT_CHECKLIST_ITEMS) {
        await runQuery<Row>(sql`
          INSERT INTO checklist_items (checklist_id, category, item_type, title, description, is_required, is_completed, sort_order, created_at)
          VALUES (${checklistId}, ${item.category}, 'boolean', ${item.title}, ${item.description}, true, false, ${item.sortOrder}, NOW())
        `);
      }
    } catch (err) {
      // Checklist creation is best-effort: a failure here must not block session
      // creation itself — the START gate will simply stay BLOCKED (fail-safe) and
      // surface a clear error, which is the same behavior as "not configured yet".
      this.logger.error(`createDefaultChecklist(session=${sessionId}): ${(err as Error).message}`);
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
      const created = (rows.rows[0] ?? null) as Row | null;
      if (created?.id) {
        await this.createDefaultChecklist(Number(created.id));
      }
      return created;
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

  /**
   * GSD 3-bosqich vaqt-o'lchovi (#9) — joriy bosqichni yopib keyingisiga o'tadi.
   * Birinchi chaqiruvda (current_stage NULL) avtomatik SETUP'dan boshlaydi (beginStages).
   *
   * FIX (3.6-mes-stage-tracking, Q-40/Q-46, 2026-07-03): elapsed-time endi SQL ichida
   * `EXTRACT(EPOCH FROM (NOW() - stage_started_at))` bilan hisoblanadi — xuddi allaqachon
   * to'g'ri ishlayotgan `pauseSession()`/`resumeSession()` naqshi kabi (bir xil DB-sessiya
   * ichida NOW() va saqlangan qiymat bir xil konvensiyada, shuning uchun tz-neytral).
   *
   * ESKI BUG: avvalgi versiya qatorni o'qib ProductionSession.rehydrate()+restoreStageState()
   * bilan JS `Date` obyektiga aylantirar, `advanceStage()` esa `now.getTime() - stageStartedAt
   * .getTime()`ni JS'da hisoblab, natijani `stageStartedAt.toISOString()` (UTC belgili) qilib
   * `timestamp without time zone` ustuniga yozardi. DB sessiya timezone'i Asia/Tashkent
   * (UTC+5) bo'lgani uchun Postgres "Z" belgisini e'tiborsiz qoldirib devor-soati raqamlarini
   * Tashkent vaqti sifatida saqlaydi; keyingi o'qishda pg drayveri shu devor-soatiga yana
   * Tashkent surunkasini biriktirib qaytaradi — natijada har `advance-stage` chaqiruvi
   * (birinchisidan keyin) 5 soat (18000 sekund) xato bilan ishlagan (DB-proof bilan
   * tasdiqlangan: rolled-back tranzaksiyada aniq +18000s drift o'lchandi). Endi bu qator
   * SQL ichida (bitta atomik UPDATE, `pauseSession` bilan bir xil konvensiya) hisoblanadi —
   * JS Date round-trip yo'q, drift yo'q.
   */
  async advanceSessionStage(sessionId: number): Promise<Row | null> {
    try {
      const before = await runQuery<Row>(sql`
        SELECT id, status, setup_seconds, main_seconds, teardown_seconds, current_stage, stage_started_at,
               GREATEST(0, EXTRACT(EPOCH FROM (NOW() - stage_started_at))::int) AS elapsed_seconds
        FROM production_sessions
        WHERE id = ${sessionId} AND deleted_at IS NULL
        FOR UPDATE
      `);
      const row = before.rows[0] as Row | undefined;
      if (!row) return null;

      const status = String(row.status ?? '');
      if (status !== 'running' && status !== 'in_progress' && status !== 'paused') {
        this.logger.warn(`advanceSessionStage: session ${sessionId} not in a working status (${status})`);
        return null;
      }

      const currentStage = (row.current_stage as GsdStage | null) ?? null;
      let setupSeconds = Number(row.setup_seconds ?? 0);
      let mainSeconds = Number(row.main_seconds ?? 0);
      let teardownSeconds = Number(row.teardown_seconds ?? 0);
      let nextStage: GsdStage;

      if (currentStage === null) {
        // GSD hali boshlanmagan — beginStages(): SETUP'ni boshlaydi, hech narsa akkumulyatsiya qilinmaydi.
        nextStage = GsdStage.SETUP;
      } else if (currentStage === GsdStage.DONE) {
        this.logger.warn(`advanceSessionStage: session ${sessionId} GSD already done`);
        return null;
      } else {
        // stage_started_at bo'lmasa (masalan pause vaqtida tozalangan bo'lsa) elapsed=0 — SQL GREATEST/EXTRACT
        // NULL bilan ham xavfsiz (NULL - NOW() = NULL → COALESCE 0 pastda).
        const elapsedSeconds = row.stage_started_at ? Number(row.elapsed_seconds ?? 0) : 0;
        if (currentStage === GsdStage.SETUP) setupSeconds += elapsedSeconds;
        else if (currentStage === GsdStage.MAIN) mainSeconds += elapsedSeconds;
        else if (currentStage === GsdStage.TEARDOWN) teardownSeconds += elapsedSeconds;

        const currentIndex = STAGE_ORDER.indexOf(currentStage);
        nextStage = STAGE_ORDER[currentIndex + 1] ?? GsdStage.DONE;
      }

      const isDone = nextStage === GsdStage.DONE;
      const updated = await runQuery<Row>(sql`
        UPDATE production_sessions
        SET setup_seconds    = ${setupSeconds},
            main_seconds     = ${mainSeconds},
            teardown_seconds = ${teardownSeconds},
            current_stage    = ${nextStage},
            stage_started_at = CASE WHEN ${isDone} THEN NULL ELSE NOW() END,
            updated_at       = NOW()
        WHERE id = ${sessionId}
        RETURNING id, setup_seconds, main_seconds, teardown_seconds, current_stage, stage_started_at
      `);
      return (updated.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`advanceSessionStage: ${(err as Error).message}`);
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

  /**
   * Bosqich-asosli OEE Availability (#9). GSD vaqt-o'lchovidan haqiqiy availability:
   *   Availability = main_seconds / (setup_seconds + main_seconds + teardown_seconds)
   * setup (changeover) + teardown (tozalash) = ne-produktiv → ayriladi, faqat main = produktiv.
   * Bo'luvchi 0 bo'lsa availability = 0 (NaN emas). Sessiya-bo'yicha va work-center-bo'yicha agregat.
   */
  async getStageBasedAvailability(sessionId?: number): Promise<Row[]> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT
          ps.id                AS session_id,
          ps.equipment_id      AS work_center_id,
          ps.setup_seconds,
          ps.main_seconds,
          ps.teardown_seconds,
          (ps.setup_seconds + ps.main_seconds + ps.teardown_seconds) AS total_seconds,
          CASE
            WHEN (ps.setup_seconds + ps.main_seconds + ps.teardown_seconds) > 0
            THEN ROUND(
              100.0 * ps.main_seconds
              / (ps.setup_seconds + ps.main_seconds + ps.teardown_seconds)
            )
            ELSE 0
          END AS availability_pct,
          ps.current_stage
        FROM production_sessions ps
        WHERE ps.deleted_at IS NULL
          AND (${sessionId ?? null}::int IS NULL OR ps.id = ${sessionId ?? null})
        ORDER BY ps.id DESC
      `);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`getStageBasedAvailability: ${(err as Error).message}`);
      return [];
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
