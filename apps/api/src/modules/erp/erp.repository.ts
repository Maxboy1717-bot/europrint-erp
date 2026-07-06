/**
 * @module erp.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall, AppErr } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpRepository {
  async listProducts(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category ORDER BY mc.xom_ashyo LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProduct(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT mc.*, mc.xom_ashyo AS name, c.name AS category_name FROM material_cards mc LEFT JOIN material_categories c ON c.name = mc.category WHERE mc.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateProduct(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE material_cards SET xom_ashyo = COALESCE(${body.name ?? null}, xom_ashyo), unit_of_measure = COALESCE(${body.unit ?? null}, unit_of_measure), min_stock = COALESCE(${body.minStock ?? null}, min_stock), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBomHeaders(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bh.*, mc.xom_ashyo AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON mc.id = bh.product_id ORDER BY bh.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBomHeader(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT bh.*, mc.xom_ashyo AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON mc.id = bh.product_id WHERE bh.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async bomExplosion(id: number, quantity: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bi.*, mc.xom_ashyo AS material_name, mc.unit_of_measure AS unit, (bi.quantity * ${quantity}) AS required_qty FROM bom_items bi LEFT JOIN material_cards mc ON mc.id = bi.material_id WHERE bi.bom_id = ${id} ORDER BY bi.id`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBomItems(bomHeaderId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT bi.*, mc.xom_ashyo AS material_name, mc.unit_of_measure AS unit FROM bom_items bi LEFT JOIN material_cards mc ON mc.id = bi.material_id WHERE bi.bom_id = ${bomHeaderId} ORDER BY bi.id`);  } catch (_e) {
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
      return exec(sql`SELECT rt.*, mc.xom_ashyo AS product_name FROM routings rt LEFT JOIN material_cards mc ON mc.id = rt.product_id ORDER BY rt.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getRouting(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT rt.*, mc.xom_ashyo AS product_name FROM routings rt LEFT JOIN material_cards mc ON mc.id = rt.product_id WHERE rt.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRoutingOperations(routingId?: number): Promise<Result<Row[]>>  {
  try {  
      return routingId
        ? exec(sql`SELECT ro.*, ro.operation_description AS operation_name, wc.name AS work_center_name FROM routing_operations ro LEFT JOIN work_centers wc ON wc.id = ro.work_center_id WHERE ro.routing_id = ${routingId} ORDER BY ro.routing_id, ro.sequence LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT ro.*, ro.operation_description AS operation_name, wc.name AS work_center_name FROM routing_operations ro LEFT JOIN work_centers wc ON wc.id = ro.work_center_id ORDER BY ro.routing_id, ro.sequence LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createProduct(body: Row): Promise<Result<Row | null>> {
  try {
    const code = body.code ?? `MC-${Date.now()}`;
    const r = await exec(sql`INSERT INTO material_cards (kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, is_active) VALUES (${code}, ${body.name ?? 'Yangi mahsulot'}, ${body.nameRu ?? null}, ${body.unit ?? 'dona'}, ${body.isActive ?? true}) RETURNING *`);
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
    // C6.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): bom_items has no FK to
    // bom_headers (its only FK is component_id→material_cards, NO ACTION) —
    // deleting a header alone left its line items orphaned (deleteBomItem was
    // never called on header delete). Cascade the delete atomically instead.
    const headerRow = await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM bom_items WHERE bom_id = ${id}`);
      const r = await tx.execute(sql`DELETE FROM bom_headers WHERE id = ${id} RETURNING *`);
      return ((r as unknown as { rows: Row[] }).rows[0]) ?? null;
    });
    return Ok(headerRow ?? { id, deleted: true });
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteBomItem(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM bom_items WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  /**
   * DEPRECATED (Q-46): ERP legacy write path duplicated the PP canonical
   * `routings`/`routing_operations` tables with raw SQL and no awareness of
   * PP's approval workflow (draft → approved, technologist/director RBAC —
   * see PpRoutingController / RoutingsService @ apps/api/src/modules/pp).
   * Writing here let callers create/mutate routings that PP never saw and
   * that skipped approval entirely — a two-world write hazard. Blocked;
   * real routing CRUD lives at POST/PATCH/DELETE /api/pp/routing.
   * GET /erp/routings + /erp/routing-operations stay live (read-only,
   * same canonical tables, still consumed by the SD order wizard).
   */
  async createRouting(_body: Row): Promise<Result<Row | null>> {
    return Err(AppErr(
      'NOT_IMPLEMENTED',
      "ERP legacy routing eskirgan (DEPRECATED): PP tasdiqlash jarayonidan bexabar yozadi. Real routing CRUD uchun PP moduli — POST /api/pp/routing ishlating.",
    ));
  }

  /** DEPRECATED (Q-46): see {@link createRouting}. */
  async deleteRouting(_id: number): Promise<Result<Row | null>> {
    return Err(AppErr(
      'NOT_IMPLEMENTED',
      "ERP legacy routing eskirgan (DEPRECATED): PP tasdiqlash jarayonidan bexabar o'chiradi. Real routing CRUD uchun PP moduli — DELETE /api/pp/routing/:id ishlating.",
    ));
  }

  /** DEPRECATED (Q-46): see {@link createRouting}. */
  async createRoutingOperation(_body: Row): Promise<Result<Row | null>> {
    return Err(AppErr(
      'NOT_IMPLEMENTED',
      "ERP legacy routing operatsiyasi eskirgan (DEPRECATED): PP tasdiqlash jarayonidan bexabar yozadi. Real operatsiya CRUD uchun PP moduli — POST /api/pp/routing/:routingId/operations ishlating.",
    ));
  }

  /** DEPRECATED (Q-46): see {@link createRouting}. */
  async updateRoutingOperation(_id: number, _body: Row): Promise<Result<Row | null>> {
    return Err(AppErr(
      'NOT_IMPLEMENTED',
      "ERP legacy routing operatsiyasi eskirgan (DEPRECATED): PP tasdiqlash jarayonidan bexabar yozadi. Real operatsiya CRUD uchun PP moduli — POST /api/pp/routing ishlating.",
    ));
  }

  /** DEPRECATED (Q-46): see {@link createRouting}. */
  async deleteRoutingOperation(_id: number): Promise<Result<Row | null>> {
    return Err(AppErr(
      'NOT_IMPLEMENTED',
      "ERP legacy routing operatsiyasi eskirgan (DEPRECATED): PP tasdiqlash jarayonidan bexabar o'chiradi. Real operatsiya CRUD uchun PP moduli — DELETE /api/pp/routing/:routingId/operations/:opId ishlating.",
    ));
  }
}
