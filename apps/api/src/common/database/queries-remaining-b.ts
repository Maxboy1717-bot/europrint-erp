/**
 * @module queries-remaining-b
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { castTo } from '@common/db-rows';
import {
  current_stock, ideal_rasm_targets, wms_alerts,
  sd_sales_orders, order_status_logs,
  pos_damage_qc_links, pos_barcode_print_queue,
  employee_issuance_log, three_way_match_results,
  mm_purchase_requisition_items, qc_inspections,
  materials_legacy, purchase_orders_legacy,
  pos_inventory_count_lines, pos_barcode_map,
  pos_movements_legacy, lessons, certificates_table, courses_table,
  cameras, hr_interview_questions, hr_applications, gl_lines,
  gamification_totals, absence_tracking, hr_brand_settings,
  notificationsApp,
} from '@shared/db';
import { hrEmployees, hrPositions } from '@shared/db';
import { hr_daily_reports } from '@shared/db';
import { eq, and, sql, ilike, inArray } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function execMmPurchaseOrderInsert(
  poNumber: string, vendorName: string, totalAmount: number | string,
  status: string, createdBy: string,
): Promise<void> {
  // status is a runtime string; cast through the enum union to satisfy Drizzle's typed insert.
  type PoStatus = 'draft' | 'cancelled' | 'invoiced' | 'pending' | 'approved' | 'partially_received' | 'received' | 'paid';
  await db.insert(purchase_orders_legacy).values({
    po_number: poNumber,
    vendor_name: vendorName,
    total_amount: String(totalAmount),
    status: status as PoStatus,
    created_by: createdBy,
  });
}

export async function execSystemHealthCheck(): Promise<void> {
  await db.select({ v: sql<number>`1` }).from(gl_lines).limit(1);
}

export async function execPosInventoryCountMarkGlPosted(lineId: number): Promise<void> {
  await db.update(pos_inventory_count_lines)
    .set({ countedAt: sql`NOW()` })
    .where(eq(pos_inventory_count_lines.id, lineId));
}

export async function execPosBarcodeClearPrimary(materialCardId: number): Promise<void> {
  // C8.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): this used to demote `isPrimary` on
  // `inventory_barcode_assignments` filtered by `passportId = materialCardId` — but that
  // table is keyed by a *passport* id (inventory_passports.id), an entirely different,
  // unrelated barcode table (passport/serial-number tracking). Passing a material_card id
  // as a passport id there is a no-op in practice, so the OLD primary row in the REAL
  // barcode table (`pos_barcode_map`, the one findByBarcode()'s
  // `... AND is_primary = TRUE` branch reads from) was never demoted. Result: after
  // reassigning a material's primary barcode, the old/reissued barcode value kept
  // `is_primary = TRUE` forever and kept resolving via findByBarcode(). Fixed to demote
  // the correct table/column.
  await db.update(pos_barcode_map)
    .set({ isPrimary: false })
    .where(and(
      eq(pos_barcode_map.materialCardId, materialCardId),
      eq(pos_barcode_map.isPrimary, true),
    ));
}

export async function execPosMovementMarkAiProcessing(movementId: number): Promise<void> {
  await db.update(pos_movements_legacy)
    .set({ status: 'ai_processing', updated_at: sql`NOW()` })
    .where(eq(pos_movements_legacy.id, movementId));
}

export async function execLmsLessonDelete(id: number): Promise<void> {
  await db.delete(lessons).where(eq(lessons.id, id));
}

export async function execLmsCourseDeactivate(id: number): Promise<void> {
  await db.update(courses_table)
    .set({ is_active: false, updated_at: sql`NOW()` })
    .where(eq(courses_table.id, id));
}

export async function execLmsCertificateStatusUpdate(certificateId: number, status: string): Promise<void> {
  // The `certificates_table` Drizzle binding is a 3-col stub (id/is_active/updated_at) with
  // NO `status` column, but the live `certificates` table HAS status (verified information_schema).
  // Writing only is_active lost the textual status ('revoked'/'expired' collapsed to false and
  // discarded) — so a revoked cert stayed status=NULL and the daily expiry sweep re-flagged the
  // same rows forever. Persist the real status (+ derive is_active, bump updated_at) via raw SQL.
  await db.execute(
    sql`UPDATE certificates
        SET status = ${status}, is_active = ${status === 'active'}, updated_at = NOW()
        WHERE id = ${certificateId}`,
  );
}

export async function execIotCameraDelete(id: number): Promise<void> {
  await db.delete(cameras).where(eq(cameras.id, id));
}

export async function execHrInterviewQuestionDeactivate(id: number): Promise<void> {
  await db.update(hr_interview_questions)
    .set({ isActive: false })
    .where(eq(hr_interview_questions.id, id));
}

export async function execSalesOrderSetVip(orderId: number): Promise<void> {
  await db.update(sd_sales_orders)
    .set({ is_vip: true, updated_at: sql`NOW()` })
    .where(eq(sd_sales_orders.id, orderId));
}

export async function execNotificationMarkRead(id: number): Promise<void> {
  await db.update(notificationsApp)
    .set({ read: true })
    .where(eq(notificationsApp.id, id));
}

export async function execHrApplicationDelete(id: number): Promise<void> {
  await db.delete(hr_applications).where(eq(hr_applications.id, id));
}

export async function execGamificationTotalsUpsert(employeeId: number, points: number): Promise<void> {
  await db.insert(gamification_totals).values({
    employee_id: employeeId,
    total_points: points,
    monthly_points: points,
    quarterly_points: points,
  }).onConflictDoUpdate({
    target: gamification_totals.employee_id,
    set: {
      total_points: sql`${gamification_totals.total_points} + ${points}`,
      monthly_points: sql`${gamification_totals.monthly_points} + ${points}`,
      quarterly_points: sql`${gamification_totals.quarterly_points} + ${points}`,
      updated_at: sql`NOW()`,
    },
  });
}

export async function execAbsenceTrackingUpsert(employeeId: number, absenceDate: string, consecutiveCount: number): Promise<void> {
  await db.insert(absence_tracking).values({
    employeeId: employeeId,
    absenceDate: absenceDate,
    consecutiveDayCount: consecutiveCount,
    autoBlocked: consecutiveCount >= 3,
  }).onConflictDoUpdate({
    target: [absence_tracking.employeeId, absence_tracking.absenceDate],
    set: { consecutiveDayCount: consecutiveCount },
  });
}

export async function execDailyReportMarkAbsent(today: string): Promise<void> {
  const operatorVariants = ['%mashina operator%', '%mashin operator%', '%machine operator%'];

  const existing = await db
    .select({ employee_id: hr_daily_reports.employeeId })
    .from(hr_daily_reports)
    .where(eq(hr_daily_reports.reportDate, today));
  const existingIds = new Set((Array.isArray(existing) ? existing : []).map(r => r.employee_id));

  const activeEmps = await db
    .select({ id: hrEmployees.id, position_id: hrEmployees.position_id })
    .from(hrEmployees)
    .where(eq(hrEmployees.status, 'active'));

  if (!activeEmps.length) return;

  // Canonical positions.id is integer (converged 2026-05-31); `title` holds the label.
  const positionIds = [...new Set((Array.isArray(activeEmps) ? activeEmps : []).map(e => e.position_id).filter(Boolean))] as number[];
  const operatorPosIds = positionIds.length
    ? (await db
        .select({ id: hrPositions.id })
        .from(hrPositions)
        .where(and(
          inArray(hrPositions.id, positionIds),
          sql`(${ilike(hrPositions.title, operatorVariants[0])} OR ${ilike(hrPositions.title, operatorVariants[1])} OR ${ilike(hrPositions.title, operatorVariants[2])})`,
        ))
    ).map(p => p.id)
    : [];

  const toInsert = (Array.isArray(activeEmps) ? activeEmps : []).filter(e => {
    if (existingIds.has(e.id)) return false;
    if (e.position_id && operatorPosIds.includes(e.position_id)) return false;
    return true;
  });

  if (!toInsert.length) return;

  for (const emp of toInsert) {
    await db.insert(hr_daily_reports).values({
      employeeId: emp.id,
      reportDate: today,
      tasksCompleted: '',
      status: 'absent',
      isAutoAbsent: true,
    }).onConflictDoNothing();
  }
}

export async function execHrEmployeeImport(emp: Record<string, unknown>): Promise<void> {
  type HrEmpInsert = typeof hrEmployees.$inferInsert;
  await db.insert(hrEmployees).values({
    id: castTo<number>(sql`nextval('employees_id_seq')`),
    first_name: String(emp.first_name ?? ''),
    last_name: String(emp.last_name ?? ''),
    department_id: emp.department_id != null ? Number(emp.department_id) : null,
    position_id: emp.position_id != null ? Number(emp.position_id) : null,
    employee_code: String(emp.employee_code ?? `IMP-${Date.now()}`),
    status: 'active',
  } as HrEmpInsert).onConflictDoNothing();
}

export async function execHrBrandSettingsUpsert(jsonData: string): Promise<void> {
  await db.insert(hr_brand_settings).values({
    company_id: 'default',
    brand_data: jsonData,
  }).onConflictDoUpdate({
    target: hr_brand_settings.company_id,
    set: { brand_data: jsonData, updated_at: sql`NOW()` },
  });
}

