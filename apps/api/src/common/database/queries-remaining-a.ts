/**
 * @module queries-remaining-a
 * @description Source module. See exports for details.
 */

import { db, runQuery } from '@shared/db';
import {
  ideal_rasm_targets, wms_alerts,
  sd_sales_orders, order_status_logs,
  pos_damage_qc_links, pos_barcode_print_queue,
  employee_issuance_log, three_way_match_results,
  mm_purchase_requisition_items, qc_inspections,
  materials_legacy, purchase_orders_legacy,
  pos_inventory_count_lines, inventory_barcode_assignments,
  pos_movements_legacy, lessons, certificates_table, courses_table,
  cameras, hr_interview_questions, hr_applications, gl_lines,
  gamification_totals, absence_tracking, hr_brand_settings,
  notificationsApp,
} from '@shared/db';
import { hrEmployees, hrPositions } from '@shared/db';
import { hr_daily_reports } from '@shared/db';
import { eq, and, sql, ilike, inArray } from 'drizzle-orm';

type Row = Record<string, unknown>;

/**
 * A84 (MOLIYA — GL↔stock single-writer): POS confirmed-movement stock-IN now lands on the
 * CANONICAL `warehouse_stock` (was the `current_stock` VIEW — a simple updatable view that
 * maps quantity_on_hand→warehouse_stock.quantity but does NOT carry available_quantity).
 * Writing through the view bumped `quantity` while leaving `available_quantity` stale, so the
 * two columns drifted apart (DB-proof: view-insert of a new pair left quantity=20/available=0,
 * making the material un-issuable to every WMS reader and the goods-issue guard
 * `available_quantity >= amount`). This breaks the warehouse_stock single-writer invariant the
 * WMS/GL chain relies on. We now upsert warehouse_stock directly, keeping quantity AND
 * available_quantity in lockstep — same idempotent ON CONFLICT (warehouse_id, material_id)
 * pattern as execReceiveFg (queries-wms.ts), so POS and WMS share one canonical writer shape.
 */
export async function execCurrentStockUpsert(matId: number, warehouseId: unknown, qty: number): Promise<void> {
  await runQuery(sql`
    INSERT INTO warehouse_stock
      (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
    VALUES
      (${warehouseId as number}, ${matId}, ${qty}, 0, ${qty}, NOW(), NOW(), NOW())
    ON CONFLICT (warehouse_id, material_id)
    DO UPDATE SET
      quantity           = warehouse_stock.quantity + ${qty},
      available_quantity = warehouse_stock.available_quantity + ${qty},
      last_movement_at   = NOW(),
      last_updated_at    = NOW()
  `);
}

/**
 * A84: POS confirmed-movement stock-OUT canonical decrement on `warehouse_stock` (was the
 * `current_stock` VIEW, which only shrank `quantity` and left `available_quantity` stale —
 * over-stating issuable stock). Decrements BOTH quantity and available_quantity in lockstep
 * so the canonical balance the WMS issue guard / GL valuation read stays correct.
 *
 * VISION-3340 #57: this used to write an UNCONDITIONAL UPDATE floored at 0 via
 * `GREATEST(0, quantity - qty)` — no pre-check, no guard. An overdraw (qty > available)
 * silently succeeded and just clamped the balance to 0, instead of failing the movement.
 * That is the same class of TOCTOU/no-guard bug already fixed on the WMS issue path
 * (`execIssueFromWarehouseStock`, queries-wms.ts) and the reservation/issue paths
 * (`execUpdateStockReserved`/`execUpdateStockIssued`, queries-wms.ts). This now mirrors
 * `execIssueFromWarehouseStock` exactly: a guarded conditional UPDATE (`available_quantity
 * >= qty`) with `RETURNING id`. Postgres row-level locking makes the guard atomic against
 * concurrent decrements on the same row. Returns `true` iff the guard passed and the row
 * was updated; `false` (0 rows affected, no write happened) means the caller must treat
 * this as insufficient stock rather than silently proceeding.
 */
export async function execCurrentStockDecrement(matId: number, warehouseId: unknown, qty: number): Promise<boolean> {
  const result = await runQuery(sql`
    UPDATE warehouse_stock
    SET quantity           = quantity - ${qty},
        available_quantity = available_quantity - ${qty},
        last_movement_at   = NOW(),
        last_updated_at    = NOW()
    WHERE material_id = ${matId} AND warehouse_id = ${warehouseId as number}
      AND available_quantity >= ${qty}
    RETURNING id
  `);
  return result.rows.length > 0;
}

export async function execIdealRasmTargetInsert(t: {
  targetName: string; targetKey: string; targetValue: unknown;
  unit: string; horizonYears: number; description: string;
}): Promise<void> {
  await db.insert(ideal_rasm_targets).values({
    targetName: t.targetName,
    targetKey: t.targetKey,
    targetValue: String(t.targetValue),
    unit: t.unit,
    horizonYears: t.horizonYears,
    description: t.description,
  }).onConflictDoNothing();
}

export async function execWmsAlertInsert(materialId: number, warehouseId: number, materialName: string): Promise<void> {
  await db.insert(wms_alerts).values({
    material_id: materialId,
    warehouse_id: warehouseId,
    type: 'low_stock',
    severity: 'high',
    message: `Low stock: ${materialName}`,
  });
}

