/**
 * @module qc-passed.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QcPassedEvent } from '../../../qc/domain/events';
import { IWmsRepository } from '../../domain/repositories/wms.repository';
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

  constructor(@Inject('IWmsRepository') private readonly wmsRepo: IWmsRepository) {}

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

    const result = await this.wmsRepo.receiveFg(
      lookup.material_id,
      lookup.warehouse_id,
      lookup.quantity,
    );

    if (!result.ok) {
      this.logger.error(result.error, 'Failed to receive FG after QC passed');
    } else {
      this.logger.log(
        { orderId: event.orderId, materialId: lookup.material_id, qty: lookup.quantity },
        'FG receipt created successfully',
      );
    }
  }
}
