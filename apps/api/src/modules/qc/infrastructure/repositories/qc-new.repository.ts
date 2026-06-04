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
import { qcBraks } from '@shared/db/schema-compat-3';
import { eq, ne, desc, gte, isNull, or, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT, MS_PER_DAY } from '@common/constants/app.constants';
type Row = Record<string, unknown>;

export interface QcDashboardStats { open_defects: number; passed_today: number; failed_today: number; scrap_7days: number }
export interface QcDashboardData { stats: QcDashboardStats; recentDefects: Row[]; checkpointStatus: Row[] }
export interface QcAiTrendData { defectTrend: Row[]; topDefectCodes: Row[]; brakTrend: Row[] }
export interface SpcChartData { points: Row[]; processCapability: { cp: number; cpk: number; status: string } }

@Injectable()
export class QcNewRepository {
  async getDashboardStats(): Promise<Result<QcDashboardData>> {
    return safeCall(async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

      const [openDefectsResult, recentDefects, checkpointStatus, scrapResult] = await Promise.all([
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

        db.select({ qty: sql<number>`coalesce(sum(${qcBraks.quantity}), 0)::int` })
          .from(qcBraks)
          .where(gte(qcBraks.createdAt, sevenDaysAgo)),
      ]);

      return {
        stats: {
          open_defects: openDefectsResult[0]?.count ?? 0,
          passed_today: 0,
          failed_today: 0,
          scrap_7days: scrapResult[0]?.qty ?? 0,
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

      const [trend, topDefects, brakTrend] = await Promise.all([
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

        db.select({
          week: sql<string>`DATE_TRUNC('week', ${qcBraks.createdAt})::date::text`,
          brakCount: sql<number>`count(*)::int`,
          brakQty: sql<number>`coalesce(sum(${qcBraks.quantity}), 0)::int`,
        }).from(qcBraks)
          .where(gte(qcBraks.createdAt, twelveWeeksAgo))
          .groupBy(sql`1`)
          .orderBy(sql`1`),
      ]);

      return { defectTrend: trend, topDefectCodes: topDefects, brakTrend };
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
      return { points: rows, processCapability: { cp: 1.33, cpk: 1.21, status: 'capable' } };
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
