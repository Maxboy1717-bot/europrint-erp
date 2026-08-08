/**
 * @module mm-vendors-pr.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (MM)
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { db, mm_vendors, mm_purchase_requisitions, runQuery } from '@shared/db';
import { execMmPrItemInsert } from '@common/database/queries-remaining';
import type { IMmVendorsPrRepo } from '../../domain/repositories/i-mm-vendors-pr.repo';

type Row = Record<string, unknown>;

@Injectable()
export class MmVendorsPrRepository implements IMmVendorsPrRepo {
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
        INSERT INTO mm_vendors (name, code, contact_person, phone, email, address, payment_terms, currency, is_vat_payer)
        VALUES (${body.name}, ${body.code ?? null}, ${body.contact_person ?? null}, ${body.phone ?? null}, ${body.email ?? null}, ${body.address ?? null}, ${body.payment_terms ?? 30}, ${body.currency ?? 'UZS'}, ${body.is_vat_payer ?? true})
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
            is_vat_payer = COALESCE(${body.is_vat_payer ?? null}, is_vat_payer),
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
      // vision 11-mm#10: expose an `overdue_days` computed field ('+N kun' warning)
      // for the approver dashboard. Display-only — the requisition status is NEVER
      // auto-changed (no auto-reject). NULL-safe (0 when needed_by unset) and
      // clamped to >= 0 (never negative for not-yet-due requisitions).
      const rows = await runQuery<Row>(sql`
        SELECT pr.*, e.full_name AS requested_by_name,
               CASE WHEN pr.needed_by IS NOT NULL AND pr.needed_by < CURRENT_DATE
                    THEN (CURRENT_DATE - pr.needed_by) ELSE 0 END AS overdue_days
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

  /**
   * Q-46 (2026-07-02): `mm_purchase_requisitions` is a plain updatable VIEW —
   * `SELECT * FROM purchase_requisitions` (pg_get_viewdef-verified) — so an INSERT
   * through it is transparently rewritten by Postgres into an INSERT on the base
   * table `purchase_requisitions`, which enforces NOT NULL on requisition_number,
   * material_id, required_quantity and required_date. The previous 4-column INSERT
   * (title, requested_by, needed_by, notes) always violated those and threw 23502
   * — silently swallowed by the try/catch here, surfaced only as a generic 400/500
   * to the caller. Fix: supply requisition_number (generated from the
   * `purchase_requisition_seq` sequence, same one the canonical schema declares),
   * material_id + required_quantity (the requisition's first real item — passed in
   * by the service, never fabricated), and required_date (needed_by if given, else
   * today — required_date is `varchar(10)` 'YYYY-MM-DD', not a real date column).
   */
  async createRequisition(
    title: unknown,
    requested_by: number | null,
    needed_by: unknown,
    notes: unknown,
    material_id: number,
    required_quantity: number,
  ): Promise<Result<Row>>  {
  try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO mm_purchase_requisitions
          (requisition_number, material_id, required_quantity, required_date,
           title, requested_by, needed_by, notes, status)
        VALUES (
          'PR-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('purchase_requisition_seq')::text, 6, '0'),
          ${material_id}, ${required_quantity},
          COALESCE(${needed_by ?? null}::text, to_char(NOW(), 'YYYY-MM-DD')),
          ${title}, ${requested_by}, ${needed_by ?? null}::date, ${notes ?? null}, 'pending'
        )
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

  /**
   * #11.13: write back the PO id onto the source requisition. Runs through the
   * `mm_purchase_requisitions` VIEW (base `purchase_requisitions`) — the same
   * updatable view createRequisition() already inserts through. purchase_order_id
   * is a nullable base column, so the UPDATE rewrites cleanly to the base table.
   */
  async setRequisitionPurchaseOrderId(rid: number, poId: number): Promise<Result<void>>  {
  try {
      await runQuery(sql`
        UPDATE mm_purchase_requisitions
        SET purchase_order_id = ${poId}, updated_at = NOW()
        WHERE id = ${rid}
      `);
      return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
