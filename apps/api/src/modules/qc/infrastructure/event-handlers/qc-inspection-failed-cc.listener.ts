/**
 * @module qc-inspection-failed-cc.listener
 * @description Owner decision 2026-07-13 (chat): QC inspection failures should also reach
 *   Communication Center (CC) for director-level review/record — previously the only
 *   CcSpawnRequestedEvent emitter in the whole codebase was POS/procurement
 *   (procurement-request.service.ts). This listener subscribes to the SAME `QcFailedEvent`
 *   CQRS event already published by `SubmitInspectionHandler` (submit-inspection.handler.ts,
 *   the same event `QcPassedCertificateListener` subscribes to — for QcPassedEvent — for the
 *   certificate golden-thread step) and spawns a CC document (template
 *   QC_INSPECTION_FAILED) addressed from the inspector who recorded the failure.
 *
 *   Q-40 (no fabrication): senderUserId is resolved from the real `qc_inspections.inspector_id`
 *   column (the same column CreateInspectionHandler writes from the authenticated user who
 *   opened the inspection) — when the row has no inspector_id (legacy/manual row), the CC
 *   spawn is skipped rather than guessing an actor.
 *
 *   NOT gated on `qc_inspections.reference_type = 'final'` (the constant
 *   `QC_FINAL_INSPECTION_REFERENCE_TYPE` in business.constants.ts, which is what the owner's
 *   "failed FINAL inspection" framing maps to, and what submit-inspection.handler.ts's own
 *   checkFinalSignoffRazryadGate already checks for the SAME event's inspection row) —
 *   verified live that NOTHING currently writes that value onto `qc_inspections`:
 *   CreateInspectionHandler only ever writes 'batch'/'order' into reference_type, and the
 *   separate "final QC" flow (`qc_final_inspections` table +
 *   qc-extended-final.repository.ts) writes to a DIFFERENT table entirely and never publishes
 *   QcFailedEvent at all. Gating on that flag would make this listener permanently
 *   unreachable, so it fires on every QcFailedEvent instead — the same "react to every
 *   occurrence" precedent QcPassedCertificateListener already sets for the sibling
 *   QcPassedEvent.
 *
 *   Failures are caught + logged, never thrown back to the event bus (mirrors
 *   QcPassedCertificateListener's resilience contract) — a CC hiccup must not abort sibling
 *   listeners (WMS quarantine, SD QC_HOLD, notifications) on the same event.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { QcFailedEvent } from '../../domain/events';
import { CcSpawnRequestedEvent } from '../../../communication-center/domain/events/cc-spawn-requested.event';

interface InspectionRow {
  inspector_id: number | null;
}

interface OrderRow {
  order_number: string | null;
}

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcInspectionFailedCcListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcInspectionFailedCcListener.name);

  constructor(private readonly eventBus: EventBus) {}

  async handle(event: QcFailedEvent): Promise<void> {
    try {
      await this._spawnCcDocument(event);
    } catch (error: unknown) {
      this.logger.error(
        { inspectionId: event.inspectionId, orderId: event.orderId, error: (error as Error)?.message ?? String(error) },
        'QcInspectionFailedCcListener: CC spawn failed (non-fatal)',
      );
    }
  }

  private async _spawnCcDocument(event: QcFailedEvent): Promise<void> {
    const inspectionIdNum = Number(event.inspectionId);
    if (!Number.isFinite(inspectionIdNum)) {
      this.logger.warn({ inspectionId: event.inspectionId }, 'QcInspectionFailedCcListener: non-numeric inspectionId, skipping');
      return;
    }

    const inspectionRows = await runQuery<InspectionRow>(sql`
      SELECT inspector_id FROM qc_inspections WHERE id = ${inspectionIdNum}
    `);
    const inspectorId = inspectionRows.rows[0]?.inspector_id ?? null;
    if (inspectorId == null) {
      this.logger.log(
        { inspectionId: event.inspectionId },
        'QcInspectionFailedCcListener: inspection has no inspector_id (Q-40: no fabrication) — CC spawn skipped',
      );
      return;
    }

    // orderId = production_orders.id (same join shape sd/infrastructure/event-handlers/
    // qc-failed-sd.listener.ts already uses for the same event).
    const orderRows = await runQuery<OrderRow>(sql`
      SELECT so.order_number
      FROM production_orders po
      LEFT JOIN sales_orders so ON so.id = po.sales_order_id
      WHERE po.id = ${event.orderId}
    `);
    const orderNumber = orderRows.rows[0]?.order_number ?? null;

    this.eventBus.publish(new CcSpawnRequestedEvent({
      templateCode: 'QC_INSPECTION_FAILED',
      senderUserId: inspectorId,
      subject: `QC tekshiruvi rad etildi — tekshiruv #${event.inspectionId}${orderNumber ? ` (buyurtma ${orderNumber})` : ''}`,
      body: event.reason?.trim() || "Sabab ko'rsatilmagan.",
      priority: 'high',
      metadata: { inspectionId: event.inspectionId, orderId: event.orderId, orderNumber },
    }));

    this.logger.log(
      { inspectionId: event.inspectionId, orderId: event.orderId, inspectorId },
      'QcInspectionFailedCcListener: CC document spawned for director review',
    );
  }
}
