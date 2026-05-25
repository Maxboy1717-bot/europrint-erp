/**
 * @module schema-order-workflow
 * @description Re-exports canonical order-workflow table definitions from @workspace/db.
 * Local pgTable duplicates were removed — the source of truth is
 * lib/db/src/schema/order-workflow-schema.ts.
 */

export {
  owOrders,
  owOrderStatusHistory,
  owPaymentPlanEntries,
  owMolds,
  owCliches,
  owMaterialRequirements,
} from '@workspace/db';

export type {
  OwOrder,
  OwPaymentPlanEntry,
  OwMold,
  OwCliche,
  OwMaterialReq,
} from '@workspace/db';
