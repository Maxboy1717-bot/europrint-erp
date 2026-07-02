/**
 * @module qc-new.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import {
  db, qc_checkpoints, qc_certificates, qc_lab_tests, qc_spc_data, qc_parameters,
  qc_defects, qc_inspections, qc_supplier_quality, mm_vendors,
} from '@shared/db';
import { eq, ne, desc, gte, isNull, or, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

/**
 * QC-birlashtirish (2026-07-02, APPROVED egasi): POST /qc/braks endi ReportDefectCommand
 * CQRS oqimi orqali qc_defects jadvaliga yozadi (qc_braks emas). Legacy qc_braks yozuvlari
 * saqlanadi (Q-39/Q-46 — DROP TABLE yo'q), shuning uchun brak-statistika o'quvchilari
 * ikkala manbani ham UNION ALL bilan birlashtiradi.
 */
const BRAK_UNION_SQL = sql`(
  SELECT quantity::numeric AS quantity, reason, stage, created_at::timestamptz AS created_at
  FROM qc_braks
  UNION ALL
  SELECT quantity::numeric AS quantity, defect_code AS reason, stage, created_at::timestamptz AS created_at
  FROM qc_defects
  WHERE papka_order_id IS NOT NULL OR brak_date IS NOT NULL OR stage IS NOT NULL
)`;

import { MAX_QUERY_LIMIT, MS_PER_DAY } from '@common/constants/app.constants';
type Row = Record<string, unknown>;

export interface SpcCapability { cp: number | null; cpk: number | null; status: string }

/** Minimum sample count to produce meaningful Cp/Cpk. */
const MIN_SPC_SAMPLES = 2;
/** Cpk threshold for "capable" (industry standard: 4σ from each limit). */
const CPK_CAPABLE   = 1.33;
/** Cpk threshold for "marginal" (≥1.0 but below 1.33). */
const CPK_MARGINAL  = 1.0;
const ROUND_3       = 1000;

/**
 * Compute real Cp/Cpk from fetched SPC rows.
 * LSL = qc_parameters.min_value (lcl column), USL = qc_parameters.max_value (ucl column).
 * Returns null indices when data is insufficient.
 */
function computeProcessCapability(rows: Row[]): SpcCapability {
  const values = rows
    .map(r => Number(r['value']))
    .filter(v => Number.isFinite(v));

  const lslRaw = rows.find(r => r['lcl'] != null)?.['lcl'];
  const uslRaw = rows.find(r => r['ucl'] != null)?.['ucl'];
  const lsl = lslRaw != null ? Number(lslRaw) : NaN;
  const usl = uslRaw != null ? Number(uslRaw) : NaN;

  if (values.length < MIN_SPC_SAMPLES || !Number.isFinite(lsl) || !Number.isFinite(usl) || usl <= lsl) {
    return { cp: null, cpk: null, status: 'no_data' };
  }

  const n    = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const sigma = Math.sqrt(variance);

  if (sigma <= 0) {
    return { cp: null, cpk: null, status: 'no_data' };
  }

  const cp  = Math.round(((usl - lsl) / (6 * sigma)) * ROUND_3) / ROUND_3;
  const cpu = (usl - mean) / (3 * sigma);
  const cpl = (mean - lsl) / (3 * sigma);
  const cpk = Math.round(Math.min(cpu, cpl) * ROUND_3) / ROUND_3;

  const status = cpk >= CPK_CAPABLE ? 'capable'
               : cpk >= CPK_MARGINAL ? 'marginal'
               : 'incapable';

  return { cp, cpk, status };
}

export interface QcDashboardStats { open_defects: number; passed_today: number; failed_today: number; scrap_7days: number }
export interface QcDashboardData { stats: QcDashboardStats; recentDefects: Row[]; checkpointStatus: Row[] }
export interface QcAiTrendData { defectTrend: Row[]; topDefectCodes: Row[]; brakTrend: Row[] }
export interface SpcChartData { points: Row[]; processCapability: SpcCapability }

