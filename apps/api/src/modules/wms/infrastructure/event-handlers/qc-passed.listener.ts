/**
 * @module qc-passed.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { QcPassedEvent } from '../../../qc/domain/events';
import { ReceiveFgCommand } from '../../application/commands/receive-fg.handler';
import { Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/** Passed quantity + warehouse resolved from the QC inspection row itself. */
interface InspectionLookupRow {
  pass_count: number;
  warehouse_id: number;
}

/** One finished-goods line item of the sales order. */
interface FgLineRow {
  material_id: number;
}

@Injectable()
@EventsHandler(QcPassedEvent)
export class QcPassedListener implements IEventHandler<QcPassedEvent> {
  private readonly logger = new Logger(QcPassedListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: QcPassedEvent) {
    this.logger.log(
      { inspectionId: event.inspectionId, orderId: event.orderId },
      'Trigger 11: QC passed - Creating FG receipt',
    );

    // The passed quantity lives on the QC inspection row (qc_inspections.pass_count —
    // the canonical inspection table this listener's event id refers to; fall back to
    // items_passed which save() also writes). sales_orders has NO product_id/quantity
    // columns, so the FG material(s) must come from the line-item table instead.
    const inspectionRows = await runQuery<InspectionLookupRow>(sql`
      SELECT
        COALESCE(qi.pass_count, qi.items_passed, 0) AS pass_count,
        COALESCE(w.id, 1)                           AS warehouse_id
      FROM qc_inspections qi
      LEFT JOIN warehouses w ON w.type = 'finished_goods' OR w.name ILIKE '%finished%'
      WHERE qi.id = ${Number(event.inspectionId)}
      LIMIT 1
    `);

    const inspection = inspectionRows.rows[0];
    if (!inspection) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcPassedListener: inspection row not found, skipping FG receipt',
      );
      return;
    }
    const passQty = Number(inspection.pass_count) || 0;
    const warehouseId = Number(inspection.warehouse_id) || 1;

    // Finished-goods material(s) come from the real line-item table. product_id is the
    // FG material; it is nullable in live data, so fall back to material_id.
    const lineRows = await runQuery<FgLineRow>(sql`
      SELECT COALESCE(soi.product_id, soi.material_id) AS material_id
      FROM sales_order_items soi
      WHERE soi.sales_order_id = ${event.orderId}
        AND COALESCE(soi.product_id, soi.material_id) IS NOT NULL
    `);

    const lines = Array.isArray(lineRows.rows) ? lineRows.rows : [];
    if (lines.length === 0) {
      this.logger.warn(
        { orderId: event.orderId },
        'QcPassedListener: no sales_order_items lines for order, skipping FG receipt',
      );
      return;
    }

    // Dispatch via ReceiveFgHandler so orderId flows into WmsFgReceivedEvent
    // and the rental timer (Trigger 12) can fire. A direct wmsRepo.receiveFg()
    // call cannot carry orderId — command dispatch is the canonical path that
    // both performs the warehouse_stock UPSERT and publishes the order-attributed
    // WmsFgReceivedEvent. One receipt per finished-goods line item.
    for (const line of lines) {
      const materialId = Number(line.material_id) || 0;
      if (!materialId) continue;

      const result = await this.commandBus.execute<ReceiveFgCommand, Result<void>>(
        new ReceiveFgCommand(
          materialId,
          warehouseId,
          passQty, // received quantity = QC passed count
          `QC-${event.inspectionId}`, // batchNumber — traceable to the inspection
          null, // expiryDate — FG has no expiry by default
          event.orderId, // orderId — attributes the FG + enables Trigger 12 rental timer
        ),
      );

      if (!result.ok) {
        this.logger.error(
          { orderId: event.orderId, materialId, error: String(result.error) },
          'Failed to receive FG after QC passed',
        );
      } else {
        this.logger.log(
          { orderId: event.orderId, materialId, qty: passQty },
          'Trigger 11 -> 12: FG receipt UPSERTed to warehouse_stock, rental timer will start',
        );
      }
    }
  }
}
