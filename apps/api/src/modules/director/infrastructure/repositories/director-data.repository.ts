/**
 * @module director-data.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { sales_orders, mes_sessions } from '@shared/db';
import {
  hrEmployees, hrAttendance, hrDepartments, productionOrders,
  invoicesTable, accountsTable, systemAlerts, iotAlerts,
} from '@shared/db';
import { warehouseStock } from '@shared/db';
// VISION-3340 #12: ЦКП deadline-gate qoidasi REIMPLEMENT qilinmaydi — jonli
// `applyCkpGate` (hr/payroll/ckp-gate.ts, payroll'da ishlatiladigan HAQIQIY
// darvoza) shu yerda import/reuse qilinadi (Q-39 regressiya-taqiq: bitta qoida,
// bitta joy).
import { applyCkpGate, type CkpGateDayInput } from '@modules/hr/payroll/ckp-gate';
import type {
  IDirectorDataRepo,
  DashboardData,
  SummaryData,
  ProductionData,
  HrData,
  FinanceData,
  AlertsData,
  AiSummaryData,
  CkpDeadlineComplianceRate,
} from '../../domain/repositories/i-director-data.repo';

type Row = Record<string, unknown>;
const num = (row: Row | undefined, key: string) => safeNum(row?.[key] ?? '0') || 0;
const int = (row: Row | undefined, key: string) => parseInt(String(row?.[key] ?? '0'), 10) || 0;

export type {
  DashboardData,
  SummaryData,
  ProductionData,
  HrData,
  FinanceData,
  AlertsData,
  AiSummaryData,
  CkpDeadlineComplianceRate,
};

@Injectable()
export class DirectorDataRepository implements IDirectorDataRepo {
  async queryDashboard(): Promise<Result<DashboardData>> {

    return safeCall(async () => {
      const [[ordRow], [oeeRow], [hrRow], [stockRow], [iotRow]] = await Promise.all([
        db.select({
          month: sql<string>`COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))`,
          completed: sql<string>`COUNT(*) FILTER (WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE)`,
          in_production: sql<string>`(SELECT COUNT(*) FROM production_orders WHERE status = 'in_progress')`,
          overdue: sql<string>`COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND delivery_date IS NOT NULL AND delivery_date::date < CURRENT_DATE)`,
        }).from(sales_orders),
        db.select({ oee: sql<string>`CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(COUNT(*) FILTER (WHERE quality_passed = true)::numeric / COUNT(*) * 100, 1)::text END` }).from(mes_sessions).where(sql`DATE(created_at AT TIME ZONE 'Asia/Tashkent') = CURRENT_DATE AT TIME ZONE 'Asia/Tashkent'`),
        db.select({
          total: sql<string>`(SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL)`,
          present: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id})`,
          late: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} = 'late')`,
          active: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} = 'active')`,
        }).from(hrAttendance).where(sql`DATE(${hrAttendance.check_in}) = CURRENT_DATE`),
        // G9-3: kanonik warehouse_stock + material_cards.min_stock (avval 7-qatorli DEMO
        // stock_items jadvalidan o'qir edi) — get-dashboard-kpis.handler bilan bir xillashtirildi.
        db.select({ cnt: sql<string>`COUNT(*)` }).from(warehouseStock).where(sql`EXISTS (
          SELECT 1 FROM material_cards mc
          WHERE mc.id = warehouse_stock.material_id
            AND COALESCE(mc.min_stock, 0) > 0
            AND mc.is_active = true
            AND COALESCE(warehouse_stock.available_quantity, 0) < COALESCE(mc.min_stock, 0)
        )`),
        db.select({ cnt: sql<string>`COUNT(*)` }).from(iotAlerts).where(sql`${iotAlerts.created_at} >= NOW() - INTERVAL '8 hours' AND ${iotAlerts.resolved_at} IS NULL`),
      ]);
      const o = ordRow as Row | undefined;
      const oe = oeeRow as Row | undefined;
      const h = hrRow as Row | undefined;
      const total = num(h, 'total'); const present = num(h, 'present');
      return {
        orders: { month: num(o, 'month'), completed: num(o, 'completed'), inProduction: num(o, 'in_production'), overdue: num(o, 'overdue') },
        production: { oee: oe?.oee != null ? String(oe.oee) : null },
        hr: { present, total, active: num(h, 'active'), late: num(h, 'late'), attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 },
        alerts: { minStock: num(stockRow as Row, 'cnt'), iot: num(iotRow as Row, 'cnt') },
      };
    }, 'DB_ERROR');
  }

  async querySummary(): Promise<Result<SummaryData>> {

    return safeCall(async () => {
      const [[ordRow], [oeeRow]] = await Promise.all([
        db.select({
          today: sql<string>`COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)`,
          month_total: sql<string>`COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))`,
          month_revenue: sql<string>`COALESCE(SUM(total_amount) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)), 0)`,
          active_production: sql<string>`(SELECT COUNT(*) FROM production_orders WHERE status = 'in_progress')`,
          pending: sql<string>`COUNT(*) FILTER (WHERE status = 'pending')`,
          overdue: sql<string>`COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND delivery_date IS NOT NULL AND delivery_date::date < CURRENT_DATE)`,
        }).from(sales_orders),
        db.select({ oee: sql<string>`CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(COUNT(*) FILTER (WHERE quality_passed = true)::numeric / COUNT(*) * 100, 1)::text END` }).from(mes_sessions).where(sql`DATE(created_at AT TIME ZONE 'Asia/Tashkent') = CURRENT_DATE AT TIME ZONE 'Asia/Tashkent'`),
      ]);
      const o = ordRow as Row | undefined;
      const oe = oeeRow as Row | undefined;
      return {
        orders: { today: num(o, 'today'), monthTotal: num(o, 'month_total'), monthRevenue: num(o, 'month_revenue'), activeProduction: num(o, 'active_production'), pending: num(o, 'pending'), overdue: num(o, 'overdue') },
        production: { oee: oe?.oee != null ? Number(oe.oee) : null },
        generatedAt: _time.now().toISOString(),
      };
    }, 'DB_ERROR');
  }

  /**
   * VISION-3340 #12 — bir kunlik ЦКП deadline-gate muvofiqlik foizi. Har bir
   * ЦКП-normasi belgilangan karta (`tskp_target IS NOT NULL`) uchun `ckp_fact_values`
   * (LEFT JOIN, bo'sh bo'lsa NO_FACT) o'qib, AYNAN o'sha kunlik-gate qoidasini
   * (`applyCkpGate`, hr/payroll/ckp-gate.ts) qo'llaydi — pass (gate ochiq) va
   * fail (NO_FACT/DEADLINE_PASSED) sonini yig'adi. FABRIKATSIYA YO'Q: karta yo'q
   * bo'lsa complianceRate halol 0.
   */
  async getCkpDeadlineComplianceRate(date: string): Promise<Result<CkpDeadlineComplianceRate>> {

    return safeCall(async () => {
      const res = await runQuery<Row>(sql`
        SELECT f.id                        AS fact_id,
               f.submitted_at              AS submitted_at,
               d.ckp_report_deadline_hours AS deadline_hours
        FROM org_departments d
        LEFT JOIN ckp_fact_values f
          ON f.card_id = d.id AND f.fact_date = ${date}::date
        WHERE d.tskp_target IS NOT NULL
      `);
      const rows = Array.isArray(res.rows) ? (res.rows as Row[]) : [];
      let passCount = 0;
      let failCount = 0;
      for (const row of rows) {
        const hasFact = row['fact_id'] != null;
        const deadlineHours = row['deadline_hours'] != null ? Number(row['deadline_hours']) : null;
        const submittedRaw = row['submitted_at'];
        const submittedAt =
          submittedRaw == null
            ? null
            : submittedRaw instanceof Date
              ? submittedRaw
              : new Date(String(submittedRaw));
        const dayInput: CkpGateDayInput = {
          hasFact,
          deadlineHours,
          factDate: date,
          submittedAt: submittedAt && !Number.isNaN(submittedAt.getTime()) ? submittedAt : null,
        };
        if (applyCkpGate(dayInput).open) passCount += 1;
        else failCount += 1;
      }
      const totalCards = passCount + failCount;
      const complianceRate = totalCards > 0 ? Math.round((passCount / totalCards) * 100) : 0;
      return { date, totalCards, passCount, failCount, complianceRate };
    }, 'DB_ERROR');
  }

  async queryProduction(): Promise<Result<ProductionData>> {

    return safeCall(async () => {
      const [breakRows, sessRows, [sessCountRow], overdueRows, [defRow]] = await Promise.all([
        db.select({ status: productionOrders.status, cnt: sql<string>`COUNT(*)` }).from(productionOrders).groupBy(productionOrders.status),
        db.select({
          id: mes_sessions.id,
          status: mes_sessions.status,
          defect_qty: mes_sessions.defect_qty,
          quality_passed: mes_sessions.quality_passed,
          started_at: sql<string>`${mes_sessions.started_at}::text`,
          completed_at: sql<string>`${mes_sessions.completed_at}::text`,
        }).from(mes_sessions).where(sql`DATE(created_at) = CURRENT_DATE`).orderBy(sql`created_at DESC`).limit(50),
        db.select({
          snaps: sql<string>`COUNT(*)`,
          quality_rate: sql<string>`ROUND(100.0 * COUNT(*) FILTER (WHERE quality_passed = true) / NULLIF(COUNT(*),0), 1)::text`,
        }).from(mes_sessions).where(sql`DATE(created_at) = CURRENT_DATE`),
        db.select({
          id: productionOrders.id,
          order_number: sql<string>`order_number`,
          planned_end_date: sql<string>`planned_end_date::text`,
          status: productionOrders.status,
        }).from(productionOrders).where(sql`status::text NOT IN ('completed','cancelled') AND planned_end_date IS NOT NULL AND planned_end_date::date < CURRENT_DATE`).orderBy(sql`planned_end_date ASC`).limit(20),
        db.select({
          defect_pct: sql<string>`ROUND(COALESCE(SUM(defective_qty::numeric),0) / NULLIF(SUM(planned_quantity::numeric),0) * 100, 1)`,
          delayed_cnt: sql<string>`COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND planned_end_date IS NOT NULL AND planned_end_date::date < CURRENT_DATE)`,
        }).from(productionOrders).where(sql`deleted_at IS NULL`),
      ]);
      type BreakRow = { status: string; cnt: string };
      const orderBreakdown: Record<string, number> = {};
      for (const r of breakRows as BreakRow[]) orderBreakdown[r.status] = parseInt(r.cnt, 10);
      const sessionsToday = ((sessRows ?? []) as Row[]).map(r => ({
        id: r.id, status: String(r.status ?? ''),
        defectQty: parseInt(String(r.defect_qty ?? '0'), 10) || 0,
        qualityPassed: r.quality_passed ?? null,
        startedAt: r.started_at ?? null,
        completedAt: r.completed_at ?? null,
      }));
      const ov = (sessCountRow as Row | undefined) ?? {};
      const overdueOrders = ((overdueRows ?? []) as Row[]).map(r => ({
        id: r.id, papkaNo: String(r.order_number ?? ''), tayyorBolishSanasi: String(r.planned_end_date ?? ''), status: String(r.status ?? ''),
      }));
      const qualityRate = ov['quality_rate'] != null ? String(ov['quality_rate']) : null;
      const dr = defRow as Row | undefined;
      return {
        orderBreakdown, sessionsToday,
        oeeToday: { avg: qualityRate, min: qualityRate, max: qualityRate, snapshots: int(ov, 'snaps') },
        overdueOrders,
        defectPct: parseFloat(String(dr?.['defect_pct'] ?? '0')) || 0,
        delayedOrders: parseInt(String(dr?.['delayed_cnt'] ?? '0'), 10) || 0,
      };
    }, 'DB_ERROR');
  }

  async queryHr(): Promise<Result<HrData>> {

    return safeCall(async () => {
      const [[empRow], [attRow], deptRows] = await Promise.all([
        db.select({
          total: sql<string>`COUNT(*)`,
          active: sql<string>`COUNT(*) FILTER (WHERE deleted_at IS NULL)`,
          on_leave: sql<string>`COUNT(*) FILTER (WHERE employment_status='on_leave')`,
          suspended: sql<string>`COUNT(*) FILTER (WHERE employment_status='suspended')`,
        }).from(hrEmployees),
        db.select({
          date: sql<string>`CURRENT_DATE::text`,
          present: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} != 'absent')`,
          absent: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} = 'absent')`,
          late: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} = 'late')`,
          early_leave: sql<string>`COUNT(DISTINCT ${hrAttendance.employee_id}) FILTER (WHERE ${hrAttendance.status} = 'early_leave')`,
          total_emp: sql<string>`(SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL)`,
        }).from(hrAttendance).where(sql`DATE(${hrAttendance.check_in}) = CURRENT_DATE`),
        db.select({
          department: hrDepartments.name,
          cnt: sql<string>`COUNT(${hrEmployees.id})`,
        }).from(hrEmployees)
          .innerJoin(hrDepartments, sql`${hrDepartments.id} = ${hrEmployees.department_id}`)
          .where(sql`${hrEmployees.deleted_at} IS NULL`)
          .groupBy(hrDepartments.name)
          .orderBy(sql`COUNT(${hrEmployees.id}) DESC`)
          .limit(15),
      ]);
      const e = (empRow as Row | undefined) ?? {};
      const a = (attRow as Row | undefined) ?? {};
      const totalEmp = num(a, 'total_emp'); const present = num(a, 'present');
      type DeptRow2 = { department: string; cnt: string };
      return {
        employees: { total: num(e, 'total'), active: num(e, 'active'), onLeave: num(e, 'on_leave'), suspended: num(e, 'suspended') },
        attendance: { date: String(a.date ?? _time.now().toISOString().slice(0, 10)), present, absent: num(a, 'absent'), late: num(a, 'late'), earlyLeave: num(a, 'early_leave'), attendanceRate: totalEmp > 0 ? Math.round((present / totalEmp) * 100) : 0 },
        byDepartment: ((deptRows ?? []) as DeptRow2[]).map(r => ({ department: r.department, count: parseInt(r.cnt, 10) })),
      };
    }, 'DB_ERROR');
  }

  async queryFinance(): Promise<Result<FinanceData>> {

    return safeCall(async () => {
      const [invRows, accRows] = await Promise.all([
        db.select({
          status: invoicesTable.status,
          cnt: sql<string>`COUNT(*)`,
          total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)),0)`,
        }).from(invoicesTable).groupBy(invoicesTable.status),
        db.select({
          type: accountsTable.accountType,
          cnt: sql<string>`COUNT(*)`,
        }).from(accountsTable).groupBy(accountsTable.accountType),
      ]);
      type InvRow = { status: string; cnt: string; total: string };
      const invoices: Record<string, { count: number; amount: number }> = {};
      let totalReceivable = 0; let overdueAmount = 0; let pendingAmount = 0;
      for (const r of invRows as InvRow[]) {
        const count = parseInt(r.cnt, 10); const amount = parseFloat(r.total);
        invoices[r.status] = { count, amount };
        if (r.status !== 'paid') totalReceivable += amount;
        if (r.status === 'overdue') overdueAmount += amount;
        if (r.status === 'pending') pendingAmount += amount;
      }
      type AccRow = { type: string | null; cnt: string };
      return { invoices, totalReceivable, overdueAmount, pendingAmount, accounts: ((accRows ?? []) as AccRow[]).map(r => ({ type: r.type, count: parseInt(r.cnt, 10) })) };
    }, 'DB_ERROR');
  }

  async queryAlerts(): Promise<Result<AlertsData>> {

    return safeCall(async () => {
      const rows = await db.select({
        id: sql<string>`${systemAlerts.id}::text`,
        severity: systemAlerts.severity,
        title: systemAlerts.title,
        message: systemAlerts.message,
        created_at: sql<string>`${systemAlerts.createdAt}::text`,
      }).from(systemAlerts)
        .where(sql`${systemAlerts.resolvedAt} IS NULL`)
        .orderBy(sql`${systemAlerts.createdAt} DESC`)
        .limit(50);
      type AR = { id: string; severity: string; title: string; message: string; created_at: string };
      const alerts = ((rows ?? []) as AR[]).map(a => ({ id: a.id, severity: a.severity ?? 'info', title: a.title ?? '', message: a.message ?? '', module: '', createdAt: a.created_at ?? '' }));
      return { alerts, count: alerts.length };
    }, 'DB_ERROR');
  }

  async queryAiSummary(): Promise<Result<AiSummaryData>> {

    return safeCall(async () => {
      const [[ordRow], [sessCountRow], [hrRow], [invRow], [stockRow], raspResult] = await Promise.all([
        db.select({
          total: sql<string>`COUNT(*)`,
          completed: sql<string>`COUNT(*) FILTER (WHERE status='completed')`,
          overdue: sql<string>`COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND delivery_date IS NOT NULL AND delivery_date::date < CURRENT_DATE)`,
        }).from(sales_orders),
        db.select({ snaps: sql<string>`COUNT(*)` }).from(mes_sessions).where(sql`DATE(created_at) = CURRENT_DATE`),
        db.select({
          present: sql<string>`COUNT(DISTINCT employee_id)`,
          total: sql<string>`(SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL)`,
        }).from(hrAttendance).where(sql`DATE(check_in) = CURRENT_DATE`),
        db.select({
          cnt: sql<string>`COUNT(*)`,
          amt: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)),0)`,
        }).from(invoicesTable).where(sql`status IN ('overdue','unpaid') AND due_date < CURRENT_DATE`),
        // G9-3: kanonik warehouse_stock low-stock hisobi (avval DEMO stock_items dan o'qir edi).
        db.select({ cnt: sql<string>`COUNT(*)` }).from(warehouseStock).where(sql`EXISTS (
          SELECT 1 FROM material_cards mc
          WHERE mc.id = warehouse_stock.material_id
            AND COALESCE(mc.min_stock, 0) > 0
            AND mc.is_active = true
            AND COALESCE(warehouse_stock.available_quantity, 0) < COALESCE(mc.min_stock, 0)
        )`),
        db.execute(sql`SELECT COUNT(*) AS cnt FROM rasporyazhenie WHERE status != 'done' AND deadline IS NOT NULL AND deadline < CURRENT_DATE`),
      ]);
      const o = (ordRow as Row | undefined) ?? {};
      const h = (hrRow as Row | undefined) ?? {};
      const inv = (invRow as Row | undefined) ?? {};
      const total = num(h, 'total'); const present = num(h, 'present');
      const totalOrders = num(o, 'total'); const completedOrders = num(o, 'completed'); const overdueOrders = num(o, 'overdue');
      const raspRow = ((raspResult as { rows?: unknown[] }).rows?.[0] as Row | undefined) ?? {};
      return {
        summary: `Bugun ${totalOrders} ta buyurtma, ${completedOrders} ta yakunlandi, ${overdueOrders} ta muddati o'tgan. Davomiylik: ${total > 0 ? Math.round((present / total) * 100) : 0}%.`,
        generatedAt: _time.now().toISOString(), aiGenerated: false,
        stats: { totalOrders, completedOrders, overdueOrders, oee: null, attendance: { present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 }, overdueInvoices: { count: num(inv, 'cnt'), amount: num(inv, 'amt') }, stockAlerts: num((stockRow as Row | undefined) ?? {}, 'cnt'), sessionCount: int((sessCountRow as Row | undefined) ?? {}, 'snaps'), cc: { inboxOverdue: int(raspRow, 'cnt') } },
      };
    }, 'DB_ERROR');
  }
}
