/**
 * @module get-sales-order-queue-position.query
 * @description Modul-06 #47: query the ranked production queue for ONE sales order —
 *   surfaces its queue_position (rank) + estimated_start (scheduled_start) on the SD
 *   order card.
 */
export class GetSalesOrderQueuePositionQuery {
  constructor(public readonly salesOrderId: number) {}
}
