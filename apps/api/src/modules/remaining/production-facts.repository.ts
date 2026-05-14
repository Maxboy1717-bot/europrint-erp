/**
 * @module production-facts.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ProductionFactsRepository {
  async getAll(startDate: string | null, endDate: string | null, papkaNo: string | null, operatorId: string | null, workCenterId: string | null): Promise<Result<Row[]>>  {
  try {  
      return startDate && endDate && papkaNo && operatorId && workCenterId
        ? exec(sql`SELECT pf.id, pf.papka_no, pf.fact_date, pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, pf.work_center_id, wc.name as work_center_name, pf.planned_qty, pf.actual_qty, pf.variance, pf.defects, pf.notes, pf.created_at FROM production_facts_sm72 pf LEFT JOIN users u ON u.id::text = pf.operator_id LEFT JOIN work_centers wc ON wc.id::text = pf.work_center_id WHERE pf.fact_date >= ${startDate} AND pf.fact_date <= ${endDate} AND pf.papka_no = ${papkaNo} AND pf.operator_id = ${operatorId} AND pf.work_center_id = ${workCenterId} ORDER BY pf.fact_date DESC`)
        : startDate && endDate && papkaNo
        ? exec(sql`SELECT pf.id, pf.papka_no, pf.fact_date, pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, pf.work_center_id, wc.name as work_center_name, pf.planned_qty, pf.actual_qty, pf.variance, pf.defects, pf.notes, pf.created_at FROM production_facts_sm72 pf LEFT JOIN users u ON u.id::text = pf.operator_id LEFT JOIN work_centers wc ON wc.id::text = pf.work_center_id WHERE pf.fact_date >= ${startDate} AND pf.fact_date <= ${endDate} AND pf.papka_no = ${papkaNo} ORDER BY pf.fact_date DESC`)
        : startDate && endDate
        ? exec(sql`SELECT pf.id, pf.papka_no, pf.fact_date, pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, pf.work_center_id, wc.name as work_center_name, pf.planned_qty, pf.actual_qty, pf.variance, pf.defects, pf.notes, pf.created_at FROM production_facts_sm72 pf LEFT JOIN users u ON u.id::text = pf.operator_id LEFT JOIN work_centers wc ON wc.id::text = pf.work_center_id WHERE pf.fact_date >= ${startDate} AND pf.fact_date <= ${endDate} ORDER BY pf.fact_date DESC`)
        : exec(sql`SELECT pf.id, pf.papka_no, pf.fact_date, pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, pf.work_center_id, wc.name as work_center_name, pf.planned_qty, pf.actual_qty, pf.variance, pf.defects, pf.notes, pf.created_at FROM production_facts_sm72 pf LEFT JOIN users u ON u.id::text = pf.operator_id LEFT JOIN work_centers wc ON wc.id::text = pf.work_center_id ORDER BY pf.fact_date DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVariance(startDate: string | null, endDate: string | null): Promise<Result<Row[]>>  {
  try {  
      return startDate && endDate
        ? exec(sql`SELECT fact_date as date, SUM(planned_qty) as total_planned, SUM(actual_qty) as total_actual, SUM(variance) as total_variance FROM production_facts_sm72 WHERE fact_date >= ${startDate} AND fact_date <= ${endDate} GROUP BY fact_date ORDER BY fact_date`)
        : exec(sql`SELECT fact_date as date, SUM(planned_qty) as total_planned, SUM(actual_qty) as total_actual, SUM(variance) as total_variance FROM production_facts_sm72 GROUP BY fact_date ORDER BY fact_date`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOperators(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, COUNT(*) as total_facts, AVG(pf.variance) as avg_variance, SUM(pf.defects) as total_defects, SUM(pf.actual_qty) as total_actual_qty FROM production_facts_sm72 pf LEFT JOIN users u ON u.id::text = pf.operator_id GROUP BY pf.operator_id, u.first_name, u.last_name ORDER BY SUM(pf.actual_qty) DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`INSERT INTO production_facts_sm72 (papka_no, fact_date, operator_id, work_center_id, planned_qty, actual_qty, variance, defects, notes, created_at, updated_at) VALUES (${body['papkaNo'] ?? null}, ${body['factDate'] ?? _time.now().toISOString().split('T')[0]}, ${body['operatorId'] ?? null}, ${body['workCenterId'] ?? null}, ${body['plannedQty'] ?? 0}, ${body['actualQty'] ?? 0}, ${Number(body['actualQty'] ?? 0) - Number(body['plannedQty'] ?? 0)}, ${body['defects'] ?? 0}, ${body['notes'] ?? null}, NOW(), NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