export interface AiTrendSummary {
  summary: { totalTests: number; totalBraks: number; avgPassRate: number; trend: string };
  weeklyTrend: Array<{ week: string; total: number; passed: number; failed: number; passRate: number }>;
  byReason: Array<{ reason: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
  categoryStats: Array<{ category: string; total: number; passed: number; passRate: number }>;
  aiInsights: string[];
}

@Injectable()
export class QcNewRepository {
  async getDashboardStats(): Promise<Result<QcDashboardData>> {
    return safeCall(async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

      const [openDefectsResult, recentDefects, checkpointStatus, scrapResult, todayResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(qc_defects)
          .where(ne(qc_defects.status, 'resolved')),

        db.select({
          id: sql<string>`${qc_defects.id}::text`,
          defectCode: qc_defects.defectCode,
          description: qc_defects.description,
          severity: qc_defects.severity,
          status: qc_defects.status,
          createdAt: sql<string>`${qc_defects.createdAt}::text`,
        }).from(qc_defects).orderBy(desc(qc_defects.createdAt)).limit(5),

        db.select({
          stage: qc_checkpoints.stage,
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${qc_checkpoints.isActive})::int`,
        }).from(qc_checkpoints).groupBy(qc_checkpoints.stage).orderBy(qc_checkpoints.stage),

        db.execute(sql`
          SELECT COALESCE(SUM(b.quantity), 0)::int AS qty
          FROM ${BRAK_UNION_SQL} b
          WHERE b.created_at >= ${sevenDaysAgo}
        `),

        // items_passed / items_failed columns exist in live DB but are not in Drizzle schema —
        // use raw SQL (columns confirmed via information_schema).
        db.execute(sql`
          SELECT
            COALESCE(SUM(items_passed), 0)::int AS passed_today,
            COALESCE(SUM(items_failed), 0)::int AS failed_today
          FROM qc_inspections
          WHERE created_at::date = CURRENT_DATE
        `),
      ]);

      const todayRow = (((todayResult as { rows?: Row[] }).rows) ?? [])[0] ?? {};
      const scrapRow = (((scrapResult as { rows?: Row[] }).rows) ?? [])[0] ?? {};

      return {
        stats: {
          open_defects: openDefectsResult[0]?.count ?? 0,
          passed_today: Number(todayRow['passed_today'] ?? 0),
          failed_today: Number(todayRow['failed_today'] ?? 0),
          scrap_7days: Number(scrapRow['qty'] ?? 0),
        },
        recentDefects,
        checkpointStatus,
      };
    }, 'DB_ERROR');
  }

  async findCheckpoints(stage?: string): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const base = db.select().from(qc_checkpoints);
      const rows = stage
        ? await base.where(eq(qc_checkpoints.stage, stage)).orderBy(qc_checkpoints.stage, qc_checkpoints.name).limit(MAX_QUERY_LIMIT)
        : await base.orderBy(qc_checkpoints.stage, qc_checkpoints.name).limit(MAX_QUERY_LIMIT);
      return rows;
    }, 'DB_ERROR');
  }

  async insertCheckpoint(data: { name: string; description?: string; stage?: string; standardId?: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(qc_checkpoints).values({
        name: data.name,
        description: data.description ?? null,
        stage: data.stage ?? 'in_process',
        standardId: data.standardId ?? null,
      }).returning();
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async getAiTrendData(): Promise<Result<QcAiTrendData>> {
    return safeCall(async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY);
      const twelveWeeksAgo = new Date(Date.now() - 84 * MS_PER_DAY);

      const [trend, topDefects, brakTrendResult] = await Promise.all([
        db.select({
          day: sql<string>`DATE_TRUNC('day', ${qc_defects.createdAt})::date::text`,
          total: sql<number>`count(*)::int`,
          critical: sql<number>`count(*) filter (where ${qc_defects.severity} = 'critical')::int`,
          resolved: sql<number>`count(*) filter (where ${qc_defects.status} = 'resolved')::int`,
        }).from(qc_defects)
          .where(gte(qc_defects.createdAt, thirtyDaysAgo))
          .groupBy(sql`1`)
          .orderBy(sql`1`),

        db.select({
          defectCode: qc_defects.defectCode,
          count: sql<number>`count(*)::int`,
          severityScore: sql<string>`avg(case when ${qc_defects.severity} = 'critical' then 3 when ${qc_defects.severity} = 'major' then 2 else 1 end)::numeric(4,2)`,
        }).from(qc_defects)
          .where(gte(qc_defects.createdAt, thirtyDaysAgo))
          .groupBy(qc_defects.defectCode)
          .orderBy(sql`count(*) desc`)
          .limit(10),

        db.execute(sql`
          SELECT
            DATE_TRUNC('week', b.created_at)::date::text AS week,
            count(*)::int                                AS "brakCount",
            coalesce(sum(b.quantity), 0)::int             AS "brakQty"
          FROM ${BRAK_UNION_SQL} b
          WHERE b.created_at >= ${twelveWeeksAgo}
          GROUP BY 1
          ORDER BY 1
        `),
      ]);

      const brakTrend = (((brakTrendResult as { rows?: Row[] }).rows) ?? []) as Row[];

      return { defectTrend: trend, topDefectCodes: topDefects, brakTrend };
    }, 'DB_ERROR');
  }

  async getAiTrendSummary(): Promise<Result<AiTrendSummary>> {
    return safeCall(async () => {
      // a) summary — total lab tests + pass count + total braks
      const [labSummaryResult, brakSummaryResult] = await Promise.all([
        db.select({
          totalTests: sql<number>`count(*)::int`,
          passedTests: sql<number>`count(*) filter (where ${qc_lab_tests.result} = 'pass')::int`,
        }).from(qc_lab_tests),

        db.execute(sql`SELECT COUNT(*)::int AS total_braks FROM ${BRAK_UNION_SQL} b`),
      ]);

      const totalTests  = labSummaryResult[0]?.totalTests  ?? 0;
      const passedTests = labSummaryResult[0]?.passedTests ?? 0;
      const totalBraks  = Number(
        (((brakSummaryResult as { rows?: Row[] }).rows) ?? [])[0]?.['total_braks'] ?? 0,
      );
      const avgPassRate = totalTests > 0
        ? Math.round((passedTests / totalTests) * 100)
        : 0;

      // b) weeklyTrend — braks per week with pass_rate derived from lab_tests
      const weeklyBrakResult = await db.execute(sql`
        SELECT
          DATE_TRUNC('week', b.created_at)::date::text AS week,
          COUNT(*)::int                                AS total,
          COUNT(*)::int                                AS failed
        FROM ${BRAK_UNION_SQL} b
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 12
      `);
      const weeklyBrakRows = (((weeklyBrakResult as { rows?: Row[] }).rows) ?? []) as Array<{ week: string; total: number; failed: number }>;

      // pass count per week from lab_tests (using created_at week)
      const weeklyLabResult = await db.execute(sql`
        SELECT
          DATE_TRUNC('week', created_at)::date::text AS week,
          COUNT(*) FILTER (WHERE result = 'pass')::int AS passed,
          COUNT(*)::int                                AS lab_total
        FROM qc_lab_tests
        GROUP BY 1
      `);
      const weeklyLabMap = new Map<string, { passed: number; lab_total: number }>();
      for (const r of ((weeklyLabResult as { rows?: Row[] }).rows) ?? []) {
        const row = r as { week: string; passed: number; lab_total: number };
        weeklyLabMap.set(row.week, { passed: Number(row.passed), lab_total: Number(row.lab_total) });
      }

      const weeklyTrend = weeklyBrakRows.map(r => {
        const lab  = weeklyLabMap.get(r.week);
        const passed   = lab?.passed    ?? 0;
        const labTotal = lab?.lab_total ?? 0;
        const passRate = labTotal > 0 ? Math.round((passed / labTotal) * 100) : 0;
        return {
          week:     r.week,
          total:    Number(r.total),
          passed,
          failed:   Number(r.failed),
          passRate,
        };
      });

      // c) byReason — top 10 brak reasons
      const byReasonResult = await db.execute(sql`
        SELECT COALESCE(b.reason, 'other') AS reason, COUNT(*)::int AS count
        FROM ${BRAK_UNION_SQL} b
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 10
      `);
      const byReason = ((byReasonResult as { rows?: Row[] }).rows ?? []).map(r => ({
        reason: String(r['reason'] ?? 'other'),
        count:  Number(r['count']  ?? 0),
      }));

      // d) byStage — brak count per stage
      const byStageResult = await db.execute(sql`
        SELECT COALESCE(b.stage, 'unknown') AS stage, COUNT(*)::int AS count
        FROM ${BRAK_UNION_SQL} b
        GROUP BY 1
        ORDER BY 2 DESC
      `);
      const byStage = ((byStageResult as { rows?: Row[] }).rows ?? []).map(r => ({
        stage: String(r['stage'] ?? 'unknown'),
        count: Number(r['count'] ?? 0),
      }));

      // e) categoryStats — from qc_material_tests (no Drizzle schema → raw SQL)
      const catResult = await db.execute(sql`
        SELECT
          test_category AS category,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE overall_status = 'passed')::int AS passed,
          CASE WHEN COUNT(*) = 0 THEN 0
               ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE overall_status = 'passed') / COUNT(*))
          END::int AS pass_rate
        FROM qc_material_tests
        GROUP BY 1
        ORDER BY total DESC
      `);
      const categoryStats = ((catResult as { rows?: Row[] }).rows ?? []).map(r => ({
        category: String(r['category'] ?? ''),
        total:    Number(r['total']    ?? 0),
        passed:   Number(r['passed']   ?? 0),
        passRate: Number(r['pass_rate'] ?? 0),
      }));

      // f) aiInsights — computed from real aggregates (never hardcoded)
      const aiInsights: string[] = [];
      if (totalBraks > 10 && byReason[0]) {
        aiInsights.push(`Top brak sababi: "${byReason[0].reason}" (${byReason[0].count} ta)`);
      }
      if (avgPassRate > 0 && avgPassRate < 80) {
        aiInsights.push(`Pass darajasi pastlashmoqda: ${avgPassRate}% (maqsad ≥ 80%)`);
      }
      if (totalBraks > 0 && byStage[0]) {
        aiInsights.push(`Eng ko'p brak "${byStage[0].stage}" bosqichida (${byStage[0].count} ta)`);
      }
      const lowPassCats = categoryStats.filter(c => c.total > 0 && c.passRate < 80);
      if (lowPassCats.length > 0) {
        aiInsights.push(`${lowPassCats.length} ta kategoriyada pass darajasi 80% dan past`);
      }
      if (aiInsights.length === 0) {
        aiInsights.push(totalTests === 0 && totalBraks === 0
          ? 'Hozircha sinov yozuvlari mavjud emas'
          : "Barcha ko'rsatkichlar maqbul darajada");
      }

