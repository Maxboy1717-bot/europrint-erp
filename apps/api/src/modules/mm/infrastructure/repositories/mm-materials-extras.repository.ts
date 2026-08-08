/**
 * @module mm-materials-extras.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (MM)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IMmMaterialsExtrasRepo } from '../../domain/repositories/i-mm-materials-extras.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class MmMaterialsExtrasRepository implements IMmMaterialsExtrasRepo {
  async listRawMaterials(limit: number, offset: number, search?: string): Promise<Result<Row[]>>  {
  // T21-B1 #24 master-data converge: raw_materials (10) ╳ material_cards (31, kanonik).
  // ADDITIV int-link rm.material_card_id → material_cards.id surfaced via LEFT JOIN
  // (mc.kod AS canonical_card_kod) so consumers see the canonical card without
  // breaking the working raw_materials valuation. Q-39/Q-46: behavior preserved.
  try {
      const pat = search ? `%${search}%` : null;
      return pat
        ? exec(sql`SELECT rm.*, w.name AS warehouse_name, mc.kod AS canonical_card_kod FROM raw_materials rm LEFT JOIN warehouses w ON w.id = rm.warehouse_id LEFT JOIN material_cards mc ON mc.id = rm.material_card_id WHERE rm.name ILIKE ${pat} AND rm.is_active = true ORDER BY rm.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT rm.*, w.name AS warehouse_name, mc.kod AS canonical_card_kod FROM raw_materials rm LEFT JOIN warehouses w ON w.id = rm.warehouse_id LEFT JOIN material_cards mc ON mc.id = rm.material_card_id WHERE rm.is_active = true ORDER BY rm.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRawMaterialsFallback(limit: number, offset: number, search?: string): Promise<Result<Row[]>>  {
  try {
      const pat = search ? `%${search}%` : null;
      return pat
        ? exec(sql`SELECT mc.id, mc.xom_ashyo, mc.unit_of_measure AS unit, mc.min_stock, mc.category AS category_id, 'raw_material' AS type FROM material_cards mc WHERE mc.is_active = true AND mc.xom_ashyo ILIKE ${pat} ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT mc.id, mc.xom_ashyo, mc.unit_of_measure AS unit, mc.min_stock, mc.category AS category_id, 'raw_material' AS type FROM material_cards mc WHERE mc.is_active = true ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listMaterialCards(limit: number, offset: number, search?: string, category?: string): Promise<Result<Row[]>>  {
  try {
      const pat = search ? `%${search}%` : null;
      return pat && category
        ? exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category LEFT JOIN (SELECT material_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_id) ws ON ws.material_id = mc.id WHERE mc.is_active = true AND mc.xom_ashyo ILIKE ${pat} AND mc.category = ${category} ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`)
        : pat
        ? exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category LEFT JOIN (SELECT material_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_id) ws ON ws.material_id = mc.id WHERE mc.is_active = true AND mc.xom_ashyo ILIKE ${pat} ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`)
        : category
        ? exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category LEFT JOIN (SELECT material_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_id) ws ON ws.material_id = mc.id WHERE mc.is_active = true AND mc.category = ${category} ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category LEFT JOIN (SELECT material_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_id) ws ON ws.material_id = mc.id WHERE mc.is_active = true ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialCard(id: number): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category LEFT JOIN (SELECT material_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_id) ws ON ws.material_id = mc.id WHERE mc.id = ${id} AND mc.is_active = true`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
