/**
 * @module i-sd-order-sync.repo
 * @description Repository port for SD order sync-scheduling (vision 06-sd#40 —
 *   Kashirovka offset+gofra). Successor order links to a predecessor via
 *   sales_orders.predecessor_order_id; can_start is the MES hard-constraint read
 *   model (successor may start only when the predecessor is ship-ready/terminal).
 */

import { Result } from '@common/result';

export interface OrderSyncStatusRow {
  order_id: number;
  order_number: string | null;
  status: string;
  predecessor_order_id: number | null;
  predecessor_order_number: string | null;
  predecessor_status: string | null;
  can_start: boolean;
}

export const SD_ORDER_SYNC_REPO = Symbol('SD_ORDER_SYNC_REPO');

export interface ISdOrderSyncRepo {
  getSyncStatus(orderId: number): Promise<Result<OrderSyncStatusRow>>;
  setPredecessor(orderId: number, predecessorOrderId: number | null): Promise<Result<OrderSyncStatusRow>>;
}
