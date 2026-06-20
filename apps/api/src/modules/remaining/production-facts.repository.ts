/**
 * @module production-facts.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * CREATE (write) → production_fact table (canonical, has shift + product_id columns).
 * GET (read)     → production_fact table with material_cards JOIN to return product_name.
 * production_facts_sm72 is NOT touched here (legacy, missing shift/product_name).
 *
 * Field mapping for FE POST body:
 *   product_name → material_cards.xom_ashyo ILIKE lookup → product_id (NULL if not found)
 *   operator     → users.first_name+last_name ILIKE lookup → operator_id (NULL if not found)
 *   shift        → shift column (VARCHAR)
 *   planned_qty  → fact_quantity (NOT NULL, default 0)
 *   actual_qty   → good_quantity (NOT NULL, default 0)
 *   defect_qty   → scrap_quantity (NOT NULL, default 0)
 *   rework_quantity = 0
 *   notes        → notes
 *   fact_date    → today (ISO date)
 *
 * production_fact columns confirmed via information_schema:
 *   id, plan_line_id, product_id, work_center_id, fact_date(varchar NOT NULL),
 *   shift(varchar), fact_quantity(int NOT NULL), good_quantity(int NOT NULL),
 *   scrap_quantity(int NOT NULL), rework_quantity(int NOT NULL),
 *   start_time(varchar), end_time(varchar), operator_id(int), notes(text),
 *   created_at(timestamp NOT NULL)
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
  // ── GET: read from production_fact with material_cards JOIN for product_name ──
  async getAll(startDate: string | null, endDate: string | null, papkaNo: string | null, operatorId: string | null, workCenterId: string | null): Promise<Result<Row[]>>  {
  try {
      // Base query: production_fact LEFT JOIN material_cards for product_name,
      //             LEFT JOIN users for operator_name.
      // Filters are applied only when the caller supplies a value.
      // papkaNo filter is skipped — production_fact has no papka_no column; kept for
      // API-compat but silently ignored (production_fact.plan_line_id is not a papka_no).
      if (startDate && endDate && operatorId && workCenterId) {
        return exec(sql`
          SELECT pf.id,
                 mc.xom_ashyo   AS product_name,
                 pf.product_id,
                 pf.fact_date,
                 pf.shift,
                 pf.operator_id,
                 (u.first_name || ' ' || u.last_name) AS operator_name,
                 pf.work_center_id,
                 pf.fact_quantity  AS planned_qty,
                 pf.good_quantity  AS actual_qty,
                 pf.scrap_quantity AS defect_qty,
                 pf.rework_quantity,
                 pf.notes,
                 pf.created_at
          FROM production_fact pf
          LEFT JOIN material_cards mc ON mc.id = pf.product_id
          LEFT JOIN users u ON u.id = pf.operator_id
          WHERE pf.fact_date >= ${startDate}
            AND pf.fact_date <= ${endDate}
            AND pf.operator_id = ${Number(operatorId)}
            AND pf.work_center_id = ${Number(workCenterId)}
          ORDER BY pf.fact_date DESC
        `);
      }
      if (startDate && endDate) {
        return exec(sql`
          SELECT pf.id,
                 mc.xom_ashyo   AS product_name,
                 pf.product_id,
                 pf.fact_date,
                 pf.shift,
                 pf.operator_id,
                 (u.first_name || ' ' || u.last_name) AS operator_name,
                 pf.work_center_id,
                 pf.fact_quantity  AS planned_qty,
                 pf.good_quantity  AS actual_qty,
                 pf.scrap_quantity AS defect_qty,
                 pf.rework_quantity,
                 pf.notes,
                 pf.created_at
          FROM production_fact pf
          LEFT JOIN material_cards mc ON mc.id = pf.product_id
          LEFT JOIN users u ON u.id = pf.operator_id
          WHERE pf.fact_date >= ${startDate}
            AND pf.fact_date <= ${endDate}
          ORDER BY pf.fact_date DESC
        `);
      }
      return exec(sql`
        SELECT pf.id,
               mc.xom_ashyo   AS product_name,
               pf.product_id,
               pf.fact_date,
               pf.shift,
               pf.operator_id,
               (u.first_name || ' ' || u.last_name) AS operator_name,
               pf.work_center_id,
               pf.fact_quantity  AS planned_qty,
               pf.good_quantity  AS actual_qty,
               pf.scrap_quantity AS defect_qty,
               pf.rework_quantity,
               pf.notes,
               pf.created_at
        FROM production_fact pf
        LEFT JOIN material_cards mc ON mc.id = pf.product_id
        LEFT JOIN users u ON u.id = pf.operator_id
        ORDER BY pf.fact_date DESC
      `);
  } catch (_e) {
    return Err(String(_e));
  }
  }

  async getVariance(startDate: string | null, endDate: string | null): Promise<Result<Row[]>>  {
  try {
      // Still reads from production_facts_sm72 for variance analytics (legacy table untouched).
      return startDate && endDate
        ? exec(sql`SELECT fact_date as date, SUM(planned_qty) as total_planned, SUM(actual_qty) as total_actual, SUM(variance) as total_variance FROM production_facts_sm72 WHERE fact_date >= ${startDate} AND fact_date <= ${endDate} GROUP BY fact_date ORDER BY fact_date`)
        : exec(sql`SELECT fact_date as date, SUM(planned_qty) as total_planned, SUM(actual_qty) as total_actual, SUM(variance) as total_variance FROM production_facts_sm72 GROUP BY fact_date ORDER BY fact_date`);
  } catch (_e) {
    return Err(String(_e));
  }
  }

  async getOperators(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT pf.operator_id, (u.first_name || ' ' || u.last_name) as operator_name, COUNT(*) as total_facts, SUM(pf.scrap_quantity) as total_defects, SUM(pf.good_quantity) as total_actual_qty FROM production_fact pf LEFT JOIN users u ON u.id = pf.operator_id GROUP BY pf.operator_id, u.first_name, u.last_name ORDER BY SUM(pf.good_quantity) DESC`);
  } catch (_e) {
    return Err(String(_e));
  }
  }

  // ── CREATE: write to production_fact (canonical table with shift + product_id) ──
  async create(body: Row): Promise<Result<Row | null>>  {
  try {
      const today = _time.now().toISOString().split('T')[0];

      // 1. product_name → material_cards.xom_ashyo ILIKE lookup → product_id
      const productNameRaw = (body['product_name'] ?? body['productName'] ?? null) as string | null;
      let productId: number | null = null;
      if (productNameRaw && productNameRaw.trim().length > 0) {
        const mcRows = await exec(sql`SELECT id FROM material_cards WHERE xom_ashyo ILIKE ${'%' + productNameRaw.trim() + '%'} LIMIT 1`);
        if (mcRows.ok && mcRows.data.length > 0) {
          productId = mcRows.data[0]['id'] as number;
        }
      }

      // 2. operator (text) → users first_name+last_name ILIKE lookup → operator_id
      const operatorRaw = (body['operator'] ?? null) as string | null;
      let operatorId: number | null = null;
      if (operatorRaw && operatorRaw.trim().length > 0) {
        const parts = operatorRaw.trim().split(/\s+/);
        let userRows: Result<Row[]>;
        if (parts.length >= 2) {
          userRows = await exec(sql`SELECT id FROM users WHERE first_name ILIKE ${'%' + parts[0] + '%'} AND last_name ILIKE ${'%' + parts[parts.length - 1] + '%'} LIMIT 1`);
        } else {
          userRows = await exec(sql`SELECT id FROM users WHERE (first_name || ' ' || last_name) ILIKE ${'%' + operatorRaw.trim() + '%'} LIMIT 1`);
        }
        if (userRows.ok && userRows.data.length > 0) {
          operatorId = userRows.data[0]['id'] as number;
        }
      }

      // 3. Remaining field mapping
      const shift         = (body['shift'] ?? null) as string | null;
      const factDate      = (body['fact_date'] ?? body['factDate'] ?? today) as string;
      const factQuantity  = Number(body['planned_qty'] ?? body['plannedQty'] ?? 0);
      const goodQuantity  = Number(body['actual_qty']  ?? body['actualQty']  ?? 0);
      const scrapQuantity = Number(body['defect_qty']  ?? body['defects']    ?? 0);
      const notes         = (body['notes'] ?? null) as string | null;

      // 4. INSERT into production_fact — only columns confirmed via information_schema
      //    (id serial, plan_line_id, product_id, work_center_id, fact_date NOT NULL,
      //     shift, fact_quantity NOT NULL, good_quantity NOT NULL,
      //     scrap_quantity NOT NULL, rework_quantity NOT NULL,
      //     start_time, end_time, operator_id, notes, created_at NOT NULL)
      const r = await exec(sql`
        INSERT INTO production_fact
          (product_id, fact_date, shift, fact_quantity, good_quantity,
           scrap_quantity, rework_quantity, operator_id, notes, created_at)
        VALUES
          (${productId}, ${factDate}, ${shift}, ${factQuantity}, ${goodQuantity},
           ${scrapQuantity}, ${0}, ${operatorId}, ${notes}, NOW())
        RETURNING
          id, product_id, fact_date, shift, fact_quantity AS planned_qty,
          good_quantity AS actual_qty, scrap_quantity AS defect_qty,
          operator_id, notes, created_at
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }
  }
}
