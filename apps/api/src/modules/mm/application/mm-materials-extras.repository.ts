import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class MmMaterialsExtrasRepository {
  async listRawMaterials(limit: number, offset: number, search?: string): Promise<Result<Row[]>>  {
  try {  
      const pat = search ? `%${search}%` : null;
      return pat
        ? exec(sql`SELECT rm.*, w.name AS warehouse_name FROM raw_materials rm LEFT JOIN warehouses w ON w.id = rm.warehouse_id WHERE rm.name ILIKE ${pat} AND rm.is_active = true ORDER BY rm.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT rm.*, w.name AS warehouse_name FROM raw_materials rm LEFT JOIN warehouses w ON w.id = rm.warehouse_id WHERE rm.is_active = true ORDER BY rm.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRawMaterialsFallback(limit: number, offset: number, search?: string): Promise<Result<Row[]>>  {
  try {  
      const pat = search ? `%${search}%` : null;
      return pat
        ? exec(sql`SELECT mc.id, mc.name, mc.unit, mc.min_stock, mc.category_id, 'raw_material' AS type FROM material_cards mc WHERE mc.is_active = true AND mc.name ILIKE ${pat} ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT mc.id, mc.name, mc.unit, mc.min_stock, mc.category_id, 'raw_material' AS type FROM material_cards mc WHERE mc.is_active = true ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listMaterialCards(limit: number, offset: number, search?: string, category?: string): Promise<Result<Row[]>>  {
  try {  
      const pat = search ? `%${search}%` : null;
      return pat && category
        ? exec(sql`SELECT mc.*, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_card_id) ws ON ws.material_card_id = mc.id WHERE mc.is_active = true AND mc.name ILIKE ${pat} AND mc.category = ${category} ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`)
        : pat
        ? exec(sql`SELECT mc.*, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_card_id) ws ON ws.material_card_id = mc.id WHERE mc.is_active = true AND mc.name ILIKE ${pat} ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`)
        : category
        ? exec(sql`SELECT mc.*, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_card_id) ws ON ws.material_card_id = mc.id WHERE mc.is_active = true AND mc.category = ${category} ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT mc.*, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_card_id) ws ON ws.material_card_id = mc.id WHERE mc.is_active = true ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMaterialCard(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT mc.*, c.name AS category_name, COALESCE(ws.quantity, 0) AS current_stock FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id LEFT JOIN (SELECT material_card_id, SUM(quantity) AS quantity FROM warehouse_stock GROUP BY material_card_id) ws ON ws.material_card_id = mc.id WHERE mc.id = ${id} AND mc.is_active = true`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
