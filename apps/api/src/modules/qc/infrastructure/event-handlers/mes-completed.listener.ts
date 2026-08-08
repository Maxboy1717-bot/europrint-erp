/**
 * @module mes-completed.listener
 * @description CQRS @EventsHandler for MesCompletedEvent (Trigger 10): opens a PENDING QC inspection
 *   for the completed MES session. Was a NO-OP (it injected qcRepository but only logged + a "QC will be
 *   opened by PP callback" comment — nothing happened). Now it inserts a real qc_inspection.
 *
 *   NOTE: a direct insert (not qcRepository.save) is used on purpose — the aggregate save writes the
 *   aggregate's STRING id into qc_inspections.id, which is an INTEGER sequence (drift) and would fail.
 *   Here the sequence assigns the id; order_id + reference_type='production_order' link the inspection to
 *   the real production order (event.ppId) so the QC work-list queries pick it up.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedListener implements IEventHandler<MesCompletedEvent>, OnModuleInit {
  private readonly logger = new Logger(MesCompletedListener.name);

  /**
   * GOLDEN-THREAD BACKFILL (A57, 2026-06-26): the live `handle()` path only opens a QC inspection
   * for sessions completed THROUGH the CompleteSessionCommand → MesCompletedEvent flow. Sessions
   * that reached a finished DB-status WITHOUT going through that command (seed/legacy/direct status
   * writes — e.g. production_sessions 35/36/37 → orders 48/49/50, all status='completed') therefore
   * never fired the listener and have NO pending QC inspection. That is exactly the observed
   * disconnect (qc_inspections production-order rows ≪ completed sessions): the golden thread was
   * broken for every pre-existing completed session, leaving them invisible to the QC work-list.
   *
   * This boot-time sweep opens a PENDING `production_order` inspection for EVERY completed/sent_to_qc
   * session that lacks one, reusing the SAME idempotent NOT-EXISTS guard as `handle()`. It is safe to
   * run on every boot: a second run inserts 0 rows (proven via rollback-tx DB-proof — 1st run opens
   * the missing inspections, 2nd run is a no-op). It does NOT touch sessions still running/paused/in
   * progress, and does NOT alter any existing inspection (different status rows are left intact).
   */
  async onModuleInit(): Promise<void> {
    try {
      // A56 (2026-06-26) QC card-linkage: stamp the PRODUCTION CARD on each backfilled inspection
      // (production_orders.work_center_id -> pp_work_centers.org_department_id -> org_departments).
      // inspector_card_id stays NULL (no inspector assigned yet). NO fabrication: NULL when the
      // work-center is not yet tied to an org card (owner data).
      const result = await db.execute(sql`
        INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, production_card_id, created_at, updated_at)
        SELECT DISTINCT ps.production_order_id, 'production_order', 'pending', 0, 0, 0,
          (SELECT wc.org_department_id
             FROM production_orders po
             JOIN pp_work_centers wc ON wc.id = po.work_center_id
            WHERE po.id = ps.production_order_id
            LIMIT 1),
          NOW(), NOW()
        FROM production_sessions ps
        WHERE ps.status IN ('completed', 'sent_to_qc')
          AND ps.production_order_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM qc_inspections qi
            WHERE qi.order_id = ps.production_order_id
              AND qi.reference_type = 'production_order'
              AND qi.status = 'pending'
          )`);
      const inserted = (result as { rowCount?: number } | undefined)?.rowCount ?? 0;
      this.logger.log(
        { inserted },
        inserted > 0
          ? `MES→QC backfill: opened ${inserted} PENDING QC inspection(s) for already-completed sessions (golden thread reconnected)`
          : 'MES→QC backfill: every completed session already has a PENDING QC inspection (no-op)',
      );
    } catch (error: unknown) {
      // Q-40: surface the failure — a broken backfill silently leaves completed sessions out of QC.
      this.logger.error(
        { err: error instanceof Error ? error.message : String(error) },
        'MES→QC backfill FAILED — some completed sessions may have no QC inspection',
      );
    }
  }

  async handle(event: MesCompletedEvent): Promise<void> {
    try {
      // GOLDEN-THREAD FIX (2026-06-19): link the inspection to the PRODUCTION ORDER (event.ppId), and
      // use reference_type='production_order' so the QC work-list queries actually pick it up
      // (drizzle-qc.repo.ts: `reference_type IN ('print_job','production_order')`). Previously this wrote
      // order_id=sessionId + reference_type='mes_session', so MES-originated inspections were created but
      // were INVISIBLE to every QC query — the chain broke silently here. inspector_id stays NULL
      // (assigned later by a QC operator).
      //
      // IDEMPOTENCY FIX (A17, 2026-06-26): the previous unconditional INSERT created a NEW pending
      // inspection on every fire. MesCompletedEvent can fire more than once for the same production
      // order — eventBus.publish + EventBridge re-emit to legacy @OnEvent listeners, a session
      // re-completed, or an at-least-once delivery retry — each producing a DUPLICATE pending QC row
      // for the same order. Guard the INSERT with NOT EXISTS so a second fire is a no-op while the
      // first still reliably opens the inspection. Proven idempotent via rollback-tx DB-proof
      // (1st fire → 1 row, 2nd fire → 0 rows).
      // A56 (2026-06-26) QC card-linkage: stamp the PRODUCTION CARD on the auto-opened inspection
      // (production_orders.work_center_id -> pp_work_centers.org_department_id -> org_departments).
      // inspector_card_id stays NULL — a QC operator is assigned later (create/submit resolves their
      // card then). NO fabrication: NULL when the work-center is not yet tied to an org card.
      const result = await db.execute(sql`
        INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, production_card_id, created_at, updated_at)
        SELECT ${event.ppId}, 'production_order', 'pending', 0, 0, 0,
          (SELECT wc.org_department_id
             FROM production_orders po
             JOIN pp_work_centers wc ON wc.id = po.work_center_id
            WHERE po.id = ${event.ppId}
            LIMIT 1),
          NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM qc_inspections
          WHERE order_id = ${event.ppId}
            AND reference_type = 'production_order'
            AND status = 'pending'
        )`);
      const inserted = (result as { rowCount?: number } | undefined)?.rowCount ?? 0;
      this.logger.log(
        { sessionId: event.sessionId, ppId: event.ppId, timestamp: event.timestamp, inserted },
        inserted > 0
          ? 'MES completed - Trigger 10: PENDING QC inspection opened (linked to production order)'
          : 'MES completed - Trigger 10: PENDING QC inspection already open for this order (idempotent skip)',
      );
    } catch (error: unknown) {
      // Q-40: never swallow silently — a failed insert breaks the golden thread invisibly.
      this.logger.error(
        { sessionId: event.sessionId, ppId: event.ppId, err: error instanceof Error ? error.message : String(error) },
        'MES completed listener FAILED to open QC inspection — golden thread broken for this session',
      );
    }
  }
}
