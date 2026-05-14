/**
 * @module warehouse-rental.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeInt } from '../../hr/common/db-rows';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class WarehouseRentalRepository {
  async getRecords(status?: string): Promise<Result<Row[]>>  {
  try {  
      return status
        ? exec(sql`SELECT wr.* FROM warehouse_rental_records wr WHERE wr.status = ${status} ORDER BY wr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT wr.* FROM warehouse_rental_records wr ORDER BY wr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createRecord(body: Row, userId: number | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO warehouse_rental_records (warehouse_id, customer_id, area_m2, daily_rate_per_m2, free_days, start_date, end_date, managed_by, notes, status) VALUES (${safeInt(String(body.warehouseId ?? body.warehouse_id ?? 0), 0)}, ${body.customerId ?? body.customer_id ?? null}, ${body.areaM2 ?? body.area_m2 ?? 0}, ${body.dailyRatePerM2 ?? body.daily_rate_per_m2 ?? 0}, ${body.freeDays ?? body.free_days ?? 0}, ${body.startDate ?? body.start_date ?? 'TODAY'}, ${body.endDate ?? body.end_date ?? null}, ${userId}, ${body.notes ?? null}, 'active') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSummary(): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS active_rentals, COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_rentals, COALESCE(SUM(total_amount) FILTER (WHERE status = 'active'), 0)::numeric(15,2) AS active_value, COALESCE(SUM(total_amount) FILTER (WHERE status = 'closed'), 0)::numeric(15,2) AS collected, 0::numeric(15,2) AS outstanding FROM warehouse_rental_records`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSettings(): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`SELECT * FROM warehouse_rental_settings ORDER BY updated_at DESC LIMIT 1`);
      return r.ok ? Ok(r.data[0] ?? { default_daily_rate: 0, default_free_days: 0 }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateSettings(body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO warehouse_rental_settings (default_daily_rate, default_free_days, notify_days_before, updated_at) VALUES (${body.defaultDailyRate ?? body.default_daily_rate ?? 0}, ${body.defaultFreeDays ?? body.default_free_days ?? 0}, ${body.notifyDaysBefore ?? body.notify_days_before ?? 8}, NOW()) ON CONFLICT DO NOTHING RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? body) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async closeRecord(id: number, userId: number | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE warehouse_rental_records SET status = 'closed', closed_by = ${userId}, closed_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async markPaid(id: number, userId: number | null, notes?: string): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE warehouse_rental_records SET paid_at = NOW(), paid_by = ${userId}, payment_notes = ${notes ?? null} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
