/**
 * @module mm-vendors-pr.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { db, mm_vendors, mm_purchase_requisitions , runQuery } from '@shared/db';
import { execMmPrItemInsert } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;

@Injectable()
export class MmVendorsPrRepository {
  async listVendors(pat: string | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT * FROM mm_vendors
        WHERE ${pat}::text IS NULL OR name ILIKE ${pat} OR code ILIKE ${pat}
        ORDER BY name LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVendor(id: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`SELECT * FROM mm_vendors WHERE id = ${id}`);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createVendor(body: Row): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO mm_vendors (name, code, contact_person, phone, email, address, payment_terms, currency)
        VALUES (${body.name}, ${body.code ?? null}, ${body.contact_person ?? null}, ${body.phone ?? null}, ${body.email ?? null}, ${body.address ?? null}, ${body.payment_terms ?? 30}, ${body.currency ?? 'UZS'})
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateVendor(id: number, body: Row): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        UPDATE mm_vendors
        SET name = COALESCE(${body.name ?? null}, name),
            contact_person = COALESCE(${body.contact_person ?? null}, contact_person),
            phone = COALESCE(${body.phone ?? null}, phone),
            email = COALESCE(${body.email ?? null}, email),
            address = COALESCE(${body.address ?? null}, address),
            payment_terms = COALESCE(${body.payment_terms ?? null}, payment_terms),
            is_active = COALESCE(${body.is_active ?? null}, is_active),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteVendor(id: number): Promise<Result<void>>  {
  try {  
      await db.delete(mm_vendors).where(eq(mm_vendors.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRequisitions(status: string | undefined, lim: number, off: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT pr.*, e.full_name AS requested_by_name
        FROM mm_purchase_requisitions pr
        LEFT JOIN employees e ON e.id = pr.requested_by
        WHERE ${status ?? null}::text IS NULL OR pr.status = ${status ?? null}
        ORDER BY pr.created_at DESC LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getRequisitionHeader(rid: number): Promise<Result<Row | null>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT pr.*, e.full_name AS requested_by_name
        FROM mm_purchase_requisitions pr
        LEFT JOIN employees e ON e.id = pr.requested_by
        WHERE pr.id = ${rid}
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getRequisitionItems(rid: number): Promise<Result<unknown[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT pri.*, m.name AS material_name, m.unit_of_measure
        FROM mm_purchase_requisition_items pri
        LEFT JOIN mm_materials m ON m.id = pri.material_id
        WHERE pri.requisition_id = ${rid}
      `);
      return Ok(rows.rows as Record<string, unknown>[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createRequisition(title: unknown, requested_by: number | null, needed_by: unknown, notes: unknown): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO mm_purchase_requisitions (title, requested_by, needed_by, notes, status)
        VALUES (${title}, ${requested_by}, ${needed_by ?? null}, ${notes ?? null}, 'pending')
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createRequisitionItem(requisition_id: unknown, material_id: unknown, quantity: unknown, unit_price: unknown): Promise<Result<void>>  {
  try {  
      await execMmPrItemInsert(requisition_id, material_id, quantity, unit_price);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateRequisition(rid: number, body: Row): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        UPDATE mm_purchase_requisitions
        SET title = COALESCE(${body.title ?? null}, title),
            status = COALESCE(${body.status ?? null}, status),
            needed_by = COALESCE(${body.needed_by ?? null}, needed_by),
            notes = COALESCE(${body.notes ?? null}, notes),
            updated_at = NOW()
        WHERE id = ${rid} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteRequisition(rid: number): Promise<Result<void>>  {
  try {  
      await db.delete(mm_purchase_requisitions).where(eq(mm_purchase_requisitions.id, rid));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