      // trend: compare last week vs previous week brak count
      const lastWeekBraks  = weeklyTrend[0]?.failed ?? 0;
      const prevWeekBraks  = weeklyTrend[1]?.failed ?? 0;
      const trend = lastWeekBraks < prevWeekBraks
        ? 'improving'
        : lastWeekBraks > prevWeekBraks
          ? 'declining'
          : 'stable';

      return {
        summary: { totalTests, totalBraks, avgPassRate, trend },
        weeklyTrend,
        byReason,
        byStage,
        categoryStats,
        aiInsights,
      };
    }, 'DB_ERROR');
  }

  async findCertificates(status?: string): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const base = db.select().from(qc_certificates);
      const rows = status
        ? await base.where(eq(qc_certificates.status, status)).orderBy(desc(qc_certificates.createdAt)).limit(100)
        : await base.orderBy(desc(qc_certificates.createdAt)).limit(100);
      return rows;
    }, 'DB_ERROR');
  }

  async insertCertificate(data: {
    certNumber: string;
    orderId?: number;
    productName?: string;
    issuedDate?: string;
    status?: string;
    notes?: string;
    issuedBy?: string;
  }): Promise<Result<Row>> {
    // NOTE: qc_certificates is a VIEW over 'certificates' in the live DB.
    // The underlying table has NOT NULL LMS columns (user_id, course_id, certificate_number)
    // with no FK constraints. We use sentinel 0/cert_number values for those columns so
    // that QC records are distinguishable (user_id=0 = QC origin) without DDL changes.
    return safeCall(async () => {
      const r = await db.execute(sql`
        INSERT INTO certificates
          (user_id, course_id, certificate_number, cert_number, order_id, product_name, issued_date, status, notes, issued_by)
        VALUES
          (0, 0, ${data.certNumber}, ${data.certNumber},
           ${data.orderId ?? null}, ${data.productName ?? null},
           ${data.issuedDate ?? null}, ${data.status ?? 'active'},
           ${data.notes ?? null}, ${data.issuedBy ?? null})
        RETURNING id, cert_number, order_id, product_name, issued_date, status, notes, issued_by, created_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async findLabTests(orderId?: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const base = db.select().from(qc_lab_tests);
      const rows = orderId
        ? await base.where(eq(qc_lab_tests.orderId, orderId)).orderBy(desc(qc_lab_tests.createdAt)).limit(MAX_QUERY_LIMIT)
        : await base.orderBy(desc(qc_lab_tests.createdAt)).limit(MAX_QUERY_LIMIT);
      return rows;
    }, 'DB_ERROR');
  }

  async insertLabTest(data: {
    orderId?: number; parameterName: string; value?: number; unit?: string;
    minValue?: number; maxValue?: number; testedBy?: string; notes?: string; result: string;
  }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(qc_lab_tests).values({
        orderId: data.orderId ?? null,
        parameterName: data.parameterName,
        value: data.value != null ? String(data.value) : null,
        unit: data.unit ?? null,
        result: data.result,
        minValue: data.minValue != null ? String(data.minValue) : null,
        maxValue: data.maxValue != null ? String(data.maxValue) : null,
        testedBy: data.testedBy ?? null,
        notes: data.notes ?? null,
        testedAt: _time.now(),
      }).returning();
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async getSpcChartData(parameterId?: number): Promise<Result<SpcChartData>> {
    return safeCall(async () => {
      const rows = await db.select({
        id: qc_spc_data.id,
        parameterId: qc_spc_data.parameterId,
        parameterName: qc_parameters.name,
        unit: qc_parameters.unit,
        value: qc_spc_data.value,
        orderId: qc_spc_data.orderId,
        measuredAt: qc_spc_data.measuredAt,
        lcl: qc_parameters.minValue,
        ucl: qc_parameters.maxValue,
        center: qc_parameters.targetValue,
      })
        .from(qc_spc_data)
        .leftJoin(qc_parameters, eq(qc_spc_data.parameterId, qc_parameters.id))
        .where(parameterId ? eq(qc_spc_data.parameterId, parameterId) : or(isNull(qc_spc_data.parameterId), sql`true`))
        .orderBy(desc(qc_spc_data.measuredAt))
        .limit(100);

      const processCapability = computeProcessCapability(rows);
      return { points: rows, processCapability };
    }, 'DB_ERROR');
  }

  async findInspectionById(id: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(qc_inspections).where(eq(qc_inspections.id, id)).limit(1);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async updateInspection(id: string, fields: { status?: string; result?: string; notes?: string }): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // RULE4_EXCEPTION: partial COALESCE update on confirmed live columns (status/result/notes);
      // id cast to int to match the integer PK. Only provided fields change.
      const r = await db.execute(sql`
        UPDATE qc_inspections SET
          status     = COALESCE(${fields.status ?? null}, status),
          result     = COALESCE(${fields.result ?? null}, result),
          notes      = COALESCE(${fields.notes ?? null}, notes),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async deleteInspection(id: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const r = await db.execute(sql`DELETE FROM qc_inspections WHERE id = ${Number(id)} RETURNING id`);
      return (((r as { rows?: Row[] }).rows) ?? []).length > 0;
    }, 'DB_ERROR');
  }

  async getSupplierRatings(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        vendorId: qc_supplier_quality.vendorId,
        vendorName: mm_vendors.name,
        inspections: sql<number>`count(*)::int`,
        qualityScore: sql<string>`avg(case when ${qc_supplier_quality.status} = 'approved' then 100 when ${qc_supplier_quality.status} = 'conditional' then 60 else 0 end)::numeric(5,2)`,
        totalDefects: sql<number>`sum(${qc_supplier_quality.defectsFound})::int`,
        totalSamples: sql<number>`sum(${qc_supplier_quality.sampleSize})::int`,
      }).from(qc_supplier_quality)
        .leftJoin(mm_vendors, eq(mm_vendors.id, qc_supplier_quality.vendorId))
        .groupBy(qc_supplier_quality.vendorId, mm_vendors.name)
        .orderBy(sql`avg(case when ${qc_supplier_quality.status} = 'approved' then 100 when ${qc_supplier_quality.status} = 'conditional' then 60 else 0 end) desc`)
        .limit(50);
      return rows;
    }, 'DB_ERROR');
  }
}
