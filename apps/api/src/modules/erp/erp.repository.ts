/**
 * @module erp.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpRepository {
  async listProducts(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.*, c.name AS category_name FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id ORDER BY mc.name LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProduct(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT mc.*, c.name AS category_name FROM material_cards mc LEFT JOIN material_categories c ON c.id = mc.category_id WHERE mc.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateProduct(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE material_cards SET name = COALESCE(${body.name ?? null}, name), unit = COALESCE(${body.unit ?? null}, unit), min_stock = COALESCE(${body.minStock ?? null}, min_stock), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBomHeaders(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bh.*, mc.name AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON mc.id = bh.product_id ORDER BY bh.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBomHeader(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT bh.*, mc.name AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON mc.id = bh.product_id WHERE bh.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async bomExplosion(id: number, quantity: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bi.*, mc.name AS material_name, mc.unit, (bi.quantity * ${quantity}) AS required_qty FROM bom_items bi LEFT JOIN material_cards mc ON mc.id = bi.material_id WHERE bi.bom_id = ${id} ORDER BY bi.id`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBomItems(bomHeaderId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bi.*, mc.name AS material_name, mc.unit FROM bom_items bi LEFT JOIN material_cards mc ON mc.id = bi.material_id WHERE bi.bom_id = ${bomHeaderId} ORDER BY bi.id`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createBomItem(body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`INSERT INTO bom_items (bom_id, material_id, quantity, unit) VALUES (${body.bomHeaderId ?? null}, ${body.materialId ?? null}, ${body.quantity ?? 1}, ${body.unit ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateBomItem(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE bom_items SET quantity = COALESCE(${body.quantity ?? null}, quantity), unit = COALESCE(${body.unit ?? null}, unit) WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRoutings(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT rt.*, mc.name AS product_name FROM routings rt LEFT JOIN material_cards mc ON mc.id = rt.product_id ORDER BY rt.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getRouting(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT rt.*, mc.name AS product_name FROM routings rt LEFT JOIN material_cards mc ON mc.id = rt.product_id WHERE rt.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRoutingOperations(routingId?: number): Promise<Result<Row[]>>  {
  try {  
      return routingId
        ? exec(sql`SELECT ro.*, wc.name AS work_center_name FROM pp_routing_operations ro LEFT JOIN work_centers wc ON wc.id::text = ro.work_center_id::text WHERE ro.routing_id = ${routingId} ORDER BY ro.routing_id, ro.sequence_no LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT ro.*, wc.name AS work_center_name FROM pp_routing_operations ro LEFT JOIN work_centers wc ON wc.id::text = ro.work_center_id::text ORDER BY ro.routing_id, ro.sequence_no LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateRoutingOperation(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`UPDATE pp_routing_operations SET planned_duration = COALESCE(${body.plannedDuration ?? null}, planned_duration), work_center_id = COALESCE(${body.workCenterId ?? null}, work_center_id), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createProduct(body: Row): Promise<Result<Row | null>> {
  try {
    const code = body.code ?? `MC-${Date.now()}`;
    const r = await exec(sql`INSERT INTO material_cards (code, name, name_ru, unit, standard_cost, is_active) VALUES (${code}, ${body.name ?? 'Yangi mahsulot'}, ${body.nameRu ?? null}, ${body.unit ?? 'dona'}, ${body.standardCost ?? null}, ${body.isActive ?? true}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteProduct(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`UPDATE material_cards SET is_active = false WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createBomHeader(body: Row): Promise<Result<Row | null>> {
  try {
    const bomNumber = body.bomNumber ?? `BOM-${Date.now()}`;
    const r = await exec(sql`INSERT INTO bom_headers (bom_number, product_id, version) VALUES (${bomNumber}, ${body.productId ?? null}, ${body.version ?? '1.0'}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteBomHeader(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM bom_headers WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteBomItem(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM bom_items WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createRouting(body: Row): Promise<Result<Row | null>> {
  try {
    const routingNumber = body.routingNumber ?? body.code ?? `RT-${Date.now()}`;
    const r = await exec(sql`INSERT INTO routings (routing_number, product_id, version) VALUES (${routingNumber}, ${body.productId ?? null}, ${body.version ?? 1}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteRouting(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM routings WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createRoutingOperation(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO pp_routing_operations (routing_id, sequence_no, work_center_id, planned_duration) VALUES (${body.routingId ?? null}, ${body.sequenceNo ?? body.operationNumber ?? 1}, ${body.workCenterId ?? null}, ${body.plannedDuration ?? 0}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteRoutingOperation(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM pp_routing_operations WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }
}
