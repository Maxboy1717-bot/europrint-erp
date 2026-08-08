/**
 * @module org-structure/ckp-mes-feed.listener
 * @description A67 (To'lqin 4 — ЦКП): MES/IoT → ЦКП feed. When an MES production
 *   session is COMPLETED, auto-record a daily ЦКП fact for the responsible card
 *   via the canonical {@link CkpFactService.recordFact} path (NOT a parallel write
 *   — the service computes achievement% vs the card norm + the deadline-gate flag).
 *
 * GOLDEN-THREAD (oltin-ip): the MES golden hop already fires
 *   `MesCompletedEvent` (mes/complete-session.handler.ts → eventBus.publish). The
 *   shared EventBridge (event-bridge.service.ts) re-emits that CQRS event onto the
 *   EventEmitter2 namespace `ERP_EVENTS.MES_COMPLETED` ('mes.session.completed'),
 *   so this `@OnEvent` listener receives the SAME `MesCompletedEvent` instance
 *   ({sessionId, ppId, timestamp}). This is the identical wiring the existing
 *   org-structure OrgCascadeListener uses (@OnEvent + global EventEmitterModule),
 *   so no module-level CqrsModule import is needed.
 *
 * CARD RESOLUTION (Q-40 — FABRIKATSIYA TAQIQ): the ЦКП card (org_departments.id)
 *   is resolved from REAL links only, in priority order:
 *     0. session DIRECT card → production_sessions.operator_card_id (operator=KARTA,
 *        set by MES at session time — the canonical vision link, T7-05);
 *     1. session operator/worker → users.card_id (primary card), else
 *        employee_cards (is_primary, is_active) → card_id;
 *     2. production order → pp_work_centers.org_department_id (work-center card).
 *   If NONE resolve (owner has not yet linked the session/work-center/operator to a
 *   card), the fact is SKIPPED + logged — NO fabricated card, NO soxta fact.
 *
 * FACT VALUE: actualValue = GOOD units = actual_quantity − defect_quantity
 *   (the ЦКП "valuable final product" is the good output, not the gross run).
 *   The card norm (org_departments.tskp_target) drives achievement% inside the
 *   service; norm NULL → achievement 0 (FABRIKATSIYA YO'Q, already handled there).
 *   factDate = session_date (the production day), so the daily ЦКП-gate (A11)
 *   evaluates the right day. employeeId = resolved operator/worker (audit trail);
 *   recordedBy NULL (system feed, no human submitter).
 *
 * IDEMPOTENT: recordFact upserts on (card_id, fact_date, employee, product) via
 *   uq_ckp_fact_card_day, so a re-fired event (EventBridge re-emit, retry, session
 *   re-complete) updates the same daily fact instead of duplicating it.
 *
 * NEVER THROWS: a feed failure is logged and swallowed — it must not roll back the
 *   already-committed MES completion or break the golden thread for QC/HR.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { MesCompletedEvent } from '@modules/mes/domain/events/mes-completed.event';
import { CkpFactService } from './ckp-fact.service';

type Row = Record<string, unknown>;

/** Resolved feed inputs for one completed session (null fields = not available). */
interface SessionFeed {
  sessionId: number;
  cardId: number | null;
  employeeId: number | null;
  factDate: string | null;
  /** Good units = actual − defect (never negative). */
  goodQty: number;
  resolvedVia: 'session_card' | 'operator_card' | 'worker_card' | 'work_center_card' | null;
}

@Injectable()
export class CkpMesFeedListener {
  private readonly logger = new Logger(CkpMesFeedListener.name);

  constructor(private readonly ckpFactService: CkpFactService) {}

  /**
   * EventEmitter2 entrypoint. Receives the bridged `MesCompletedEvent`. Wraps the
   * pure handler so any feed error is logged but never propagates (the MES session
   * is already committed; the golden thread must not break here).
   */
  @OnEvent(ERP_EVENTS.MES_COMPLETED)
  async onMesCompleted(event: MesCompletedEvent): Promise<void> {
    try {
      await this.handle(event);
    } catch (error: unknown) {
      this.logger.error(
        { sessionId: (event as { sessionId?: unknown })?.sessionId, err: error instanceof Error ? error.message : String(error) },
        'CKP MES-feed FAILED — daily ЦКП fact not recorded for this completed session',
      );
    }
  }

  /**
   * Resolve the card + inputs for the completed session, then record the daily
   * ЦКП fact through the canonical service. No-op (logged) when no card resolves.
   */
  async handle(event: MesCompletedEvent): Promise<void> {
    const sessionId = Number(event?.sessionId);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      this.logger.warn({ event }, 'CKP MES-feed: invalid sessionId — skipped');
      return;
    }

    const feed = await this.resolveSessionFeed(sessionId);

    if (feed.cardId == null) {
      // Q-40: no real operator/work-center → card link yet (owner data). Do NOT
      // fabricate a card — skip and surface it so the gap is visible in logs.
      this.logger.log(
        { sessionId, ppId: event.ppId },
        'CKP MES-feed: session has no resolvable ЦКП card (operator/work-center not linked) — skipped (owner data)',
      );
      return;
    }

    if (!feed.factDate) {
      this.logger.warn(
        { sessionId, cardId: feed.cardId },
        'CKP MES-feed: completed session has no session_date — cannot place the daily fact, skipped',
      );
      return;
    }

    const result = await this.ckpFactService.recordFact({
      cardId: feed.cardId,
      employeeId: feed.employeeId,
      productId: null,
      factDate: feed.factDate,
      actualValue: feed.goodQty,
      source: 'MES',
      notes: `MES session #${sessionId} avtomatik ЦКП fakt (yaroqli=${feed.goodQty})`,
      recordedBy: null,
    });