export async function execSalesOrderStatusUpdate(orderId: string, newStatus: string): Promise<void> {
  await db.update(sd_sales_orders)
    .set({ status: newStatus, updated_at: sql`NOW()` })
    .where(eq(sql`${sd_sales_orders.id}::text`, orderId));
}

export async function execOrderStatusLogInsert(orderId: string, userId: number): Promise<void> {
  const [order] = await db.select({ id: sd_sales_orders.id, status: sd_sales_orders.status })
    .from(sd_sales_orders)
    .where(eq(sql`${sd_sales_orders.id}::text`, orderId))
    .limit(1);
  if (order) {
    await db.insert(order_status_logs).values({
      salesOrderId: String(order.id),
      fromStatus: order.status ?? null,
      toStatus: 'pending_technology',
      changedBy: String(userId),
      notes: 'Dizayn tasdiqlandi',
    });
  }
}

export async function execPosDamageQcLinkInsert(
  damageMovementId: number, originalMovementId: number,
  materialCardId: number, damagedQty: number, damageDescription: string,
): Promise<void> {
  void originalMovementId; void damageDescription;
  await db.insert(pos_damage_qc_links).values({
    posMovementId: damageMovementId,
    materialCardId: materialCardId,
    damagedQty: damagedQty,
  });
}

export async function execPosBarcodePrintQueueInsert(
  materialCardId: number, movementId: number, format: string,
  printerIp: string | null, sentToPrinter: boolean,
): Promise<void> {
  await db.insert(pos_barcode_print_queue).values({
    materialCardId: materialCardId,
    posMovementId: movementId,
    copies: 1,
    printFormat: format,
    printerIp: printerIp,
    triggerType: 'AUTO',
    status: sentToPrinter ? 'DONE' : 'PENDING',
  });
}

export async function execEmployeeIssuanceLogInsert(userId: number, materialCardId: number): Promise<void> {
  await db.insert(employee_issuance_log).values({
    userId: userId,
    materialCardId: materialCardId,
    warehouseId: 'default',
    quantityIssued: 1,
    issuedAt: new Date(),
  });
}

export async function execThreeWayMatchInsert(
  poId: number, grId: number, vendorInvoiceId: string,
  poAmount: number, grAmount: number, invoiceAmount: number,
  status: string, userId: number,
): Promise<void> {
  // Canonical three_way_match_results uses: invoice_id, status, match_details (jsonb), matched_at.
  // We pack po/gr/amount details into match_details for traceability.
  await db.insert(three_way_match_results).values({
    invoice_id: Number(vendorInvoiceId) || 0,
    status,
    match_details: {
      po_id: poId,
      gr_id: grId,
      vendor_invoice_id: vendorInvoiceId,
      po_amount: String(poAmount),
      gr_amount: String(grAmount),
      invoice_amount: String(invoiceAmount),
      performed_by: userId,
    },
    matched_at: new Date(),
  }).onConflictDoNothing();
}

export async function execMmPrItemInsert(
  requisitionId: unknown, materialId: unknown, quantity: unknown, unitPrice: unknown,
): Promise<void> {
  await db.insert(mm_purchase_requisition_items).values({
    requisition_id: requisitionId as number,
    material_id: materialId as number,
    quantity: String(quantity),
    unit_price: String(unitPrice ?? '0'),
  });
}

export async function execQcInspectionUpsert(inspection: {
  id: string; orderId: unknown; batchId: unknown; status: string;
  inspectorId: unknown; sampleSize: unknown; defectsFoundCount: unknown;
}): Promise<void> {
  const checked = Number(inspection.sampleSize) || 0;
  const failed = Number(inspection.defectsFoundCount) || 0;
  const passed = Math.max(0, checked - failed);
  const validStatus = ['pending', 'in_progress', 'on_hold', 'passed', 'failed'].includes(inspection.status)
    ? inspection.status as 'pending' | 'in_progress' | 'on_hold' | 'passed' | 'failed'
    : 'pending';
  // inspectorId is required (NOT NULL) — fallback to system UUID when caller omits it
  const inspectorId = String(inspection.inspectorId || '00000000-0000-0000-0000-000000000000');
  const referenceId = String(inspection.orderId ?? inspection.id);
  await db.insert(qc_inspections).values({
    id: inspection.id,
    reference_id: referenceId,
    reference_type: inspection.batchId ? 'batch' : 'order',
    inspector_id: inspectorId,
    status: validStatus,
    items_checked: checked,
    items_passed: passed,
    items_failed: failed,
  }).onConflictDoUpdate({
    target: qc_inspections.id,
    set: {
      status: validStatus,
      items_failed: failed,
      items_passed: passed,
      updated_at: sql`NOW()`,
    },
  });
}

export async function execMmMaterialInsert(
  materialCode: string, name: string, category: string,
  unitOfMeasure: string, unitCost: unknown,
): Promise<void> {
  await db.insert(materials_legacy).values({
    material_code: materialCode,
    name,
    category,
    unit_of_measure: unitOfMeasure,
    unit_cost: String(unitCost),
  }).onConflictDoUpdate({
    target: materials_legacy.material_code,
    set: { name },
  });
}
