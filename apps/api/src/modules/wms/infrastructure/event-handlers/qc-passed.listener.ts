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

interface FgLookupRow {
  material_id: number;
  warehouse_id: number;
  quantity: number;
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

    // Resolve the finished-goods material, default warehouse, and quantity from the sales order
    const lookupRows = await runQuery<FgLookupRow>(sql`
      SELECT
        COALESCE(so.product_id, 0)                     AS material_id,
        COALESCE(w.id, 1)                              AS warehouse_id,
        COALESCE(so.quantity, so.total_quantity, 1)    AS quantity
      FROM sales_orders so
      LEFT JOIN warehouses w ON w.type = 'finished_goods' OR w.name ILIKE '%finished%'
      WHERE so.id = ${event.orderId}
      LIMIT 1
    `);

    const lookup = lookupRows.rows[0];
    if (!lookup || !lookup.material_id) {
      this.logger.warn(
        { orderId: event.orderId },
        'QcPassedListener: could not resolve material for order, skipping FG receipt',
      );
      return;
    }

    // Dispatch via ReceiveFgHandler so orderId flows into WmsFgReceivedEvent
    // and the rental timer (Trigger 12) can fire. A direct wmsRepo.receiveFg()
    // call cannot carry orderId — command dispatch is the canonical path that
    // both performs the warehouse_stock UPSERT and publishes the order-attributed
    // WmsFgReceivedEvent.
    const result = await this.commandBus.execute<ReceiveFgCommand, Result<void>>(
      new ReceiveFgCommand(
        lookup.material_id,
        lookup.warehouse_id,
        lookup.quantity,
        `QC-${event.inspectionId}`, // batchNumber — traceable to the inspection
        null, // expiryDate — FG has no expiry by default
        event.orderId, // orderId — attributes the FG + enables Trigger 12 rental timer
      ),
    );

    if (!result.ok) {
      this.logger.error(
        { orderId: event.orderId, error: String(result.error) },
        'Failed to receive FG after QC passed',
      );
    } else {
      this.logger.log(
        { orderId: event.orderId, materialId: lookup.material_id, qty: lookup.quantity },
        'Trigger 11 -> 12: FG receipt UPSERTed to warehouse_stock, rental timer will start',
      );
    }
  }
}