    if (!result.ok) {
      this.logger.error(
        { sessionId, cardId: feed.cardId, err: result.error.message },
        'CKP MES-feed: recordFact failed',
      );
      return;
    }

    const fact = result.data;
    this.logger.log(
      {
        sessionId,
        cardId: feed.cardId,
        factDate: feed.factDate,
        goodQty: feed.goodQty,
        resolvedVia: feed.resolvedVia,
        achievementPct: fact.achievement_pct,
        deadlinePassed: fact.deadline_passed,
      },
      'CKP MES-feed: daily ЦКП fact recorded from completed MES session',
    );
  }

  /**
   * Single round-trip resolution of session → card + inputs (parametrized SQL,
   * Qoida B/4). Tries operator/worker primary card first (users.card_id, then
   * employee_cards), then the production order's work-center card. Returns nulls
   * where a real link is absent (no fabrication).
   */
  private async resolveSessionFeed(sessionId: number): Promise<SessionFeed> {
    const r = await runQuery<Row>(sql`
      WITH s AS (
        SELECT
          ps.id,
          ps.production_order_id,
          ps.operator_id,
          ps.worker_id,
          ps.operator_card_id,
          COALESCE(ps.session_date, ps.started_at::date, ps.ended_at::date) AS fact_date,
          GREATEST(
            COALESCE(ps.actual_quantity, ps.produced_qty::int, 0) - COALESCE(ps.defect_quantity, ps.defect_qty::int, 0),
            0
          ) AS good_qty
        FROM production_sessions ps
        WHERE ps.id = ${sessionId}
        LIMIT 1
      )
      SELECT
        s.id,
        s.fact_date,
        s.good_qty,
        -- direct session→KARTA link (operator=KARTA, set by MES at session time)
        s.operator_card_id      AS session_card,
        -- operator (users) primary card
        uo.card_id              AS operator_user_card,
        s.operator_id           AS operator_id,
        -- worker (users) primary card
        uw.card_id              AS worker_user_card,
        s.worker_id             AS worker_id,
        -- operator employee → primary active card
        eco.card_id             AS operator_emp_card,
        eco.employee_id         AS operator_emp_id,
        -- worker employee → primary active card
        ecw.card_id             AS worker_emp_card,
        ecw.employee_id         AS worker_emp_id,
        -- production order → work-center → org card
        wc.org_department_id    AS work_center_card
      FROM s
      LEFT JOIN users uo               ON uo.id = s.operator_id
      LEFT JOIN users uw               ON uw.id = s.worker_id
      LEFT JOIN employee_cards eco     ON eco.employee_id = s.operator_id AND eco.is_primary AND eco.is_active
      LEFT JOIN employee_cards ecw     ON ecw.employee_id = s.worker_id  AND ecw.is_primary AND ecw.is_active
      LEFT JOIN production_orders po   ON po.id = s.production_order_id
      LEFT JOIN pp_work_centers wc     ON wc.id = po.work_center_id
    `);

    const row = r.rows[0] as Row | undefined;
    if (!row) {
      return { sessionId, cardId: null, employeeId: null, factDate: null, goodQty: 0, resolvedVia: null };
    }

    const num = (v: unknown): number | null => {
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const factDate = this.toDateString(row.fact_date);
    const goodQty = num(row.good_qty) ?? 0;

    // Priority 0: the session's DIRECT card link (operator=KARTA). When MES records
    // the responsible card at session time (production_sessions.operator_card_id →
    // org_departments.id, T7-05), it is the canonical truth — used ahead of the
    // resolve-via-operator/work-center fallbacks. employeeId stays the operator/worker
    // (audit trail) when present.
    const sessionCard = num(row.session_card);
    if (sessionCard != null) {
      const empId = num(row.operator_id) ?? num(row.worker_id);
      return { sessionId, cardId: sessionCard, employeeId: empId, factDate, goodQty, resolvedVia: 'session_card' };
    }

    // Priority 1a: operator's user primary card.
    const operatorUserCard = num(row.operator_user_card);
    if (operatorUserCard != null) {
      return { sessionId, cardId: operatorUserCard, employeeId: num(row.operator_id), factDate, goodQty, resolvedVia: 'operator_card' };
    }
    // Priority 1b: operator's employee primary active card.
    const operatorEmpCard = num(row.operator_emp_card);
    if (operatorEmpCard != null) {
      return { sessionId, cardId: operatorEmpCard, employeeId: num(row.operator_emp_id), factDate, goodQty, resolvedVia: 'operator_card' };
    }
    // Priority 1c: worker's user primary card.
    const workerUserCard = num(row.worker_user_card);
    if (workerUserCard != null) {
      return { sessionId, cardId: workerUserCard, employeeId: num(row.worker_id), factDate, goodQty, resolvedVia: 'worker_card' };
    }
    // Priority 1d: worker's employee primary active card.
    const workerEmpCard = num(row.worker_emp_card);
    if (workerEmpCard != null) {
      return { sessionId, cardId: workerEmpCard, employeeId: num(row.worker_emp_id), factDate, goodQty, resolvedVia: 'worker_card' };
    }
    // Priority 2: production order's work-center card.
    const workCenterCard = num(row.work_center_card);
    if (workCenterCard != null) {
      return { sessionId, cardId: workCenterCard, employeeId: null, factDate, goodQty, resolvedVia: 'work_center_card' };
    }

    // No real link — return null card (skip, no fabrication).
    return { sessionId, cardId: null, employeeId: null, factDate, goodQty, resolvedVia: null };
  }

  /** Normalize a DB date/timestamp value to a 'YYYY-MM-DD' string (or null). */
  private toDateString(v: unknown): string | null {
    if (v == null) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
    const s = String(v);
    // Already a date or ISO timestamp — take the date part.
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : null;
  }
}
