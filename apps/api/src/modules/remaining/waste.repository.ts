/**
 * @module waste.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { safeCall, Result } from '@common/result';
type Row = Record<string, unknown>;

interface WasteDashboardData { todayR: Row; weekR: Row; monthR: Row; byType: Row[]; topCauses: Row[]; recyclable: Row; byMachine: Row[] }
interface WasteAnalysisData { byType: Row[]; byMaterial: Row[]; topCauses: Row[] }

@Injectable()
export class WasteRepository {
  async getRecords(dateFrom: string | null, dateTo: string | null, wasteType: string | null, machineId: string | null, operatorId: string | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT wr.id, wr.production_order_id, wr.order_id, wr.machine_id, wr.operator_id,
               (u.first_name || ' ' || u.last_name) AS operator_name, wr.waste_type, wr.material_type, wr.quantity, wr.unit,
               wr.cost_per_unit, wr.total_cost, wr.cause, wr.correction_action, wr.shift_number,
               wr.date, wr.notes, wr.is_recyclable, wr.recycled_quantity, wr.created_at
        FROM waste_records wr
        LEFT JOIN users u ON u.id::text = wr.operator_id
        WHERE (${dateFrom}::text IS NULL OR wr.date >= ${dateFrom})
          AND (${dateTo}::text IS NULL OR wr.date <= ${dateTo})
          AND (${wasteType}::text IS NULL OR wr.waste_type = ${wasteType})
          AND (${machineId}::text IS NULL OR wr.machine_id = ${machineId})
          AND (${operatorId}::text IS NULL OR wr.operator_id = ${operatorId})
        ORDER BY wr.created_at DESC LIMIT ${MAX_LARGE_QUERY_LIMIT}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createRecord(body: Row, qty: number, costPer: number, totalCost: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO waste_records (production_order_id, order_id, machine_id, operator_id, waste_type, material_type, quantity, unit, cost_per_unit, total_cost, cause, correction_action, shift_number, date, notes, is_recyclable, recycled_quantity, created_at, updated_at)
        VALUES (${body['productionOrderId'] ?? null}, ${body['orderId'] ?? null}, ${body['machineId'] ?? null}, ${body['operatorId'] ?? null}, ${body['wasteType'] ?? null}, ${body['materialType'] ?? null}, ${qty}, ${body['unit'] ?? null}, ${costPer}, ${totalCost}, ${body['cause'] ?? null}, ${body['correctionAction'] ?? null}, ${body['shiftNumber'] ?? null}, ${body['date'] ?? _time.now().toISOString().split('T')[0]}, ${body['notes'] ?? null}, ${body['isRecyclable'] ?? false}, ${body['recycledQuantity'] ?? 0}, NOW(), NOW())
        RETURNING *
      `);
      return rows.rows[0] as Row;
      }, 'DB_ERROR');
  }

  async updateRecord(id: string, dto: { recycledQuantity?: number; notes?: string; correctionAction?: string }): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        UPDATE waste_records
        SET recycled_quantity = COALESCE(${dto.recycledQuantity ?? null}, recycled_quantity),
            notes = COALESCE(${dto.notes ?? null}, notes),
            correction_action = COALESCE(${dto.correctionAction ?? null}, correction_action),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getDashboardStats(today: string, weekAgo: string, monthAgo: string): Promise<Result<WasteDashboardData>> {
    return safeCall(async () => {
      const [todayR, weekR, monthR, byType, topCauses, recyclable, byMachine] = await Promise.all([
        runQuery<Row>(sql`SELECT COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date = ${today}`),
        runQuery<Row>(sql`SELECT COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${weekAgo}`),
        runQuery<Row>(sql`SELECT COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo}`),
        runQuery<Row>(sql`SELECT waste_type, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo} GROUP BY waste_type ORDER BY SUM(quantity) DESC`),
        runQuery<Row>(sql`SELECT cause, COALESCE(SUM(quantity), 0) AS total_quantity, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo} AND cause IS NOT NULL AND cause != '' GROUP BY cause ORDER BY SUM(quantity) DESC LIMIT 10`),
        runQuery<Row>(sql`SELECT COALESCE(SUM(CASE WHEN is_recyclable = true THEN quantity ELSE 0 END), 0) AS total_recyclable, COALESCE(SUM(recycled_quantity), 0) AS total_recycled, COALESCE(SUM(quantity), 0) AS total_quantity FROM waste_records WHERE date >= ${monthAgo}`),
        runQuery<Row>(sql`SELECT machine_id, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost FROM waste_records WHERE date >= ${monthAgo} AND machine_id IS NOT NULL GROUP BY machine_id ORDER BY SUM(quantity) DESC LIMIT 10`),
      ]);
      return {
        todayR: todayR.rows[0] ?? {}, weekR: weekR.rows[0] ?? {}, monthR: monthR.rows[0] ?? {},
        byType: byType.rows, topCauses: topCauses.rows, recyclable: recyclable.rows[0] ?? {}, byMachine: byMachine.rows,
      };
      }, 'DB_ERROR');
  }

  async getTrends(groupBy: 'day' | 'week' | 'month', dateFrom: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const groupFrag = groupBy === 'week'
        ? sql`DATE_TRUNC('week', date::date)::date`
        : groupBy === 'month'
          ? sql`DATE_TRUNC('month', date::date)::date`
          : sql`date`;
      const rows = await runQuery<Row>(sql`SELECT ${groupFrag} AS period, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${dateFrom} GROUP BY ${groupFrag} ORDER BY 1`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getTargets(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM waste_targets WHERE is_active = true ORDER BY created_at DESC`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createTarget(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO waste_targets (waste_type, target_quantity, target_cost, period, period_start, period_end, department, notes, is_active, created_at, updated_at)
        VALUES (${body['wasteType'] ?? null}, ${body['targetQuantity'] ?? null}, ${body['targetCost'] ?? null}, ${body['period'] ?? 'monthly'}, ${body['periodStart'] ?? null}, ${body['periodEnd'] ?? null}, ${body['department'] ?? null}, ${body['notes'] ?? null}, true, NOW(), NOW())
        RETURNING *
      `);
      return rows.rows[0] as Row;
      }, 'DB_ERROR');
  }

  async getAnalysisData(monthAgo: string): Promise<Result<WasteAnalysisData>> {
    return safeCall(async () => {
      const [byType, byMaterial, topCauses] = await Promise.all([
        runQuery<Row>(sql`SELECT waste_type, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COALESCE(AVG(quantity), 0) AS avg_quantity, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo} GROUP BY waste_type ORDER BY SUM(quantity) DESC`),
        runQuery<Row>(sql`SELECT material_type, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo} AND material_type IS NOT NULL GROUP BY material_type ORDER BY SUM(quantity) DESC`),
        runQuery<Row>(sql`SELECT cause, COALESCE(SUM(quantity), 0) AS total_quantity, COALESCE(SUM(total_cost), 0) AS total_cost, COUNT(*) AS record_count FROM waste_records WHERE date >= ${monthAgo} AND cause IS NOT NULL AND cause != '' GROUP BY cause ORDER BY SUM(quantity) DESC LIMIT 10`),
      ]);
      return { byType: byType.rows, byMaterial: byMaterial.rows, topCauses: topCauses.rows };
      }, 'DB_ERROR');
  }
}
